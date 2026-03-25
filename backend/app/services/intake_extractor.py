"""Intake field extractor — extracts structured patient data from chat messages.

Uses Gemini Flash to parse natural language into structured fields,
then updates the PatientIntake record.
"""

import json
import logging
from datetime import datetime, timezone

import google.generativeai as genai

from app.config import settings
from app.models.patient_intake import PatientIntake, JSONEncodedText
from app.utils.prompts import INTAKE_EXTRACTION_PROMPT

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

# All intake fields the system tracks
ALL_INTAKE_FIELDS = [
    "age", "sex", "height_cm", "weight_kg",
    "comorbidities",
    "previous_diets", "previous_medications", "previous_surgeries",
    "binge_eating_screen", "emotional_eating", "eating_disorder_history",
    "mental_health_conditions", "current_psych_medications",
    "family_obesity_history", "family_diabetes_history", "family_surgical_history",
    "smoking_status", "alcohol_use", "exercise_frequency",
    "occupation", "support_system",
    "previous_abdominal_surgeries", "anesthesia_complications",
]

# Essential fields that must be collected for intake completion
ESSENTIAL_FIELDS = [
    "age", "sex", "height_cm", "weight_kg",
    "comorbidities",
    "previous_diets", "previous_medications",
    "smoking_status", "exercise_frequency",
]


async def extract_fields(
    conversation_history: list[dict],
    current_message: str,
    collected_data: dict,
) -> dict:
    """Use LLM to extract structured fields from a patient message.

    Returns dict with 'extracted_fields' and 'confidence'.
    """
    model = genai.GenerativeModel(
        settings.GEMINI_FLASH_MODEL,
        generation_config=genai.GenerationConfig(
            temperature=0.1,  # Low temperature for extraction accuracy
            max_output_tokens=1024,
        ),
    )

    # Format conversation history for prompt
    history_text = ""
    for msg in conversation_history[-10:]:  # Last 10 messages for context
        role = msg.get("role", "user")
        content = msg.get("content", "")
        history_text += f"{role.upper()}: {content}\n"

    prompt = INTAKE_EXTRACTION_PROMPT.format(
        conversation_history=history_text,
        current_message=current_message,
        collected_data=json.dumps(collected_data, indent=2),
    )

    try:
        response = await model.generate_content_async(prompt)
        text = response.text.strip()

        # Parse JSON
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

        result = json.loads(text)
        return {
            "extracted_fields": result.get("extracted_fields", {}),
            "confidence": result.get("confidence", 0.5),
        }
    except json.JSONDecodeError as e:
        logger.warning("Field extraction returned invalid JSON: %s", e)
        return {"extracted_fields": {}, "confidence": 0.0}
    except Exception as e:
        logger.error("Field extraction failed: %s", e)
        return {"extracted_fields": {}, "confidence": 0.0}


def update_intake_from_fields(intake: PatientIntake, fields: dict) -> list[str]:
    """Apply extracted fields to a PatientIntake record.

    Returns list of field names that were updated.
    """
    updated = []

    # Simple scalar fields
    scalar_mappings = {
        "age": ("age", int),
        "sex": ("sex", str),
        "height_cm": ("height_cm", float),
        "weight_kg": ("weight_kg", float),
        "waist_circumference_cm": ("waist_circumference_cm", float),
        "binge_eating_screen": ("binge_eating_screen", bool),
        "emotional_eating": ("emotional_eating", bool),
        "eating_disorder_history": ("eating_disorder_history", str),
        "family_obesity_history": ("family_obesity_history", bool),
        "family_diabetes_history": ("family_diabetes_history", bool),
        "family_surgical_history": ("family_surgical_history", str),
        "smoking_status": ("smoking_status", str),
        "alcohol_use": ("alcohol_use", str),
        "exercise_frequency": ("exercise_frequency", str),
        "occupation": ("occupation", str),
        "support_system": ("support_system", str),
        "anesthesia_complications": ("anesthesia_complications", str),
    }

    for field_name, (attr_name, type_fn) in scalar_mappings.items():
        if field_name in fields and fields[field_name] is not None:
            try:
                value = type_fn(fields[field_name])
                setattr(intake, attr_name, value)
                updated.append(field_name)
            except (ValueError, TypeError) as e:
                logger.warning("Failed to set %s: %s", field_name, e)

    # JSON-encoded fields (merge, don't replace)
    json_mappings = {
        "comorbidities": ("comorbidities", "get_comorbidities", "set_comorbidities", dict),
        "previous_diets": ("previous_diets", "get_previous_diets", "set_previous_diets", list),
        "previous_medications": ("previous_medications", "get_previous_medications", "set_previous_medications", list),
        "previous_surgeries": ("previous_surgeries", "get_previous_surgeries", "set_previous_surgeries", list),
        "mental_health_conditions": ("mental_health_conditions", "get_mental_health_conditions", None, list),
        "current_psych_medications": ("current_psych_medications", "get_current_psych_medications", None, list),
        "previous_abdominal_surgeries": ("previous_abdominal_surgeries", "get_previous_abdominal_surgeries", None, list),
    }

    for field_name, (attr_name, getter_name, setter_name, expected_type) in json_mappings.items():
        if field_name in fields and fields[field_name] is not None:
            new_value = fields[field_name]
            if not isinstance(new_value, expected_type):
                continue

            if expected_type == dict:
                # Merge dicts
                existing = getattr(intake, getter_name)()
                existing.update(new_value)
                if setter_name:
                    getattr(intake, setter_name)(existing)
                else:
                    setattr(intake, attr_name, JSONEncodedText.encode(existing))
            elif expected_type == list:
                # Append to lists (deduplicate by checking existing)
                existing = getattr(intake, getter_name)()
                if isinstance(new_value, list):
                    # For simple string lists, extend and deduplicate
                    if new_value and isinstance(new_value[0], str):
                        combined = list(set(existing + new_value))
                    else:
                        combined = existing + new_value
                    if setter_name:
                        getattr(intake, setter_name)(combined)
                    else:
                        setattr(intake, attr_name, JSONEncodedText.encode(combined))
                else:
                    existing.append(new_value)
                    if setter_name:
                        getattr(intake, setter_name)(existing)
                    else:
                        setattr(intake, attr_name, JSONEncodedText.encode(existing))

            updated.append(field_name)

    # Compute BMI if height and weight are available
    if intake.height_cm and intake.weight_kg:
        intake.bmi = intake.compute_bmi()
        if "height_cm" in updated or "weight_kg" in updated:
            updated.append("bmi")

    return updated


def get_missing_fields(intake: PatientIntake) -> list[str]:
    """Determine which essential intake fields are still missing."""
    missing = []

    if not intake.age:
        missing.append("age")
    if not intake.sex:
        missing.append("sex")
    if not intake.height_cm:
        missing.append("height_cm")
    if not intake.weight_kg:
        missing.append("weight_kg")
    if intake.comorbidities in (None, "{}", ""):
        missing.append("comorbidities")
    if intake.previous_diets in (None, "[]", ""):
        missing.append("previous_diets")
    if intake.previous_medications in (None, "[]", ""):
        missing.append("previous_medications")
    if not intake.smoking_status:
        missing.append("smoking_status")
    if not intake.exercise_frequency:
        missing.append("exercise_frequency")

    return missing


def get_intake_progress(intake: PatientIntake) -> dict:
    """Calculate intake completion progress."""
    total = len(ESSENTIAL_FIELDS)
    missing = get_missing_fields(intake)
    collected = total - len(missing)

    return {
        "total_fields": total,
        "collected_fields": collected,
        "missing_fields": missing,
        "progress": round(collected / total, 2) if total > 0 else 0.0,
        "intake_complete": len(missing) == 0,
    }


def check_intake_complete(intake: PatientIntake) -> bool:
    """Check if all essential intake fields have been collected."""
    return len(get_missing_fields(intake)) == 0
