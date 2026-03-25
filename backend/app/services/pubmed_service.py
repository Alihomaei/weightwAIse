"""PubMed ingestion pipeline — NCBI E-utilities search, fetch, chunk, embed, store.

Supports both abstract-only and PMC full-text papers.
Rate-limited to respect NCBI guidelines (3 req/sec without key, 10/sec with key).
"""

import asyncio
import json
import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

import httpx

from app.config import settings
from app.utils.chunking import chunk_text_recursive
from app.utils.embeddings import embed_text

logger = logging.getLogger(__name__)

EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
PMC_OA_BASE = "https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi"

# Rate limiting: 3/sec without key, 10/sec with key
_has_real_key = (
    settings.NCBI_API_KEY
    and settings.NCBI_API_KEY != "replace_with_real_ncbi_key"
)
RATE_LIMIT_DELAY = 0.1 if _has_real_key else 0.34  # seconds between requests


def _eutils_params() -> dict:
    """Common query params for NCBI E-utilities."""
    params = {"tool": "weightwaise", "email": settings.NCBI_EMAIL}
    if _has_real_key:
        params["api_key"] = settings.NCBI_API_KEY
    return params


async def search_pubmed(query: str, max_results: int = 50) -> list[str]:
    """Search PubMed and return a list of PMIDs."""
    params = {
        **_eutils_params(),
        "db": "pubmed",
        "term": query,
        "retmax": str(max_results),
        "sort": "date",
        "retmode": "json",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{EUTILS_BASE}/esearch.fcgi", params=params)
        resp.raise_for_status()
        data = resp.json()
        return data.get("esearchresult", {}).get("idlist", [])


async def fetch_abstracts(pmids: list[str]) -> list[dict]:
    """Fetch article details (title, abstract, authors, journal, date) for PMIDs.

    Returns a list of parsed article dicts.
    """
    if not pmids:
        return []

    params = {
        **_eutils_params(),
        "db": "pubmed",
        "id": ",".join(pmids),
        "rettype": "xml",
        "retmode": "xml",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.get(f"{EUTILS_BASE}/efetch.fcgi", params=params)
        resp.raise_for_status()

    articles = []
    try:
        root = ET.fromstring(resp.text)
        for article_el in root.findall(".//PubmedArticle"):
            art = _parse_pubmed_article(article_el)
            if art:
                articles.append(art)
    except ET.ParseError as e:
        logger.error("Failed to parse PubMed XML: %s", e)

    return articles


def _parse_pubmed_article(article_el: ET.Element) -> dict | None:
    """Parse a single PubmedArticle XML element into a dict."""
    try:
        medline = article_el.find(".//MedlineCitation")
        if medline is None:
            return None

        pmid_el = medline.find(".//PMID")
        pmid = pmid_el.text if pmid_el is not None else ""

        article = medline.find(".//Article")
        if article is None:
            return None

        # Title
        title_el = article.find(".//ArticleTitle")
        title = title_el.text if title_el is not None else ""

        # Abstract
        abstract_parts = []
        abstract_el = article.find(".//Abstract")
        if abstract_el is not None:
            for abs_text in abstract_el.findall(".//AbstractText"):
                label = abs_text.get("Label", "")
                text = abs_text.text or ""
                if label:
                    abstract_parts.append(f"{label}: {text}")
                else:
                    abstract_parts.append(text)
        abstract = "\n".join(abstract_parts)

        # Authors
        authors = []
        for author_el in article.findall(".//Author"):
            last = author_el.findtext("LastName", "")
            first = author_el.findtext("ForeName", "")
            if last:
                authors.append(f"{last} {first}".strip())
        authors_str = ", ".join(authors[:10])  # Limit to 10 authors
        if len(authors) > 10:
            authors_str += " et al."

        # Journal
        journal_el = article.find(".//Journal/Title")
        journal = journal_el.text if journal_el is not None else ""

        # Date
        pub_date = ""
        date_el = article.find(".//ArticleDate")
        if date_el is None:
            date_el = article.find(".//Journal/JournalIssue/PubDate")
        if date_el is not None:
            year = date_el.findtext("Year", "")
            month = date_el.findtext("Month", "01")
            day = date_el.findtext("Day", "01")
            pub_date = f"{year}-{month.zfill(2)}-{day.zfill(2)}" if year else ""

        # PMC ID
        pmc_id = ""
        for id_el in article_el.findall(".//ArticleIdList/ArticleId"):
            if id_el.get("IdType") == "pmc":
                pmc_id = id_el.text or ""
                break

        return {
            "pmid": pmid,
            "pmc_id": pmc_id,
            "title": title,
            "abstract": abstract,
            "authors": authors_str,
            "journal": journal,
            "pub_date": pub_date,
        }
    except Exception as e:
        logger.error("Error parsing article: %s", e)
        return None


async def fetch_pmc_fulltext(pmc_id: str) -> str | None:
    """Try to fetch full text from PMC Open Access.

    Returns the full text as a string, or None if not available.
    """
    if not pmc_id:
        return None

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Fetch full text XML from PMC
            params = {
                **_eutils_params(),
                "db": "pmc",
                "id": pmc_id,
                "rettype": "xml",
                "retmode": "xml",
            }
            resp = await client.get(f"{EUTILS_BASE}/efetch.fcgi", params=params)
            if resp.status_code != 200:
                return None

            # Parse and extract text sections
            root = ET.fromstring(resp.text)
            sections = []
            for sec in root.findall(".//sec"):
                title_el = sec.find("title")
                sec_title = title_el.text if title_el is not None else ""
                paragraphs = []
                for p in sec.findall(".//p"):
                    text = "".join(p.itertext()).strip()
                    if text:
                        paragraphs.append(text)
                if paragraphs:
                    section_text = f"## {sec_title}\n\n" + "\n\n".join(paragraphs) if sec_title else "\n\n".join(paragraphs)
                    sections.append(section_text)

            return "\n\n".join(sections) if sections else None

    except Exception as e:
        logger.error("Failed to fetch PMC full text for %s: %s", pmc_id, e)
        return None


async def ingest_papers(
    articles: list[dict],
    pinecone_index,
    existing_pmids: set[str],
) -> tuple[int, int, list[str]]:
    """Chunk, embed, and store papers in Pinecone.

    Returns (new_papers_count, total_chunks, errors).
    """
    new_papers = 0
    total_chunks = 0
    errors: list[str] = []
    all_vectors = []

    for article in articles:
        pmid = article["pmid"]
        if pmid in existing_pmids:
            continue

        source_id = f"pubmed_{pmid}"
        new_papers += 1

        # Try to get full text from PMC
        full_text = None
        if article.get("pmc_id"):
            await asyncio.sleep(RATE_LIMIT_DELAY)
            full_text = await fetch_pmc_fulltext(article["pmc_id"])

        # Chunk the content
        if full_text:
            # Full text: chunk by sections
            raw_chunks = chunk_text_recursive(full_text, max_chars=3200, overlap_chars=400)
        elif article.get("abstract"):
            # Abstract only: single or few chunks
            raw_chunks = [article["abstract"]]
        else:
            errors.append(f"PMID {pmid}: no abstract or full text")
            continue

        # Embed and prepare vectors
        for idx, chunk_text in enumerate(raw_chunks):
            chunk_id = f"{source_id}_c{idx}"
            try:
                embedding = await embed_text(chunk_text)
                all_vectors.append({
                    "id": chunk_id,
                    "values": embedding,
                    "metadata": {
                        "source_id": source_id,
                        "source_type": "pubmed",
                        "modality": "text",
                        "page_num": 0,
                        "section_title": article.get("title", ""),
                        "chunk_index": idx,
                        "text": chunk_text[:4000],
                        "pmid": pmid,
                        "pmc_id": article.get("pmc_id", ""),
                        "title": article.get("title", ""),
                        "authors": article.get("authors", ""),
                        "journal": article.get("journal", ""),
                        "pub_date": article.get("pub_date", ""),
                        "ingested_at": datetime.now(timezone.utc).isoformat(),
                    },
                })
                total_chunks += 1
            except Exception as e:
                errors.append(f"PMID {pmid} chunk {idx}: {e}")

            await asyncio.sleep(RATE_LIMIT_DELAY)

    # Upsert to Pinecone in batches
    if all_vectors:
        for i in range(0, len(all_vectors), 100):
            batch = all_vectors[i:i + 100]
            try:
                pinecone_index.upsert(vectors=batch)
            except Exception as e:
                errors.append(f"Pinecone upsert error: {e}")

    return new_papers, total_chunks, errors


async def run_pubmed_update(
    queries: list[str],
    max_results_per_query: int,
    pinecone_index,
    existing_pmids: set[str],
) -> dict:
    """Execute a full PubMed update cycle: search, fetch, ingest.

    Returns a summary dict with counts and errors.
    """
    all_articles = []
    all_pmids: set[str] = set()
    errors: list[str] = []

    for query in queries:
        try:
            pmids = await search_pubmed(query, max_results=max_results_per_query)
            await asyncio.sleep(RATE_LIMIT_DELAY)

            # Filter already-ingested
            new_pmids = [p for p in pmids if p not in existing_pmids and p not in all_pmids]
            if not new_pmids:
                continue

            # Fetch in batches of 50
            for i in range(0, len(new_pmids), 50):
                batch = new_pmids[i:i + 50]
                articles = await fetch_abstracts(batch)
                all_articles.extend(articles)
                all_pmids.update(batch)
                await asyncio.sleep(RATE_LIMIT_DELAY)

        except Exception as e:
            errors.append(f"Query '{query}': {e}")

    new_papers, total_chunks, ingest_errors = await ingest_papers(
        all_articles, pinecone_index, existing_pmids
    )
    errors.extend(ingest_errors)

    return {
        "new_papers": new_papers,
        "total_chunks": total_chunks,
        "errors": errors,
        "articles": all_articles,  # For creating KBSource records
    }
