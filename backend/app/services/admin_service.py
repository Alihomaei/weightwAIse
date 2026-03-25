"""Admin service — business logic for dashboard, KB management, patient records."""

import json
import logging
import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.admin_config import AdminConfig
from app.models.chat_session import ChatSession, ChatMessage
from app.models.kb_source import KBSource
from app.models.patient_intake import PatientIntake
from app.models.user import User
from app.services.document_ingest import ingest_document
from app.services.pubmed_service import run_pubmed_update

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

async def get_dashboard_stats(db: AsyncSession) -> dict:
    """Get summary statistics for the admin dashboard."""
    # Total patients
    patient_count = await db.scalar(
        select(func.count(User.id)).where(User.role == "patient")
    )

    # Active sessions
    active_sessions = await db.scalar(
        select(func.count(ChatSession.id)).where(ChatSession.status == "active")
    )

    # KB stats
    total_sources = await db.scalar(
        select(func.count(KBSource.id)).where(KBSource.status == "active")
    )
    total_chunks = await db.scalar(
        select(func.coalesce(func.sum(KBSource.total_chunks), 0)).where(KBSource.status == "active")
    )
    pubmed_count = await db.scalar(
        select(func.count(KBSource.id)).where(
            KBSource.source_type == "pubmed",
            KBSource.status == "active",
        )
    )

    # Recent sessions
    result = await db.execute(
        select(ChatSession, User.username, User.full_name)
        .join(User, User.id == ChatSession.user_id)
        .order_by(ChatSession.created_at.desc())
        .limit(10)
    )
    recent = []
    for session, username, full_name in result.all():
        recent.append({
            "session_id": session.id,
            "user": full_name or username,
            "type": session.session_type,
            "status": session.status,
            "decision_path": session.decision_path,
            "created_at": session.created_at.isoformat() if session.created_at else None,
        })

    return {
        "total_patients": patient_count or 0,
        "active_sessions": active_sessions or 0,
        "total_kb_sources": total_sources or 0,
        "total_kb_chunks": total_chunks or 0,
        "total_pubmed_papers": pubmed_count or 0,
        "recent_sessions": recent,
    }


# ---------------------------------------------------------------------------
# Knowledge Base Management
# ---------------------------------------------------------------------------

async def upload_document(
    db: AsyncSession,
    file_path: str,
    filename: str,
    title: str | None,
    pinecone_index,
) -> dict:
    """Ingest a document and record it in the database."""
    source_id = str(uuid.uuid4())

    try:
        source_type, total_chunks = await ingest_document(
            file_path=file_path,
            source_id=source_id,
            pinecone_index=pinecone_index,
        )

        # Record in database
        kb_source = KBSource(
            id=source_id,
            source_type=source_type,
            filename=filename,
            title=title or filename,
            total_chunks=total_chunks,
            status="active",
        )
        db.add(kb_source)
        await db.flush()

        return {
            "source_id": source_id,
            "filename": filename,
            "source_type": source_type,
            "total_chunks": total_chunks,
            "status": "active",
            "message": f"Successfully ingested {filename}: {total_chunks} chunks created",
        }

    except Exception as e:
        logger.error("Document ingestion failed for %s: %s", filename, e)
        # Record the failure
        kb_source = KBSource(
            id=source_id,
            source_type="unknown",
            filename=filename,
            title=title or filename,
            total_chunks=0,
            status="failed",
        )
        db.add(kb_source)
        await db.flush()

        return {
            "source_id": source_id,
            "filename": filename,
            "source_type": "unknown",
            "total_chunks": 0,
            "status": "failed",
            "message": f"Ingestion failed: {str(e)}",
        }


async def get_kb_sources(db: AsyncSession) -> list[KBSource]:
    """List all knowledge base sources."""
    result = await db.execute(
        select(KBSource).order_by(KBSource.ingested_at.desc())
    )
    return list(result.scalars().all())


async def delete_kb_source(
    db: AsyncSession,
    source_id: str,
    pinecone_index,
) -> bool:
    """Delete a KB source and its vectors from Pinecone."""
    source = await db.get(KBSource, source_id)
    if not source:
        return False

    # Delete vectors from Pinecone by prefix
    try:
        # Pinecone doesn't support prefix deletion directly in all tiers,
        # so we mark as archived instead
        source.status = "archived"
        await db.flush()

        # Try to delete vectors by ID prefix (works on some tiers)
        # This is a best-effort operation
        try:
            # List vectors with the source_id prefix is not always available
            # Instead, use metadata filter delete if supported
            pinecone_index.delete(
                filter={"source_id": source_id}
            )
        except Exception as e:
            logger.warning("Could not delete Pinecone vectors for source %s: %s", source_id, e)

    except Exception as e:
        logger.error("Failed to delete KB source %s: %s", source_id, e)
        return False

    return True


async def get_kb_stats(db: AsyncSession) -> dict:
    """Get knowledge base statistics."""
    total_sources = await db.scalar(select(func.count(KBSource.id)))
    active_sources = await db.scalar(
        select(func.count(KBSource.id)).where(KBSource.status == "active")
    )
    total_chunks = await db.scalar(
        select(func.coalesce(func.sum(KBSource.total_chunks), 0)).where(KBSource.status == "active")
    )

    # Sources by type
    result = await db.execute(
        select(KBSource.source_type, func.count(KBSource.id))
        .where(KBSource.status == "active")
        .group_by(KBSource.source_type)
    )
    by_type = {row[0]: row[1] for row in result.all()}

    return {
        "total_sources": total_sources or 0,
        "active_sources": active_sources or 0,
        "total_chunks": total_chunks or 0,
        "sources_by_type": by_type,
    }


# ---------------------------------------------------------------------------
# PubMed Management
# ---------------------------------------------------------------------------

async def get_pubmed_queries(db: AsyncSession) -> dict:
    """Get the configured PubMed search queries."""
    result = await db.execute(
        select(AdminConfig).where(AdminConfig.key == "pubmed_queries")
    )
    config = result.scalar_one_or_none()
    if config:
        return config.get_value()
    return {
        "queries": [
            "bariatric surgery outcomes",
            "sleeve gastrectomy vs gastric bypass",
            "metabolic surgery type 2 diabetes",
            "bariatric surgery complications",
            "GLP-1 agonist bariatric surgery",
        ],
        "max_results_per_query": 50,
    }


async def update_pubmed_queries(
    db: AsyncSession,
    queries: list[str],
    max_results: int,
    user_id: str,
) -> dict:
    """Update the PubMed search queries configuration."""
    result = await db.execute(
        select(AdminConfig).where(AdminConfig.key == "pubmed_queries")
    )
    config = result.scalar_one_or_none()

    value = {"queries": queries, "max_results_per_query": max_results}

    if config:
        config.set_value(value)
        config.updated_by = user_id
    else:
        config = AdminConfig(
            key="pubmed_queries",
            updated_by=user_id,
        )
        config.set_value(value)
        db.add(config)

    await db.flush()
    return value


async def trigger_pubmed_update(
    db: AsyncSession,
    pinecone_index,
    queries_override: list[str] | None = None,
) -> dict:
    """Trigger a PubMed update: search, fetch, ingest new papers."""
    # Get queries
    if queries_override:
        queries = queries_override
        max_results = 50
    else:
        config = await get_pubmed_queries(db)
        queries = config.get("queries", [])
        max_results = config.get("max_results_per_query", 50)

    if not queries:
        return {"new_papers": 0, "total_chunks": 0, "errors": ["No queries configured"], "message": "No queries"}

    # Get existing PMIDs to skip
    result = await db.execute(
        select(KBSource.pubmed_id).where(
            KBSource.source_type == "pubmed",
            KBSource.pubmed_id.isnot(None),
        )
    )
    existing_pmids = {row[0] for row in result.all() if row[0]}

    # Run the update
    update_result = await run_pubmed_update(
        queries=queries,
        max_results_per_query=max_results,
        pinecone_index=pinecone_index,
        existing_pmids=existing_pmids,
    )

    # Record new papers in database
    for article in update_result.get("articles", []):
        pmid = article["pmid"]
        if pmid in existing_pmids:
            continue

        pub_date = None
        if article.get("pub_date"):
            try:
                from datetime import date
                parts = article["pub_date"].split("-")
                pub_date = date(int(parts[0]), int(parts[1]) if len(parts) > 1 else 1, int(parts[2]) if len(parts) > 2 else 1)
            except (ValueError, IndexError):
                pass

        source = KBSource(
            source_type="pubmed",
            title=article.get("title", ""),
            pubmed_id=pmid,
            pmc_id=article.get("pmc_id", ""),
            authors=article.get("authors", ""),
            publication_date=pub_date,
            total_chunks=1,  # approximate
            status="active",
        )
        db.add(source)
        existing_pmids.add(pmid)

    await db.flush()

    return {
        "new_papers": update_result["new_papers"],
        "total_chunks": update_result["total_chunks"],
        "errors": update_result["errors"],
        "message": f"PubMed update complete: {update_result['new_papers']} new papers, {update_result['total_chunks']} chunks",
    }


# ---------------------------------------------------------------------------
# Patient Management
# ---------------------------------------------------------------------------

async def list_patients(
    db: AsyncSession,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[dict]:
    """List patients with summary info."""
    query = (
        select(User)
        .where(User.role == "patient")
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    if search:
        query = query.where(
            (User.username.ilike(f"%{search}%")) | (User.full_name.ilike(f"%{search}%"))
        )

    result = await db.execute(query)
    users = result.scalars().all()

    patients = []
    for user in users:
        # Get session count and latest session info
        session_result = await db.execute(
            select(ChatSession)
            .where(ChatSession.user_id == user.id)
            .order_by(ChatSession.created_at.desc())
            .limit(1)
        )
        latest_session = session_result.scalar_one_or_none()

        session_count = await db.scalar(
            select(func.count(ChatSession.id)).where(ChatSession.user_id == user.id)
        )

        patients.append({
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "language_preference": user.language_preference,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "total_sessions": session_count or 0,
            "latest_session_type": latest_session.session_type if latest_session else None,
            "latest_decision_path": latest_session.decision_path if latest_session else None,
        })

    return patients


async def get_patient_detail(db: AsyncSession, patient_id: str) -> dict | None:
    """Get detailed patient info including intake and sessions."""
    user = await db.get(User, patient_id)
    if not user or user.role != "patient":
        return None

    # Get latest intake
    intake_result = await db.execute(
        select(PatientIntake)
        .where(PatientIntake.user_id == patient_id)
        .order_by(PatientIntake.created_at.desc())
        .limit(1)
    )
    intake = intake_result.scalar_one_or_none()

    # Get sessions
    session_result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == patient_id)
        .order_by(ChatSession.created_at.desc())
    )
    sessions = session_result.scalars().all()

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "language_preference": user.language_preference,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "intake": intake.to_summary_dict() if intake else None,
        "sessions": [
            {
                "id": s.id,
                "type": s.session_type,
                "status": s.status,
                "decision_path": s.decision_path,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "ended_at": s.ended_at.isoformat() if s.ended_at else None,
            }
            for s in sessions
        ],
    }


async def get_session_messages(
    db: AsyncSession,
    session_id: str,
) -> list[dict]:
    """Get all messages for a session."""
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()

    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "citations": m.get_citations(),
            "extracted_fields": m.get_extracted_fields(),
            "model_used": m.model_used,
            "language": m.language,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


# ---------------------------------------------------------------------------
# Admin Config
# ---------------------------------------------------------------------------

async def get_config(db: AsyncSession, key: str) -> dict | None:
    """Get a configuration value by key."""
    result = await db.execute(
        select(AdminConfig).where(AdminConfig.key == key)
    )
    config = result.scalar_one_or_none()
    if config:
        return {
            "key": config.key,
            "value": config.get_value(),
            "updated_at": config.updated_at.isoformat() if config.updated_at else None,
        }
    return None


async def set_config(
    db: AsyncSession,
    key: str,
    value: dict | list | str,
    user_id: str,
) -> dict:
    """Set a configuration value."""
    result = await db.execute(
        select(AdminConfig).where(AdminConfig.key == key)
    )
    config = result.scalar_one_or_none()

    if config:
        config.set_value(value)
        config.updated_by = user_id
    else:
        config = AdminConfig(key=key, updated_by=user_id)
        config.set_value(value)
        db.add(config)

    await db.flush()

    return {
        "key": config.key,
        "value": config.get_value(),
        "updated_at": config.updated_at.isoformat() if config.updated_at else None,
    }
