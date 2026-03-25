"""KBSource ORM model — tracks ingested knowledge-base documents."""

import uuid
from datetime import datetime, timezone, date

from sqlalchemy import String, Integer, Text, DateTime, Date
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class KBSource(Base):
    __tablename__ = "kb_sources"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    source_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # guideline_pdf | guideline_pptx | guideline_video | guideline_text | pubmed
    filename: Mapped[str | None] = mapped_column(String(500), nullable=True)
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    pubmed_id: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    pmc_id: Mapped[str | None] = mapped_column(String(20), nullable=True)
    authors: Mapped[str | None] = mapped_column(Text, nullable=True)
    publication_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    total_chunks: Mapped[int] = mapped_column(Integer, default=0)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active | archived | failed
