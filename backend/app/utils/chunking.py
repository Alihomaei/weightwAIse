"""Document chunking strategies for different file formats.

Chunk sizes target ~500-800 tokens with 100-token overlap for text.
"""

import re
import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Approximate: 1 token ~ 4 characters for English
CHARS_PER_TOKEN = 4
TARGET_CHUNK_TOKENS = 650  # middle of 500-800 range
MAX_CHUNK_TOKENS = 800
OVERLAP_TOKENS = 100

TARGET_CHUNK_CHARS = TARGET_CHUNK_TOKENS * CHARS_PER_TOKEN
MAX_CHUNK_CHARS = MAX_CHUNK_TOKENS * CHARS_PER_TOKEN
OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN


@dataclass
class TextChunk:
    """A chunk of text extracted from a document."""
    text: str
    chunk_index: int
    page_num: int | None = None
    section_title: str | None = None
    metadata: dict = field(default_factory=dict)


@dataclass
class ImageChunk:
    """An image extracted from a document."""
    image_path: str  # path to saved image file
    caption: str | None = None
    chunk_index: int = 0
    page_num: int | None = None
    metadata: dict = field(default_factory=dict)


def chunk_text_recursive(
    text: str,
    max_chars: int = MAX_CHUNK_CHARS,
    overlap_chars: int = OVERLAP_CHARS,
    separators: list[str] | None = None,
) -> list[str]:
    """Recursive character text splitter.

    Tries to split on natural boundaries (paragraphs, sentences, words)
    before falling back to character-level splits.
    """
    if separators is None:
        separators = ["\n\n", "\n", ". ", ", ", " ", ""]

    if len(text) <= max_chars:
        return [text.strip()] if text.strip() else []

    # Ensure overlap is always less than max_chars to prevent infinite loops
    effective_overlap = min(overlap_chars, max_chars // 2)

    # Try each separator in order
    for sep in separators:
        if sep == "":
            # Last resort: hard split by character
            chunks = []
            start = 0
            step = max(max_chars - effective_overlap, 1)
            while start < len(text):
                end = min(start + max_chars, len(text))
                chunk = text[start:end].strip()
                if chunk:
                    chunks.append(chunk)
                start += step
            return chunks

        parts = text.split(sep)
        if len(parts) <= 1:
            continue

        # Merge parts into chunks of appropriate size
        chunks = []
        current_chunk = ""
        for part in parts:
            candidate = current_chunk + sep + part if current_chunk else part
            if len(candidate) <= max_chars:
                current_chunk = candidate
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                # If a single part exceeds max, recursively split it
                if len(part) > max_chars:
                    remaining_seps = separators[separators.index(sep) + 1:]
                    sub_chunks = chunk_text_recursive(
                        part, max_chars, overlap_chars, remaining_seps
                    )
                    chunks.extend(sub_chunks)
                    current_chunk = ""
                else:
                    current_chunk = part

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        if chunks:
            return chunks

    return [text.strip()] if text.strip() else []


def chunk_by_sections(text: str, page_num: int | None = None) -> list[TextChunk]:
    """Split text by detected section headers, then sub-chunk if too long.

    Section headers are detected by common patterns:
    - Lines in ALL CAPS
    - Lines starting with numbers (e.g., "1.1 Introduction")
    - Markdown headers (# Header)
    """
    header_pattern = re.compile(
        r'^(?:'
        r'#{1,4}\s+.+'        # Markdown headers
        r'|[A-Z][A-Z\s]{5,}$'  # ALL CAPS lines (>= 6 chars)
        r'|\d+\.[\d.]*\s+\w+' # Numbered sections
        r')',
        re.MULTILINE
    )

    sections: list[tuple[str | None, str]] = []
    matches = list(header_pattern.finditer(text))

    if not matches:
        # No sections detected: use recursive splitting
        raw_chunks = chunk_text_recursive(text)
        return [
            TextChunk(text=c, chunk_index=i, page_num=page_num)
            for i, c in enumerate(raw_chunks)
        ]

    # Extract text before first header
    if matches[0].start() > 0:
        preamble = text[:matches[0].start()].strip()
        if preamble:
            sections.append((None, preamble))

    # Extract each section
    for i, match in enumerate(matches):
        title = match.group().strip().lstrip("#").strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        if body:
            sections.append((title, body))

    # Sub-chunk each section if needed
    chunks: list[TextChunk] = []
    idx = 0
    for title, body in sections:
        if len(body) <= MAX_CHUNK_CHARS:
            chunks.append(TextChunk(
                text=body, chunk_index=idx,
                page_num=page_num, section_title=title
            ))
            idx += 1
        else:
            sub_chunks = chunk_text_recursive(body)
            for sc in sub_chunks:
                chunks.append(TextChunk(
                    text=sc, chunk_index=idx,
                    page_num=page_num, section_title=title
                ))
                idx += 1

    return chunks


def chunk_markdown(text: str) -> list[TextChunk]:
    """Chunk a markdown document by headers, then sub-chunk."""
    return chunk_by_sections(text)


def chunk_plain_text(text: str) -> list[TextChunk]:
    """Chunk plain text using recursive splitting."""
    raw = chunk_text_recursive(text)
    return [
        TextChunk(text=c, chunk_index=i)
        for i, c in enumerate(raw)
    ]
