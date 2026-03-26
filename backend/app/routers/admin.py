"""Admin routes — dashboard, KB management, PubMed config, patient records, settings."""

import os
import uuid
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.admin import (
    ConfigResponse,
    ConfigUpdate,
    DashboardStats,
    KBSourceResponse,
    KBStatsResponse,
    KBUploadResponse,
    PatientDetailResponse,
    PatientListItem,
    PubMedQueriesResponse,
    PubMedQueriesUpdate,
    PubMedUpdateRequest,
    PubMedUpdateResponse,
)
from app.services.admin_service import (
    delete_kb_source,
    get_config,
    get_dashboard_stats,
    get_kb_sources,
    get_kb_stats,
    get_patient_detail,
    get_pubmed_queries,
    get_session_messages,
    list_patients,
    set_config,
    trigger_pubmed_update,
    update_pubmed_queries,
    upload_document,
)
from app.services.auth_service import require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

# All admin routes require admin role
admin_dep = Depends(require_role("admin"))


def _get_pinecone_index(request: Request):
    return getattr(request.app.state, "pinecone_index", None)


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@router.get("/dashboard/stats", response_model=DashboardStats)
async def dashboard_stats(
    user: Annotated[User, admin_dep],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get admin dashboard summary statistics."""
    return await get_dashboard_stats(db)


# ---------------------------------------------------------------------------
# Knowledge Base
# ---------------------------------------------------------------------------

@router.post("/knowledge-base/upload")
async def upload_kb_document(
    request: Request,
    user: Annotated[User, admin_dep],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
    title: str = Form(None),
):
    """Upload a document and start ingestion in the background."""
    import asyncio
    from app.database import AsyncSessionLocal

    # Validate file size
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum: {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    # Save file to disk
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = file.filename or "uploaded_file"
    safe_name = f"{uuid.uuid4().hex[:8]}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as f:
        f.write(content)

    pinecone_index = _get_pinecone_index(request)
    if not pinecone_index:
        raise HTTPException(status_code=503, detail="Vector database not initialized")

    # Run ingestion in background so it doesn't block the server
    async def _ingest_background():
        async with AsyncSessionLocal() as bg_db:
            try:
                result = await upload_document(
                    db=bg_db,
                    file_path=file_path,
                    filename=filename,
                    title=title,
                    pinecone_index=pinecone_index,
                )
                logger.info("Background ingestion complete for %s: %s", filename, result)
            except Exception as e:
                logger.error("Background ingestion failed for %s: %s", filename, e, exc_info=True)

    asyncio.create_task(_ingest_background())

    return {
        "status": "processing",
        "message": f"File '{filename}' saved. Ingestion started in background.",
        "filename": filename,
        "file_path": file_path,
    }


@router.get("/knowledge-base/sources", response_model=list[KBSourceResponse])
async def list_kb_sources(
    user: Annotated[User, admin_dep],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all knowledge base sources."""
    sources = await get_kb_sources(db)
    return sources


@router.delete("/knowledge-base/sources/{source_id}")
async def remove_kb_source(
    source_id: str,
    request: Request,
    user: Annotated[User, admin_dep],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete/archive a knowledge base source."""
    pinecone_index = _get_pinecone_index(request)
    success = await delete_kb_source(db, source_id, pinecone_index)
    if not success:
        raise HTTPException(status_code=404, detail="Source not found")
    return {"message": "Source archived", "source_id": source_id}


@router.get("/knowledge-base/stats", response_model=KBStatsResponse)
async def kb_stats(
    user: Annotated[User, admin_dep],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get knowledge base statistics."""
    return await get_kb_stats(db)


# ---------------------------------------------------------------------------
# PubMed
# ---------------------------------------------------------------------------

@router.get("/pubmed/queries", response_model=PubMedQueriesResponse)
async def get_queries(
    user: Annotated[User, admin_dep],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get configured PubMed search queries."""
    config = await get_pubmed_queries(db)
    return PubMedQueriesResponse(**config)


@router.put("/pubmed/queries", response_model=PubMedQueriesResponse)
async def update_queries(
    body: PubMedQueriesUpdate,
    user: Annotated[User, admin_dep],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update PubMed search queries."""
    result = await update_pubmed_queries(
        db, body.queries, body.max_results_per_query, user.id
    )
    return PubMedQueriesResponse(**result)


@router.post("/pubmed/update", response_model=PubMedUpdateResponse)
async def pubmed_update(
    request: Request,
    user: Annotated[User, admin_dep],
    db: Annotated[AsyncSession, Depends(get_db)],
    body: PubMedUpdateRequest | None = None,
):
    """Trigger a PubMed update — search, fetch, and ingest new papers."""
    pinecone_index = _get_pinecone_index(request)
    if not pinecone_index:
        raise HTTPException(status_code=503, detail="Vector database not initialized")

    queries_override = body.queries if body else None
    result = await trigger_pubmed_update(
        db=db,
        pinecone_index=pinecone_index,
        queries_override=queries_override,
    )
    return PubMedUpdateResponse(**result)


# ---------------------------------------------------------------------------
# Patients
# ---------------------------------------------------------------------------

@router.get("/patients")
async def get_patients(
    user: Annotated[User, admin_dep],
    db: Annotated[AsyncSession, Depends(get_db)],
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
):
    """List all patients (paginated, searchable)."""
    return await list_patients(db, search=search, skip=skip, limit=limit)


@router.get("/patients/{patient_id}")
async def get_patient(
    patient_id: str,
    user: Annotated[User, admin_dep],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get detailed patient information."""
    detail = await get_patient_detail(db, patient_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Patient not found")
    return detail


@router.get("/patients/{patient_id}/sessions")
async def get_patient_sessions(
    patient_id: str,
    user: Annotated[User, admin_dep],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get all sessions for a patient."""
    detail = await get_patient_detail(db, patient_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Patient not found")
    return detail.get("sessions", [])


@router.get("/patients/{patient_id}/sessions/{session_id}/messages")
async def get_patient_session_messages(
    patient_id: str,
    session_id: str,
    user: Annotated[User, admin_dep],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get all messages for a patient's session."""
    return await get_session_messages(db, session_id)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

@router.get("/config/{key}", response_model=ConfigResponse)
async def get_admin_config(
    key: str,
    user: Annotated[User, admin_dep],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a configuration value by key."""
    config = await get_config(db, key)
    if not config:
        raise HTTPException(status_code=404, detail=f"Config key '{key}' not found")
    return config


@router.put("/config/{key}", response_model=ConfigResponse)
async def set_admin_config(
    key: str,
    body: ConfigUpdate,
    user: Annotated[User, admin_dep],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Set a configuration value."""
    result = await set_config(db, key, body.value, user.id)
    return result
