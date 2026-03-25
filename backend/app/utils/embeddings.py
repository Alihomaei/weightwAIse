"""Gemini Embedding 2 multimodal embedding helper.

Uses models/gemini-embedding-exp-03-07 for both text and image embeddings,
storing everything in a single Pinecone index.
"""

import base64
import logging
from pathlib import Path

import google.generativeai as genai
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini once at module level
genai.configure(api_key=settings.GEMINI_API_KEY)


async def embed_text(text: str) -> list[float]:
    """Embed a text string using Gemini Embedding model.

    Returns a vector of dimension settings.GEMINI_EMBEDDING_DIMENSION.
    """
    try:
        result = genai.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL,
            content=text,
            task_type="RETRIEVAL_DOCUMENT",
        )
        return result["embedding"]
    except Exception as e:
        logger.error("Text embedding failed: %s", e)
        raise


async def embed_query(query: str) -> list[float]:
    """Embed a query string (uses RETRIEVAL_QUERY task type for better search)."""
    try:
        result = genai.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL,
            content=query,
            task_type="RETRIEVAL_QUERY",
        )
        return result["embedding"]
    except Exception as e:
        logger.error("Query embedding failed: %s", e)
        raise


async def embed_image(image_path: str, caption: str | None = None) -> list[float]:
    """Embed an image (optionally with caption) using Gemini multimodal embedding.

    The image is loaded and sent as inline data to the embedding model.
    """
    try:
        img = Image.open(image_path)

        # Build content parts: image + optional caption
        content_parts = [img]
        if caption:
            content_parts.append(caption)

        result = genai.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL,
            content=content_parts,
            task_type="RETRIEVAL_DOCUMENT",
        )
        return result["embedding"]
    except Exception as e:
        logger.error("Image embedding failed for %s: %s", image_path, e)
        raise


async def embed_image_bytes(image_bytes: bytes, mime_type: str = "image/png",
                            caption: str | None = None) -> list[float]:
    """Embed raw image bytes with optional caption."""
    try:
        import io
        img = Image.open(io.BytesIO(image_bytes))

        content_parts = [img]
        if caption:
            content_parts.append(caption)

        result = genai.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL,
            content=content_parts,
            task_type="RETRIEVAL_DOCUMENT",
        )
        return result["embedding"]
    except Exception as e:
        logger.error("Image bytes embedding failed: %s", e)
        raise


def image_to_base64(image_path: str) -> str:
    """Convert an image file to base64 string for metadata storage."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def base64_to_image_bytes(b64_string: str) -> bytes:
    """Convert base64 string back to image bytes."""
    return base64.b64decode(b64_string)
