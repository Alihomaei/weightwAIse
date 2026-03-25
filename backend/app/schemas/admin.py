"""Admin panel request/response schemas."""

from datetime import datetime, date
from typing import Any
from pydantic import BaseModel, Field


# --- Dashboard ---
class DashboardStats(BaseModel):
    total_patients: int
    active_sessions: int
    total_kb_sources: int
    total_kb_chunks: int
    total_pubmed_papers: int
    recent_sessions: list[dict[str, Any]] = []


# --- Knowledge Base ---
class KBSourceResponse(BaseModel):
    id: str
    source_type: str
    filename: str | None
    title: str | None
    pubmed_id: str | None
    pmc_id: str | None
    authors: str | None
    publication_date: date | None
    total_chunks: int
    ingested_at: datetime
    status: str

    model_config = {"from_attributes": True}


class KBStatsResponse(BaseModel):
    total_sources: int
    active_sources: int
    total_chunks: int
    sources_by_type: dict[str, int]


class KBUploadResponse(BaseModel):
    source_id: str
    filename: str
    source_type: str
    total_chunks: int
    status: str
    message: str


# --- PubMed ---
class PubMedQueriesResponse(BaseModel):
    queries: list[str]
    max_results_per_query: int = 50


class PubMedQueriesUpdate(BaseModel):
    queries: list[str] = Field(..., min_length=1)
    max_results_per_query: int = Field(default=50, ge=1, le=500)


class PubMedUpdateResponse(BaseModel):
    new_papers: int
    total_chunks: int
    errors: list[str]
    message: str


class PubMedUpdateRequest(BaseModel):
    queries: list[str] | None = None  # Override queries (optional)


# --- Patients ---
class PatientListItem(BaseModel):
    id: str
    username: str
    full_name: str | None
    language_preference: str
    created_at: datetime
    total_sessions: int
    latest_session_type: str | None
    latest_decision_path: str | None

    model_config = {"from_attributes": True}


class PatientDetailResponse(BaseModel):
    id: str
    username: str
    full_name: str | None
    language_preference: str
    created_at: datetime
    intake: dict[str, Any] | None = None
    sessions: list[dict[str, Any]] = []


# --- Config ---
class ConfigResponse(BaseModel):
    key: str
    value: Any
    updated_at: datetime


class ConfigUpdate(BaseModel):
    value: Any
