"""Chat routes — session creation, message sending (SSE streaming), message history."""

import json
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.models.chat_session import ChatSession, ChatMessage
from app.models.user import User
from app.schemas.chat import (
    CreateSessionRequest,
    MessageResponse,
    SendMessageRequest,
    SessionResponse,
)
from app.services.auth_service import get_current_user
from app.services.chat_service import create_session, process_message

logger = logging.getLogger(__name__)


def _clean_response_text(text: str) -> str:
    """Extract response_text from JSON if the LLM returned raw JSON."""
    if not text:
        return ""
    trimmed = text.strip()
    # Strip ```json wrapper
    if trimmed.startswith("```"):
        trimmed = trimmed.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    # Parse JSON and extract response_text
    if trimmed.startswith("{") and '"response_text"' in trimmed:
        try:
            parsed = json.loads(trimmed)
            if isinstance(parsed, dict) and "response_text" in parsed:
                return parsed["response_text"]
        except json.JSONDecodeError:
            pass
    return text


router = APIRouter(prefix="/api/chat", tags=["chat"])


def _get_pinecone_index(request: Request):
    """Extract the Pinecone index from app state."""
    return getattr(request.app.state, "pinecone_index", None)


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    body: CreateSessionRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    request: Request,
):
    """Create a new chat session. Starts in intake phase by default."""
    pinecone_index = _get_pinecone_index(request)
    session = await create_session(
        db=db,
        user_id=user.id,
        session_type=body.session_type,
        language=body.language,
        pinecone_index=pinecone_index,
    )
    return session


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all chat sessions for the current user."""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user.id)
        .order_by(ChatSession.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific chat session."""
    session = await db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return session


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    body: SendMessageRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    request: Request,
):
    """Send a message to a chat session and receive a streamed response via SSE.

    The response is streamed as Server-Sent Events:
    - event: "token" — individual text tokens
    - event: "citations" — citations array (sent once at end)
    - event: "extracted_fields" — new intake fields (intake phase)
    - event: "intake_progress" — intake completion progress
    - event: "phase" — current phase indicator
    - event: "done" — final event with complete response
    - event: "error" — error event
    """
    # Verify session belongs to user
    session = await db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    pinecone_index = _get_pinecone_index(request)

    async def event_generator():
        try:
            # Process the message (this does the full pipeline: extract, RAG, LLM)
            result = await process_message(
                db=db,
                session=session,
                user_message=body.content,
                language=body.language,
                pinecone_index=pinecone_index,
            )

            # Extract clean response text — strip JSON wrapper if the LLM returned raw JSON
            response_text = result.get("response_text", "")
            response_text = _clean_response_text(response_text)

            # Stream the response text in chunks for SSE feel
            chunk_size = 20  # characters per chunk
            for i in range(0, len(response_text), chunk_size):
                chunk = response_text[i:i + chunk_size]
                yield {
                    "event": "token",
                    "data": json.dumps({"text": chunk}),
                }

            # Send metadata events
            if result.get("citations"):
                yield {
                    "event": "citations",
                    "data": json.dumps(result["citations"]),
                }

            if result.get("extracted_fields"):
                yield {
                    "event": "extracted_fields",
                    "data": json.dumps(result["extracted_fields"]),
                }

            if result.get("intake_progress"):
                yield {
                    "event": "intake_progress",
                    "data": json.dumps(result["intake_progress"]),
                }

            if result.get("decision_result"):
                yield {
                    "event": "decision_result",
                    "data": json.dumps(result["decision_result"]),
                }

            yield {
                "event": "phase",
                "data": json.dumps({"phase": result.get("phase", "unknown")}),
            }

            yield {
                "event": "model_used",
                "data": json.dumps({"model": result.get("model_used", "flash")}),
            }

            # Final done event — signals stream end (no response_text to avoid duplication)
            yield {
                "event": "done",
                "data": json.dumps({"finished": True}),
            }

        except Exception as e:
            logger.error("Message processing error: %s", e, exc_info=True)
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)}),
            }

    return EventSourceResponse(event_generator())


@router.get("/sessions/{session_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    session_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get all messages for a chat session."""
    session = await db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()

    # Convert JSON string fields to proper types for response
    response_messages = []
    for msg in messages:
        response_messages.append(MessageResponse(
            id=msg.id,
            session_id=msg.session_id,
            role=msg.role,
            content=msg.content,
            citations=msg.get_citations(),
            extracted_fields=msg.get_extracted_fields(),
            model_used=msg.model_used,
            language=msg.language,
            created_at=msg.created_at,
        ))
    return response_messages


@router.post("/sessions/{session_id}/end")
async def end_session(
    session_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """End a chat session."""
    session = await db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    from datetime import datetime, timezone
    session.status = "completed"
    session.ended_at = datetime.now(timezone.utc)
    await db.flush()

    return {"message": "Session ended", "session_id": session_id}
