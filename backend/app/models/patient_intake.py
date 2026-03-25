"""PatientIntake ORM model — structured intake data collected through chat."""

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import String, Float, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class JSONEncodedText:
    """Helper for JSON-in-Text columns (SQLite has no native JSONB)."""

    @staticmethod
    def encode(value: Any) -> str:
        return json.dumps(value) if value is not None else "{}"

    @staticmethod
    def decode(value: str | None) -> Any:
        if value is None:
            return {}
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return {}


class PatientIntake(Base):
    __tablename__ = "patient_intakes"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Demographics & Anthropometrics
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sex: Mapped[str | None] = mapped_column(String(20), nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    bmi: Mapped[float | None] = mapped_column(Float, nullable=True)
    waist_circumference_cm: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Comorbidities (JSON-encoded text)
    comorbidities: Mapped[str] = mapped_column(Text, default="{}")
    # Example: {"t2dm": true, "htn": true, "osa": false, ...}

    # Previous weight loss attempts (JSON-encoded text)
    previous_diets: Mapped[str] = mapped_column(Text, default="[]")
    previous_medications: Mapped[str] = mapped_column(Text, default="[]")
    previous_surgeries: Mapped[str] = mapped_column(Text, default="[]")

    # Psychological / Eating Behavior
    binge_eating_screen: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    emotional_eating: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    eating_disorder_history: Mapped[str | None] = mapped_column(Text, nullable=True)
    mental_health_conditions: Mapped[str] = mapped_column(Text, default="[]")
    current_psych_medications: Mapped[str] = mapped_column(Text, default="[]")

    # Family History
    family_obesity_history: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    family_diabetes_history: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    family_surgical_history: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Social History
    smoking_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    alcohol_use: Mapped[str | None] = mapped_column(String(100), nullable=True)
    exercise_frequency: Mapped[str | None] = mapped_column(String(100), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(255), nullable=True)
    support_system: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Surgical History (general)
    previous_abdominal_surgeries: Mapped[str] = mapped_column(Text, default="[]")
    anesthesia_complications: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Intake metadata
    intake_status: Mapped[str] = mapped_column(String(20), default="in_progress")
    intake_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    # Relationships
    user = relationship("User", back_populates="intakes")
    session = relationship("ChatSession", back_populates="intake", uselist=False)

    # ------- Helpers for JSON fields -------
    def get_comorbidities(self) -> dict:
        return JSONEncodedText.decode(self.comorbidities)

    def set_comorbidities(self, value: dict) -> None:
        self.comorbidities = JSONEncodedText.encode(value)

    def get_previous_diets(self) -> list:
        return JSONEncodedText.decode(self.previous_diets)

    def set_previous_diets(self, value: list) -> None:
        self.previous_diets = JSONEncodedText.encode(value)

    def get_previous_medications(self) -> list:
        return JSONEncodedText.decode(self.previous_medications)

    def set_previous_medications(self, value: list) -> None:
        self.previous_medications = JSONEncodedText.encode(value)

    def get_previous_surgeries(self) -> list:
        return JSONEncodedText.decode(self.previous_surgeries)

    def set_previous_surgeries(self, value: list) -> None:
        self.previous_surgeries = JSONEncodedText.encode(value)

    def get_mental_health_conditions(self) -> list:
        return JSONEncodedText.decode(self.mental_health_conditions)

    def get_current_psych_medications(self) -> list:
        return JSONEncodedText.decode(self.current_psych_medications)

    def get_previous_abdominal_surgeries(self) -> list:
        return JSONEncodedText.decode(self.previous_abdominal_surgeries)

    def compute_bmi(self) -> float | None:
        if self.height_cm and self.weight_kg and self.height_cm > 0:
            return round(self.weight_kg / ((self.height_cm / 100) ** 2), 1)
        return None

    def to_summary_dict(self) -> dict:
        """Return a flat summary dict for LLM context."""
        return {
            "age": self.age,
            "sex": self.sex,
            "height_cm": self.height_cm,
            "weight_kg": self.weight_kg,
            "bmi": self.bmi,
            "waist_circumference_cm": self.waist_circumference_cm,
            "comorbidities": self.get_comorbidities(),
            "previous_diets": self.get_previous_diets(),
            "previous_medications": self.get_previous_medications(),
            "previous_surgeries": self.get_previous_surgeries(),
            "binge_eating_screen": self.binge_eating_screen,
            "emotional_eating": self.emotional_eating,
            "eating_disorder_history": self.eating_disorder_history,
            "mental_health_conditions": self.get_mental_health_conditions(),
            "current_psych_medications": self.get_current_psych_medications(),
            "family_obesity_history": self.family_obesity_history,
            "family_diabetes_history": self.family_diabetes_history,
            "family_surgical_history": self.family_surgical_history,
            "smoking_status": self.smoking_status,
            "alcohol_use": self.alcohol_use,
            "exercise_frequency": self.exercise_frequency,
            "occupation": self.occupation,
            "support_system": self.support_system,
            "previous_abdominal_surgeries": self.get_previous_abdominal_surgeries(),
            "anesthesia_complications": self.anesthesia_complications,
            "intake_status": self.intake_status,
        }
