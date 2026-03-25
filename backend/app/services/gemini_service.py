"""Gemini LLM service — dual model: Flash for chat, Pro for clinical reasoning.

Handles model routing, prompt assembly, structured output parsing, and streaming.
"""

import json
import logging

import google.generativeai as genai

from app.config import settings
from app.services.rag_service import RetrievedChunk, format_context
from app.utils.prompts import (
    INTAKE_SYSTEM_PROMPT,
    CONSULTATION_SYSTEM_PROMPT,
    SURGERY_DISCUSSION_PROMPT,
    MODEL_ROUTING_PROMPT,
)

logger = logging.getLogger(__name__)

# Configure once
genai.configure(api_key=settings.GEMINI_API_KEY)


class GeminiService:
    """Dual-model Gemini service for bariatric surgery consultation."""

    def __init__(self):
        self.flash = genai.GenerativeModel(
            settings.GEMINI_FLASH_MODEL,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=2048,
            ),
        )
        self.pro = genai.GenerativeModel(
            settings.GEMINI_PRO_MODEL,
            generation_config=genai.GenerationConfig(
                temperature=0.5,
                max_output_tokens=4096,
            ),
        )

    async def determine_model(
        self, message: str, phase: str, intake_complete: bool
    ) -> tuple[bool, str]:
        """Determine whether to use Pro model based on message context.

        Returns (use_pro: bool, reason: str).
        """
        # Hard rules first
        if phase == "intake" and not intake_complete:
            return False, "Intake phase uses Flash"

        if phase in ("decision", "summary"):
            return True, f"Phase '{phase}' requires Pro model"

        # Use LLM to decide for ambiguous cases
        try:
            prompt = MODEL_ROUTING_PROMPT.format(
                message=message,
                phase=phase,
                intake_complete=str(intake_complete),
            )
            response = await self.flash.generate_content_async(prompt)
            text = response.text.strip()

            # Parse JSON response
            if text.startswith("```"):
                text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

            result = json.loads(text)
            return result.get("use_pro", False), result.get("reason", "")
        except Exception as e:
            logger.warning("Model routing LLM call failed: %s — defaulting to Flash", e)
            return False, "Routing failed, defaulting to Flash"

    async def intake_response(
        self,
        conversation_history: list[dict],
        current_message: str,
        language: str = "en",
        collected_data: dict | None = None,
    ) -> dict:
        """Generate an intake response using Flash model.

        Returns structured JSON with response_text, extracted_fields,
        missing_fields, and intake_complete.
        """
        system_prompt = INTAKE_SYSTEM_PROMPT.format(language=language)

        # Build messages
        messages = [{"role": "user", "parts": [system_prompt]}]
        messages.append({"role": "model", "parts": ["I understand. I will conduct the intake interview following these guidelines. Let me begin."]})

        # Add context about already collected data
        if collected_data:
            context = f"ALREADY COLLECTED DATA:\n{json.dumps(collected_data, indent=2)}"
            messages.append({"role": "user", "parts": [context]})
            messages.append({"role": "model", "parts": ["I have noted the already collected data. I will ask about missing fields."]})

        # Add conversation history
        for msg in conversation_history:
            role = "user" if msg["role"] == "user" else "model"
            messages.append({"role": role, "parts": [msg["content"]]})

        # Add current message
        messages.append({"role": "user", "parts": [current_message]})

        try:
            response = await self.flash.generate_content_async(messages)
            text = response.text.strip()

            # Parse JSON response
            if text.startswith("```"):
                text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

            result = json.loads(text)
            return {
                "response_text": result.get("response_text", ""),
                "extracted_fields": result.get("extracted_fields", {}),
                "missing_fields": result.get("missing_fields", []),
                "intake_complete": result.get("intake_complete", False),
                "model_used": "flash",
            }
        except json.JSONDecodeError:
            # If the model didn't return valid JSON, treat the full text as response
            logger.warning("Intake response was not valid JSON — wrapping as text")
            return {
                "response_text": response.text.strip() if response else "I apologize, could you please repeat that?",
                "extracted_fields": {},
                "missing_fields": [],
                "intake_complete": False,
                "model_used": "flash",
            }
        except Exception as e:
            logger.error("Intake response generation failed: %s", e)
            raise

    async def consultation_response(
        self,
        conversation_history: list[dict],
        current_message: str,
        patient_data: dict,
        decision_result: dict,
        context_chunks: list[RetrievedChunk],
        language: str = "en",
        use_pro: bool = False,
    ) -> dict:
        """Generate a consultation response with RAG context.

        Returns dict with response_text, citations used, model_used.
        """
        context = format_context(context_chunks)
        system_prompt = CONSULTATION_SYSTEM_PROMPT.format(
            patient_data=json.dumps(patient_data, indent=2),
            decision_result=json.dumps(decision_result, indent=2),
            context=context,
            language=language,
        )

        model = self.pro if use_pro else self.flash
        model_name = "pro" if use_pro else "flash"

        # Build messages
        messages = [{"role": "user", "parts": [system_prompt]}]
        messages.append({"role": "model", "parts": ["I understand. I will provide evidence-based consultation following these guidelines."]})

        for msg in conversation_history:
            role = "user" if msg["role"] == "user" else "model"
            messages.append({"role": role, "parts": [msg["content"]]})

        messages.append({"role": "user", "parts": [current_message]})

        try:
            response = await model.generate_content_async(messages)
            return {
                "response_text": response.text.strip(),
                "model_used": model_name,
            }
        except Exception as e:
            logger.error("Consultation response failed: %s", e)
            raise

    async def surgery_discussion(
        self,
        conversation_history: list[dict],
        current_message: str,
        patient_data: dict,
        surgery_types: list[str],
        context_chunks: list[RetrievedChunk],
        language: str = "en",
    ) -> dict:
        """Generate a surgery-specific discussion using Pro model."""
        context = format_context(context_chunks)
        system_prompt = SURGERY_DISCUSSION_PROMPT.format(
            patient_data=json.dumps(patient_data, indent=2),
            surgery_types=json.dumps(surgery_types),
            context=context,
            language=language,
        )

        messages = [{"role": "user", "parts": [system_prompt]}]
        messages.append({"role": "model", "parts": ["I will discuss these surgical options with detailed, evidence-based information."]})

        for msg in conversation_history:
            role = "user" if msg["role"] == "user" else "model"
            messages.append({"role": role, "parts": [msg["content"]]})

        messages.append({"role": "user", "parts": [current_message]})

        try:
            response = await self.pro.generate_content_async(messages)
            return {
                "response_text": response.text.strip(),
                "model_used": "pro",
            }
        except Exception as e:
            logger.error("Surgery discussion failed: %s", e)
            raise

    async def stream_response(
        self,
        messages: list[dict],
        use_pro: bool = False,
    ):
        """Stream a response token by token.

        Yields text chunks as they arrive from the Gemini API.
        """
        model = self.pro if use_pro else self.flash

        try:
            response = await model.generate_content_async(
                messages,
                stream=True,
            )
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error("Streaming response failed: %s", e)
            yield f"\n\n[Error: {str(e)}]"

    async def generate_report_summary(
        self,
        patient_data: dict,
        decision_result: dict,
        conversation_summary: str,
        citations: list[dict],
    ) -> str:
        """Generate a structured patient summary report using Pro model."""
        prompt = f"""Generate a comprehensive patient summary report based on the following information.

PATIENT DATA:
{json.dumps(patient_data, indent=2)}

CLINICAL DECISION:
{json.dumps(decision_result, indent=2)}

CONSULTATION SUMMARY:
{conversation_summary}

SOURCES CITED:
{json.dumps(citations, indent=2)}

Format the report with these sections:
1. Patient Demographics
2. Medical History Summary
3. Clinical Assessment
4. Discussion Summary
5. Recommendation
6. Sources Cited
7. Disclaimer

Use clear medical language appropriate for a clinical report. Include all relevant details."""

        try:
            response = await self.pro.generate_content_async(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error("Report generation failed: %s", e)
            raise


# Module-level singleton
gemini_service = GeminiService()
