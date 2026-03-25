"""Chat service — orchestrates intake, decision tree, RAG retrieval, and LLM response.

This is the main coordination layer for the chat flow:
1. Intake phase: guided Q&A with field extraction
2. Decision phase: run clinical decision tree
3. Consultation phase: RAG-grounded responses using Flash/Pro models
"""

import json
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.chat_session import ChatSession, ChatMessage
from app.models.patient_intake import PatientIntake
from app.services.decision_tree import evaluate_patient, DecisionResult, SURGERY_TYPES
from app.services.gemini_service import gemini_service
from app.services.intake_extractor import (
    extract_fields,
    update_intake_from_fields,
    get_missing_fields,
    get_intake_progress,
    check_intake_complete,
)
from app.services.rag_service import (
    retrieve,
    format_context,
    chunks_to_citations,
    RetrievedChunk,
)

logger = logging.getLogger(__name__)


async def create_session(
    db: AsyncSession,
    user_id: str,
    session_type: str = "intake",
    language: str = "en",
    pinecone_index=None,
) -> ChatSession:
    """Create a new chat session with associated intake record."""
    # Create intake record
    intake = PatientIntake(user_id=user_id)
    db.add(intake)
    await db.flush()

    # Create session
    session = ChatSession(
        user_id=user_id,
        intake_id=intake.id,
        session_type=session_type,
        status="active",
    )
    db.add(session)
    await db.flush()

    # Add initial system/assistant welcome message
    welcome_msg = _get_welcome_message(session_type, language)
    msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=welcome_msg,
        model_used="system",
        language=language,
    )
    db.add(msg)
    await db.flush()

    return session


async def process_message(
    db: AsyncSession,
    session: ChatSession,
    user_message: str,
    language: str = "en",
    pinecone_index=None,
) -> dict:
    """Process a user message and generate an assistant response.

    Returns a dict with:
    - response_text: The assistant's response
    - citations: List of citation dicts
    - extracted_fields: New fields extracted (intake phase)
    - intake_progress: Progress dict (intake phase)
    - phase: Current phase (intake/decision/consultation/summary)
    - model_used: flash or pro
    - decision_result: Decision tree result (when transitioning)
    """
    # Save user message
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=user_message,
        language=language,
    )
    db.add(user_msg)
    await db.flush()

    # Get conversation history
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at)
    )
    all_messages = result.scalars().all()
    history = [{"role": m.role, "content": m.content} for m in all_messages[:-1]]  # Exclude current

    # Get intake record
    intake = None
    if session.intake_id:
        intake = await db.get(PatientIntake, session.intake_id)

    # Route based on session phase
    if session.session_type == "intake" and intake and intake.intake_status == "in_progress":
        return await _handle_intake_phase(
            db, session, intake, user_message, history, language, pinecone_index
        )
    else:
        return await _handle_consultation_phase(
            db, session, intake, user_message, history, language, pinecone_index
        )


async def _handle_intake_phase(
    db: AsyncSession,
    session: ChatSession,
    intake: PatientIntake,
    user_message: str,
    history: list[dict],
    language: str,
    pinecone_index,
) -> dict:
    """Handle messages during the intake (data collection) phase."""
    collected_data = intake.to_summary_dict()

    # Extract fields from the message
    extraction = await extract_fields(history, user_message, collected_data)
    extracted_fields = extraction.get("extracted_fields", {})

    # Update intake record with extracted fields
    if extracted_fields:
        update_intake_from_fields(intake, extracted_fields)
        await db.flush()

    # Check if intake is complete
    progress = get_intake_progress(intake)
    is_complete = progress["intake_complete"]

    # Generate response using Gemini
    llm_result = await gemini_service.intake_response(
        conversation_history=history,
        current_message=user_message,
        language=language,
        collected_data=intake.to_summary_dict(),
    )

    response_text = llm_result["response_text"]
    model_used = llm_result["model_used"]

    # Merge LLM-extracted fields with our extraction
    llm_fields = llm_result.get("extracted_fields", {})
    if llm_fields:
        update_intake_from_fields(intake, llm_fields)
        extracted_fields.update(llm_fields)
        await db.flush()

    # Re-check progress after LLM extraction
    progress = get_intake_progress(intake)
    is_complete = progress["intake_complete"]

    # If intake just completed, transition to consultation
    decision_result = None
    if is_complete:
        intake.intake_status = "complete"
        intake.intake_completed_at = datetime.now(timezone.utc)
        session.session_type = "consultation"

        # Run decision tree
        decision = evaluate_patient(intake.to_summary_dict())
        session.decision_path = decision.path.value
        decision_result = decision.to_dict()

        # Add a transition message
        response_text += (
            "\n\nThank you for providing all the information I needed. "
            "Let me now review your medical history and provide you with "
            "personalized recommendations based on current clinical guidelines."
        )

        await db.flush()

    # Save assistant message
    assistant_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=response_text,
        model_used=model_used,
        language=language,
    )
    assistant_msg.set_extracted_fields(extracted_fields)
    db.add(assistant_msg)
    await db.flush()

    result = {
        "response_text": response_text,
        "citations": [],
        "extracted_fields": extracted_fields,
        "intake_progress": progress,
        "phase": "intake" if not is_complete else "decision",
        "model_used": model_used,
    }
    if decision_result:
        result["decision_result"] = decision_result

    return result


async def _handle_consultation_phase(
    db: AsyncSession,
    session: ChatSession,
    intake: PatientIntake | None,
    user_message: str,
    history: list[dict],
    language: str,
    pinecone_index,
) -> dict:
    """Handle messages during the consultation phase (after intake)."""
    patient_data = intake.to_summary_dict() if intake else {}
    decision_result = {}

    # Get or compute decision result
    if session.decision_path:
        decision = evaluate_patient(patient_data) if patient_data.get("bmi") else None
        decision_result = decision.to_dict() if decision else {"path": session.decision_path}
    else:
        decision_result = {"path": "consultation"}

    # Determine which model to use
    use_pro, routing_reason = await gemini_service.determine_model(
        message=user_message,
        phase=session.session_type,
        intake_complete=intake.intake_status == "complete" if intake else True,
    )

    # RAG retrieval
    context_chunks: list[RetrievedChunk] = []
    citations = []
    if pinecone_index is not None:
        try:
            context_chunks = await retrieve(
                query=user_message,
                pinecone_index=pinecone_index,
                top_k=8,
            )
            citations = [c.to_dict() for c in chunks_to_citations(context_chunks)]
        except Exception as e:
            logger.error("RAG retrieval failed: %s", e)

    # Check if this is a surgery-specific discussion
    surgery_types = decision_result.get("surgery_types_to_discuss", [])
    if surgery_types and _is_surgery_question(user_message):
        llm_result = await gemini_service.surgery_discussion(
            conversation_history=history,
            current_message=user_message,
            patient_data=patient_data,
            surgery_types=surgery_types,
            context_chunks=context_chunks,
            language=language,
        )
    else:
        llm_result = await gemini_service.consultation_response(
            conversation_history=history,
            current_message=user_message,
            patient_data=patient_data,
            decision_result=decision_result,
            context_chunks=context_chunks,
            language=language,
            use_pro=use_pro,
        )

    response_text = llm_result["response_text"]
    model_used = llm_result["model_used"]

    # Save assistant message
    assistant_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=response_text,
        model_used=model_used,
        language=language,
    )
    assistant_msg.set_citations(citations)
    db.add(assistant_msg)
    await db.flush()

    return {
        "response_text": response_text,
        "citations": citations,
        "extracted_fields": {},
        "intake_progress": None,
        "phase": "consultation",
        "model_used": model_used,
    }


def _is_surgery_question(message: str) -> bool:
    """Simple heuristic to detect surgery-specific questions."""
    surgery_keywords = [
        "surgery", "procedure", "sleeve", "bypass", "gastric",
        "rygb", "oagb", "duodenal switch", "sadi", "band",
        "endoscopic", "laparoscopic", "bariatric",
        "operation", "surgical",
    ]
    msg_lower = message.lower()
    return any(kw in msg_lower for kw in surgery_keywords)


def _get_welcome_message(session_type: str, language: str) -> str:
    """Generate a welcome message based on session type and language."""
    if language == "es":
        if session_type == "intake":
            return (
                "¡Hola! Soy su consultor virtual de cirugía bariátrica y metabólica. "
                "Estoy aquí para ayudarle a comprender sus opciones basándome en las "
                "guías clínicas más recientes.\n\n"
                "Primero, necesito recopilar un poco de información sobre su historial "
                "médico. Esto me ayudará a proporcionarle orientación personalizada.\n\n"
                "¿Podría comenzar diciéndome su edad y sexo?"
            )
        else:
            return (
                "¡Bienvenido de nuevo! Estoy listo para continuar nuestra consulta. "
                "¿En qué puedo ayudarle hoy?"
            )
    else:
        if session_type == "intake":
            return (
                "Hello! I'm your virtual bariatric and metabolic surgery consultant. "
                "I'm here to help you understand your options based on the latest "
                "clinical guidelines.\n\n"
                "First, I need to gather some information about your medical history. "
                "This will help me provide personalized guidance.\n\n"
                "Could you start by telling me your age and sex?"
            )
        else:
            return (
                "Welcome back! I'm ready to continue our consultation. "
                "How can I help you today?"
            )
