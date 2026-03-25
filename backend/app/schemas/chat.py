"""Chat request/response schemas."""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class CreateSessionRequest(BaseModel):
    session_type: str = Field(default="intake", pattern="^(intake|consultation|follow_up)$")
    language: str = Field(default="en", pattern="^(en|es)$")


class SessionResponse(BaseModel):
    id: str
    user_id: str
    intake_id: str | None
    session_type: str
    status: str
    decision_path: str | None
    recommendation_summary: str | None
    created_at: datetime
    ended_at: datetime | None

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    language: str = Field(default="en", pattern="^(en|es)$")


class CitationSchema(BaseModel):
    source_title: str
    source_type: str
    page_or_section: str | None = None
    pubmed_id: str | None = None
    chunk_id: str


class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    citations: list[CitationSchema] = []
    extracted_fields: dict[str, Any] = {}
    model_used: str | None = None
    language: str = "en"
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatStreamEvent(BaseModel):
    """Schema for SSE stream events."""
    event: str  # "token" | "citations" | "extracted_fields" | "done" | "error"
    data: Any


class IntakeProgressResponse(BaseModel):
    """Current intake completion status."""
    total_fields: int
    collected_fields: int
    missing_fields: list[str]
    progress: float  # 0.0 to 1.0
    intake_complete: bool
