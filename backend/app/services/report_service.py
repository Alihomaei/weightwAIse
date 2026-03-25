"""Report generation service — patient summary reports in JSON and PDF.

Generates comprehensive clinical reports from session data, intake records,
decision tree results, and conversation history.
"""

import io
import json
import logging
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_config import AdminConfig
from app.models.chat_session import ChatSession, ChatMessage
from app.models.patient_intake import PatientIntake
from app.models.user import User
from app.services.decision_tree import evaluate_patient
from app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)


async def generate_report(
    db: AsyncSession,
    session_id: str,
) -> dict:
    """Generate a structured JSON report for a chat session.

    Returns a dict with all report sections.
    """
    # Fetch session and related data
    session = await db.get(ChatSession, session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    user = await db.get(User, session.user_id)
    intake = await db.get(PatientIntake, session.intake_id) if session.intake_id else None

    # Get all messages
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()

    # Get clinic info from admin config
    clinic_info = {}
    config_result = await db.execute(
        select(AdminConfig).where(AdminConfig.key == "clinic_info")
    )
    config = config_result.scalar_one_or_none()
    if config:
        clinic_info = config.get_value()

    # Build report
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "session_id": session_id,
    }

    # Section 1: Patient Demographics
    report["patient_demographics"] = {
        "name": user.full_name or user.username if user else "Unknown",
        "age": intake.age if intake else None,
        "sex": intake.sex if intake else None,
        "height_cm": intake.height_cm if intake else None,
        "weight_kg": intake.weight_kg if intake else None,
        "bmi": intake.bmi if intake else None,
        "language_preference": user.language_preference if user else "en",
    }

    # Section 2: Medical History Summary
    report["medical_history"] = {}
    if intake:
        report["medical_history"] = {
            "comorbidities": intake.get_comorbidities(),
            "previous_diets": intake.get_previous_diets(),
            "previous_medications": intake.get_previous_medications(),
            "previous_surgeries": intake.get_previous_surgeries(),
            "binge_eating_screen": intake.binge_eating_screen,
            "emotional_eating": intake.emotional_eating,
            "eating_disorder_history": intake.eating_disorder_history,
            "mental_health_conditions": intake.get_mental_health_conditions(),
            "family_obesity_history": intake.family_obesity_history,
            "family_diabetes_history": intake.family_diabetes_history,
            "smoking_status": intake.smoking_status,
            "alcohol_use": intake.alcohol_use,
            "exercise_frequency": intake.exercise_frequency,
            "occupation": intake.occupation,
            "support_system": intake.support_system,
            "previous_abdominal_surgeries": intake.get_previous_abdominal_surgeries(),
            "anesthesia_complications": intake.anesthesia_complications,
        }

    # Section 3: Clinical Assessment
    decision_result = {}
    if intake and intake.bmi:
        decision = evaluate_patient(intake.to_summary_dict())
        decision_result = decision.to_dict()
    report["clinical_assessment"] = {
        "decision_path": session.decision_path or decision_result.get("path", ""),
        "reasoning": decision_result.get("reasoning", ""),
        "confidence": decision_result.get("confidence", 0.0),
        "surgery_types_discussed": decision_result.get("surgery_types_to_discuss", []),
        "flags": decision_result.get("flags", []),
    }

    # Section 4: Discussion Summary
    # Get assistant messages with consultation content
    consultation_messages = [
        m.content for m in messages
        if m.role == "assistant" and m.model_used in ("flash", "pro")
    ]
    report["discussion_summary"] = {
        "total_messages": len(messages),
        "session_type": session.session_type,
        "key_exchanges": consultation_messages[-5:] if consultation_messages else [],
    }

    # Section 5: Recommendation
    report["recommendation"] = {
        "primary_path": session.decision_path or "",
        "summary": session.recommendation_summary or "",
    }

    # Section 6: Clinic Referral
    report["clinic_referral"] = clinic_info

    # Section 7: Sources Cited
    all_citations = []
    for msg in messages:
        cites = msg.get_citations()
        all_citations.extend(cites)
    # Deduplicate by chunk_id
    seen_ids = set()
    unique_citations = []
    for c in all_citations:
        cid = c.get("chunk_id", "")
        if cid and cid not in seen_ids:
            seen_ids.add(cid)
            unique_citations.append(c)
    report["sources_cited"] = unique_citations

    # Section 8: Disclaimer
    report["disclaimer"] = (
        "This is an AI-generated consultation summary for informational purposes only. "
        "It does not constitute medical advice, diagnosis, or treatment. "
        "All medical decisions should be made in consultation with qualified healthcare "
        "professionals. The recommendations provided are based on general clinical guidelines "
        "and may not account for all individual patient factors."
    )

    return report


async def generate_pdf(
    db: AsyncSession,
    session_id: str,
) -> bytes:
    """Generate a PDF report for a chat session.

    Returns the PDF as bytes.
    """
    report = await generate_report(db, session_id)
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=20,
        textColor=colors.HexColor("#1a365d"),
        spaceAfter=20,
    )
    heading_style = ParagraphStyle(
        "ReportHeading",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=colors.HexColor("#2d3748"),
        spaceBefore=16,
        spaceAfter=8,
    )
    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        spaceAfter=6,
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.gray,
        leading=10,
        spaceBefore=20,
    )

    elements = []

    # Title
    elements.append(Paragraph("weightwAIse Patient Summary Report", title_style))
    elements.append(Paragraph(
        f"Generated: {report['generated_at'][:10]}",
        body_style,
    ))
    elements.append(Spacer(1, 20))

    # Section 1: Patient Demographics
    elements.append(Paragraph("1. Patient Demographics", heading_style))
    demo = report.get("patient_demographics", {})
    demo_data = [
        ["Name", str(demo.get("name", "N/A"))],
        ["Age", str(demo.get("age", "N/A"))],
        ["Sex", str(demo.get("sex", "N/A"))],
        ["Height", f"{demo.get('height_cm', 'N/A')} cm"],
        ["Weight", f"{demo.get('weight_kg', 'N/A')} kg"],
        ["BMI", str(demo.get("bmi", "N/A"))],
    ]
    t = Table(demo_data, colWidths=[2 * inch, 4 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#edf2f7")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e0")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 12))

    # Section 2: Medical History
    elements.append(Paragraph("2. Medical History Summary", heading_style))
    med_history = report.get("medical_history", {})
    comorbidities = med_history.get("comorbidities", {})
    if comorbidities:
        active = [k.upper() for k, v in comorbidities.items() if v and k != "other"]
        if active:
            elements.append(Paragraph(
                f"<b>Active Comorbidities:</b> {', '.join(active)}", body_style
            ))
    prev_meds = med_history.get("previous_medications", [])
    if prev_meds:
        for med in prev_meds:
            if isinstance(med, dict):
                name = med.get("name", "Unknown")
                duration = med.get("duration_months", "?")
                outcome = med.get("outcome", "")
                elements.append(Paragraph(
                    f"- {name} ({duration} months): {outcome}", body_style
                ))
    smoking = med_history.get("smoking_status", "")
    if smoking:
        elements.append(Paragraph(f"<b>Smoking:</b> {smoking}", body_style))
    exercise = med_history.get("exercise_frequency", "")
    if exercise:
        elements.append(Paragraph(f"<b>Exercise:</b> {exercise}", body_style))
    elements.append(Spacer(1, 12))

    # Section 3: Clinical Assessment
    elements.append(Paragraph("3. Clinical Assessment", heading_style))
    assessment = report.get("clinical_assessment", {})
    elements.append(Paragraph(
        f"<b>Recommendation Pathway:</b> {assessment.get('decision_path', 'N/A').replace('_', ' ').title()}",
        body_style,
    ))
    elements.append(Paragraph(
        f"<b>Confidence:</b> {assessment.get('confidence', 0) * 100:.0f}%",
        body_style,
    ))
    reasoning = assessment.get("reasoning", "")
    if reasoning:
        elements.append(Paragraph(f"<b>Reasoning:</b> {reasoning}", body_style))
    flags = assessment.get("flags", [])
    if flags:
        elements.append(Paragraph(
            f"<b>Flags:</b> {', '.join(f.replace('_', ' ') for f in flags)}", body_style
        ))
    surgery_types = assessment.get("surgery_types_discussed", [])
    if surgery_types:
        elements.append(Paragraph(
            f"<b>Surgery Types Discussed:</b> {', '.join(s.replace('_', ' ').title() for s in surgery_types)}",
            body_style,
        ))
    elements.append(Spacer(1, 12))

    # Section 4: Discussion Summary
    elements.append(Paragraph("4. Discussion Summary", heading_style))
    discussion = report.get("discussion_summary", {})
    elements.append(Paragraph(
        f"Session type: {discussion.get('session_type', 'N/A')} | "
        f"Total messages: {discussion.get('total_messages', 0)}",
        body_style,
    ))
    elements.append(Spacer(1, 12))

    # Section 5: Recommendation
    elements.append(Paragraph("5. Recommendation", heading_style))
    rec = report.get("recommendation", {})
    path = rec.get("primary_path", "").replace("_", " ").title()
    elements.append(Paragraph(
        f"<b>Primary Path:</b> {path or 'Consultation in progress'}",
        body_style,
    ))
    if rec.get("summary"):
        elements.append(Paragraph(rec["summary"], body_style))
    elements.append(Spacer(1, 12))

    # Section 6: Clinic Referral
    clinic = report.get("clinic_referral", {})
    if clinic:
        elements.append(Paragraph("6. Clinic Referral", heading_style))
        if clinic.get("name"):
            elements.append(Paragraph(f"<b>{clinic['name']}</b>", body_style))
        if clinic.get("address"):
            elements.append(Paragraph(clinic["address"], body_style))
        if clinic.get("phone"):
            elements.append(Paragraph(f"Phone: {clinic['phone']}", body_style))
        if clinic.get("hours"):
            elements.append(Paragraph(f"Hours: {clinic['hours']}", body_style))
        if clinic.get("booking_url"):
            elements.append(Paragraph(f"Book online: {clinic['booking_url']}", body_style))
        elements.append(Spacer(1, 12))

    # Section 7: Sources Cited
    sources = report.get("sources_cited", [])
    if sources:
        elements.append(Paragraph("7. Sources Cited", heading_style))
        for i, src in enumerate(sources, 1):
            title = src.get("source_title", "Unknown source")
            stype = src.get("source_type", "")
            page = src.get("page_or_section", "")
            pmid = src.get("pubmed_id", "")
            ref = f"[{i}] {title}"
            if page:
                ref += f", {page}"
            if pmid:
                ref += f" (PMID: {pmid})"
            elements.append(Paragraph(ref, body_style))
        elements.append(Spacer(1, 12))

    # Disclaimer
    elements.append(Paragraph("Disclaimer", heading_style))
    elements.append(Paragraph(report.get("disclaimer", ""), disclaimer_style))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.read()
