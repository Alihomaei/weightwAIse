"""RAG retrieval engine — query Pinecone, rerank, format citations.

All chunks (text + images, guidelines + pubmed) live in a single Pinecone index
with metadata filters for source_type and modality.
"""

import json
import logging
from dataclasses import dataclass, field

import google.generativeai as genai

from app.config import settings
from app.utils.embeddings import embed_query

logger = logging.getLogger(__name__)


@dataclass
class RetrievedChunk:
    """A chunk retrieved from the vector store."""
    chunk_id: str
    content: str  # text content or caption for images
    image_path: str | None = None
    source_title: str = ""
    source_type: str = ""  # guideline_pdf, guideline_pptx, guideline_video, guideline_text, pubmed
    modality: str = "text"  # text or image
    metadata: dict = field(default_factory=dict)
    relevance_score: float = 0.0


@dataclass
class Citation:
    """Citation object for a retrieved chunk used in a response."""
    source_title: str
    source_type: str
    page_or_section: str | None = None
    pubmed_id: str | None = None
    chunk_id: str = ""

    def to_dict(self) -> dict:
        return {
            "source_title": self.source_title,
            "source_type": self.source_type,
            "page_or_section": self.page_or_section,
            "pubmed_id": self.pubmed_id,
            "chunk_id": self.chunk_id,
        }


async def retrieve(
    query: str,
    pinecone_index,
    top_k: int = 10,
    source_types: list[str] | None = None,
    modality: str | None = None,
) -> list[RetrievedChunk]:
    """Query Pinecone with embedded query, apply metadata filters, return ranked chunks.

    Args:
        query: The user query to search for.
        pinecone_index: Pinecone index object.
        top_k: Number of results to return.
        source_types: Filter by source types (e.g., ["guideline_pdf", "pubmed"]).
        modality: Filter by modality ("text" or "image").

    Returns:
        List of RetrievedChunk objects sorted by relevance.
    """
    # Embed the query
    query_vector = await embed_query(query)

    # Build metadata filter
    filters = {}
    if source_types:
        filters["source_type"] = {"$in": source_types}
    if modality:
        filters["modality"] = modality

    # Query Pinecone
    query_kwargs = {
        "vector": query_vector,
        "top_k": top_k * 2,  # Over-fetch for reranking
        "include_metadata": True,
    }
    if filters:
        query_kwargs["filter"] = filters

    try:
        results = pinecone_index.query(**query_kwargs)
    except Exception as e:
        logger.error("Pinecone query failed: %s", e)
        return []

    # Parse results into RetrievedChunk objects
    chunks = []
    for match in results.get("matches", []):
        meta = match.get("metadata", {})
        chunk = RetrievedChunk(
            chunk_id=match["id"],
            content=meta.get("text", ""),
            image_path=meta.get("image_path"),
            source_title=meta.get("title", meta.get("section_title", "")),
            source_type=meta.get("source_type", ""),
            modality=meta.get("modality", "text"),
            metadata=meta,
            relevance_score=match.get("score", 0.0),
        )
        chunks.append(chunk)

    # Rerank using Gemini Flash for better relevance
    if len(chunks) > top_k:
        chunks = await _rerank(query, chunks, top_k)
    else:
        chunks.sort(key=lambda c: c.relevance_score, reverse=True)

    return chunks[:top_k]


async def _rerank(
    query: str, chunks: list[RetrievedChunk], top_k: int
) -> list[RetrievedChunk]:
    """Rerank chunks using Gemini Flash for lightweight relevance scoring.

    Falls back to vector similarity scores if reranking fails.
    """
    try:
        model = genai.GenerativeModel(settings.GEMINI_FLASH_MODEL)

        # Build reranking prompt
        chunk_descriptions = []
        for i, chunk in enumerate(chunks[:20]):  # Limit to 20 for speed
            text_preview = chunk.content[:300] if chunk.content else "(image)"
            chunk_descriptions.append(f"[{i}] {text_preview}")

        prompt = f"""Rank the following document chunks by relevance to the query. Return a JSON array of indices in order of relevance (most relevant first).

Query: {query}

Chunks:
{chr(10).join(chunk_descriptions)}

Return ONLY a JSON array of indices, e.g., [3, 0, 7, 1, ...]"""

        response = await model.generate_content_async(prompt)
        text = response.text.strip()

        # Parse the JSON array
        # Handle markdown code blocks
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

        indices = json.loads(text)
        if isinstance(indices, list):
            reranked = []
            seen = set()
            for idx in indices:
                if isinstance(idx, int) and 0 <= idx < len(chunks) and idx not in seen:
                    reranked.append(chunks[idx])
                    seen.add(idx)
            # Add any remaining chunks not in the reranked list
            for i, chunk in enumerate(chunks):
                if i not in seen:
                    reranked.append(chunk)
            return reranked[:top_k]

    except Exception as e:
        logger.warning("Reranking failed, falling back to vector scores: %s", e)

    # Fallback: sort by vector similarity score
    chunks.sort(key=lambda c: c.relevance_score, reverse=True)
    return chunks[:top_k]


def format_context(chunks: list[RetrievedChunk]) -> str:
    """Format retrieved chunks into a context string for the LLM prompt."""
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        source_info = f"[{i}] Source: {chunk.source_title or chunk.source_type}"
        if chunk.metadata.get("page_num"):
            source_info += f", Page {chunk.metadata['page_num']}"
        if chunk.metadata.get("pmid"):
            source_info += f", PMID: {chunk.metadata['pmid']}"

        if chunk.modality == "image":
            context_parts.append(
                f"{source_info}\n[Image: {chunk.metadata.get('caption', 'No caption')}]"
            )
        else:
            context_parts.append(f"{source_info}\n{chunk.content}")

    return "\n\n---\n\n".join(context_parts)


def chunks_to_citations(chunks: list[RetrievedChunk]) -> list[Citation]:
    """Convert retrieved chunks to citation objects."""
    citations = []
    for chunk in chunks:
        page_or_section = None
        if chunk.metadata.get("page_num"):
            page_or_section = f"Page {chunk.metadata['page_num']}"
        elif chunk.metadata.get("section_title"):
            page_or_section = chunk.metadata["section_title"]

        citations.append(Citation(
            source_title=chunk.source_title or chunk.source_type,
            source_type=chunk.source_type,
            page_or_section=page_or_section,
            pubmed_id=chunk.metadata.get("pmid"),
            chunk_id=chunk.chunk_id,
        ))
    return citations
