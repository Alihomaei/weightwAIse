"""ChatSession and ChatMessage ORM models."""

import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    intake_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("patient_intakes.id"), nullable=True
    )
    session_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="intake"
    )  # intake | consultation | follow_up
    status: Mapped[str] = mapped_column(
        String(20), default="active"
    )  # active | completed | abandoned
    decision_path: Mapped[str | None] = mapped_column(String(50), nullable=True)
    recommendation_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
    intake = relationship("PatientIntake", back_populates="session")
    messages = relationship(
        "ChatMessage", back_populates="session", cascade="all, delete-orphan",
        order_by="ChatMessage.created_at"
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user | assistant | system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    citations: Mapped[str] = mapped_column(Text, default="[]")
    extracted_fields: Mapped[str] = mapped_column(Text, default="{}")
    model_used: Mapped[str | None] = mapped_column(String(50), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Relationships
    session = relationship("ChatSession", back_populates="messages")

    def get_citations(self) -> list:
        try:
            return json.loads(self.citations) if self.citations else []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_citations(self, value: list) -> None:
        self.citations = json.dumps(value)

    def get_extracted_fields(self) -> dict:
        try:
            return json.loads(self.extracted_fields) if self.extracted_fields else {}
        except (json.JSONDecodeError, TypeError):
            return {}

    def set_extracted_fields(self, value: dict) -> None:
        self.extracted_fields = json.dumps(value)
