"""Report routes — JSON report and PDF download."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.chat_session import ChatSession
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.report_service import generate_pdf, generate_report

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/{session_id}")
async def get_report(
    session_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a JSON patient summary report for a session."""
    session = await db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Patients can only see their own reports; admins can see all
    if session.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        report = await generate_report(db, session_id)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.get("/{session_id}/pdf")
async def get_report_pdf(
    session_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Download a PDF patient summary report for a session."""
    session = await db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        pdf_bytes = await generate_pdf(db, session_id)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="weightwaise_report_{session_id[:8]}.pdf"'
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
