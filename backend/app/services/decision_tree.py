"""Clinical decision tree — ASMBS/IFSO guideline-based decision gates.

Evaluates patient intake data to determine the recommended treatment pathway:
lifestyle, pharmacotherapy, surgery, or referral for psychological evaluation.
"""

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class RecommendationPath(Enum):
    LIFESTYLE = "lifestyle"
    PHARMACOTHERAPY = "pharmacotherapy"
    SURGERY_CANDIDATE = "surgery_candidate"
    SURGERY_URGENT = "surgery_urgent"
    NEEDS_PSYCH_EVAL = "needs_psych_eval"
    CONTRAINDICATED = "contraindicated"


@dataclass
class DecisionResult:
    path: RecommendationPath
    reasoning: str
    confidence: float  # 0.0 - 1.0
    surgery_types_to_discuss: list[str] = field(default_factory=list)
    flags: list[str] = field(default_factory=list)
    gate_results: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "path": self.path.value,
            "reasoning": self.reasoning,
            "confidence": self.confidence,
            "surgery_types_to_discuss": self.surgery_types_to_discuss,
            "flags": self.flags,
            "gate_results": self.gate_results,
        }


# Surgery types with discussion framework
SURGERY_TYPES = {
    "sleeve_gastrectomy": {
        "full_name": "Laparoscopic Sleeve Gastrectomy (LSG)",
        "discussion_points": [
            "mechanism_of_action", "expected_weight_loss", "comorbidity_resolution",
            "surgical_risks", "nutritional_deficiencies", "lifestyle_changes",
            "recovery_timeline", "long_term_outcomes", "revision_options",
        ],
    },
    "rygb": {
        "full_name": "Roux-en-Y Gastric Bypass (RYGB)",
        "discussion_points": [
            "mechanism_of_action", "expected_weight_loss", "comorbidity_resolution",
            "surgical_risks", "nutritional_deficiencies", "dumping_syndrome",
            "lifestyle_changes", "recovery_timeline", "long_term_outcomes",
        ],
    },
    "oagb": {
        "full_name": "One Anastomosis Gastric Bypass (OAGB/MGB)",
        "discussion_points": [
            "mechanism_of_action", "expected_weight_loss", "comorbidity_resolution",
            "surgical_risks", "bile_reflux_risk", "nutritional_deficiencies",
            "lifestyle_changes", "recovery_timeline", "long_term_outcomes",
        ],
    },
    "duodenal_switch": {
        "full_name": "Biliopancreatic Diversion with Duodenal Switch (BPD/DS)",
        "discussion_points": [
            "mechanism_of_action", "expected_weight_loss", "comorbidity_resolution",
            "surgical_risks", "malabsorption", "nutritional_deficiencies",
            "lifestyle_changes", "recovery_timeline", "long_term_outcomes",
        ],
    },
    "sadi_s": {
        "full_name": "Single Anastomosis Duodeno-Ileal Bypass (SADI-S)",
        "discussion_points": [
            "mechanism_of_action", "expected_weight_loss", "comorbidity_resolution",
            "surgical_risks", "nutritional_deficiencies", "lifestyle_changes",
            "recovery_timeline", "long_term_outcomes",
        ],
    },
    "gastric_band": {
        "full_name": "Laparoscopic Adjustable Gastric Band (LAGB)",
        "discussion_points": [
            "mechanism_of_action", "expected_weight_loss", "band_adjustments",
            "surgical_risks", "slippage_erosion", "lifestyle_changes",
            "recovery_timeline", "long_term_outcomes", "declining_use",
        ],
    },
    "endoscopic": {
        "full_name": "Endoscopic Bariatric Procedures (ESG, IGB)",
        "discussion_points": [
            "procedure_types", "mechanism_of_action", "expected_weight_loss",
            "non_surgical_advantages", "risks", "temporary_vs_permanent",
            "recovery_timeline", "candidacy_criteria",
        ],
    },
}


def evaluate_patient(intake_data: dict) -> DecisionResult:
    """Evaluate patient intake data through ASMBS/IFSO clinical decision gates.

    Args:
        intake_data: Flat dict from PatientIntake.to_summary_dict()

    Returns:
        DecisionResult with pathway, reasoning, and surgery types if applicable.
    """
    bmi = intake_data.get("bmi")
    age = intake_data.get("age")
    comorbidities = intake_data.get("comorbidities", {})
    if isinstance(comorbidities, str):
        import json
        try:
            comorbidities = json.loads(comorbidities)
        except (json.JSONDecodeError, TypeError):
            comorbidities = {}

    gate_results = []
    flags = []
    reasoning_parts = []

    # -----------------------------------------------------------------------
    # GATE 0: Data completeness check
    # -----------------------------------------------------------------------
    if bmi is None:
        return DecisionResult(
            path=RecommendationPath.LIFESTYLE,
            reasoning="Insufficient data: BMI not calculated. Cannot proceed with decision tree.",
            confidence=0.1,
            flags=["incomplete_data"],
            gate_results=[{"gate": "data_check", "result": "fail", "reason": "BMI missing"}],
        )

    gate_results.append({"gate": "data_check", "result": "pass", "bmi": bmi})

    # -----------------------------------------------------------------------
    # GATE 1: BMI Thresholds
    # -----------------------------------------------------------------------
    bmi_path = RecommendationPath.LIFESTYLE
    bmi_confidence = 0.5

    if bmi < 27:
        bmi_path = RecommendationPath.LIFESTYLE
        reasoning_parts.append(f"BMI {bmi} < 27: Lifestyle modification is the primary recommendation.")
        bmi_confidence = 0.8
    elif bmi < 30:
        # 27-30: Lifestyle primary, pharmacotherapy if comorbidities
        has_comorbidity = any(comorbidities.get(k) for k in ["t2dm", "htn", "dyslipidemia"])
        if has_comorbidity:
            bmi_path = RecommendationPath.PHARMACOTHERAPY
            reasoning_parts.append(
                f"BMI {bmi} (27-30) with comorbidities: Pharmacotherapy may be indicated."
            )
            bmi_confidence = 0.7
        else:
            bmi_path = RecommendationPath.LIFESTYLE
            reasoning_parts.append(f"BMI {bmi} (27-30) without significant comorbidities: Lifestyle modification.")
            bmi_confidence = 0.75
    elif bmi < 35:
        # 30-35: Pharmacotherapy primary, surgery if T2DM + failed meds
        bmi_path = RecommendationPath.PHARMACOTHERAPY
        reasoning_parts.append(f"BMI {bmi} (30-35): Pharmacotherapy is the primary recommendation.")
        bmi_confidence = 0.7
    elif bmi < 40:
        # 35-39.9: Surgery candidate, especially with comorbidities
        bmi_path = RecommendationPath.SURGERY_CANDIDATE
        reasoning_parts.append(
            f"BMI {bmi} (35-40): Surgery candidacy, particularly with obesity-related comorbidities."
        )
        bmi_confidence = 0.75
    elif bmi < 50:
        # 40-49.9: Strong surgery recommendation
        bmi_path = RecommendationPath.SURGERY_CANDIDATE
        reasoning_parts.append(f"BMI {bmi} (40-50): Strong surgical recommendation per ASMBS/IFSO guidelines.")
        bmi_confidence = 0.85
    else:
        # >= 50: Super-obese, urgent
        bmi_path = RecommendationPath.SURGERY_URGENT
        reasoning_parts.append(
            f"BMI {bmi} >= 50: Super-obesity. Urgent surgical evaluation recommended."
        )
        bmi_confidence = 0.9
        flags.append("super_obesity")

    gate_results.append({
        "gate": "bmi_threshold",
        "bmi": bmi,
        "initial_path": bmi_path.value,
        "confidence": bmi_confidence,
    })

    current_path = bmi_path
    confidence = bmi_confidence

    # -----------------------------------------------------------------------
    # GATE 2: Comorbidity Modifiers
    # -----------------------------------------------------------------------
    has_t2dm = comorbidities.get("t2dm", False)
    has_htn = comorbidities.get("htn", False)
    has_osa = comorbidities.get("osa", False)
    has_gerd = comorbidities.get("gerd", False)
    has_depression = comorbidities.get("depression", False)

    # T2DM + BMI 30-35 → elevate to surgery candidate (metabolic surgery indication)
    if has_t2dm and 30 <= bmi < 35:
        current_path = RecommendationPath.SURGERY_CANDIDATE
        reasoning_parts.append(
            "T2DM with BMI 30-35: Metabolic surgery indication per ASMBS/IFSO 2022 guidelines."
        )
        confidence = max(confidence, 0.75)
        flags.append("metabolic_surgery_indication")

    # Uncontrolled HTN or OSA strengthens surgery recommendation
    if (has_htn or has_osa) and current_path in (
        RecommendationPath.PHARMACOTHERAPY, RecommendationPath.SURGERY_CANDIDATE
    ):
        if current_path == RecommendationPath.PHARMACOTHERAPY and bmi >= 32:
            current_path = RecommendationPath.SURGERY_CANDIDATE
            reasoning_parts.append(
                "Presence of HTN/OSA with BMI >= 32 strengthens surgical candidacy."
            )
        elif current_path == RecommendationPath.SURGERY_CANDIDATE:
            confidence = min(confidence + 0.05, 0.95)
            reasoning_parts.append(
                "Comorbidities (HTN/OSA) further support surgical intervention."
            )

    # GERD: affects surgery type selection (sleeve less ideal with severe GERD)
    if has_gerd and current_path in (
        RecommendationPath.SURGERY_CANDIDATE, RecommendationPath.SURGERY_URGENT
    ):
        flags.append("gerd_affects_surgery_choice")
        reasoning_parts.append(
            "GERD noted: May favor RYGB over sleeve gastrectomy."
        )

    # Active eating disorder → needs psych eval
    binge_eating = intake_data.get("binge_eating_screen", False)
    eating_disorder = intake_data.get("eating_disorder_history")

    if binge_eating or (eating_disorder and eating_disorder.strip()):
        flags.append("eating_disorder_screening_positive")
        if current_path in (
            RecommendationPath.SURGERY_CANDIDATE, RecommendationPath.SURGERY_URGENT
        ):
            reasoning_parts.append(
                "Positive eating disorder screening: Psychological evaluation required before surgical clearance."
            )
            # Don't change path entirely, just flag it
            flags.append("requires_psych_clearance")

    gate_results.append({
        "gate": "comorbidity_modifiers",
        "t2dm": has_t2dm,
        "htn": has_htn,
        "osa": has_osa,
        "gerd": has_gerd,
        "path_after": current_path.value,
    })

    # -----------------------------------------------------------------------
    # GATE 3: Prior Weight Loss Attempts
    # -----------------------------------------------------------------------
    prev_diets = intake_data.get("previous_diets", [])
    if isinstance(prev_diets, str):
        import json
        try:
            prev_diets = json.loads(prev_diets)
        except (json.JSONDecodeError, TypeError):
            prev_diets = []

    prev_meds = intake_data.get("previous_medications", [])
    if isinstance(prev_meds, str):
        import json
        try:
            prev_meds = json.loads(prev_meds)
        except (json.JSONDecodeError, TypeError):
            prev_meds = []

    prev_surgeries = intake_data.get("previous_surgeries", [])
    if isinstance(prev_surgeries, str):
        import json
        try:
            prev_surgeries = json.loads(prev_surgeries)
        except (json.JSONDecodeError, TypeError):
            prev_surgeries = []

    has_tried_lifestyle = len(prev_diets) > 0
    has_tried_meds = len(prev_meds) > 0
    has_glp1_history = any(
        m.get("name", "").lower() in ["semaglutide", "tirzepatide", "liraglutide", "wegovy", "ozempic", "mounjaro", "zepbound"]
        for m in prev_meds if isinstance(m, dict)
    )
    has_prior_bariatric = len(prev_surgeries) > 0

    # No prior lifestyle attempts and not super-obese: must attempt first
    if not has_tried_lifestyle and current_path in (
        RecommendationPath.SURGERY_CANDIDATE,
    ) and bmi < 50:
        reasoning_parts.append(
            "No documented prior lifestyle modification attempts. Recommend supervised "
            "lifestyle program before surgical consideration (unless urgency dictates otherwise)."
        )
        flags.append("no_prior_lifestyle_attempts")
        confidence = max(confidence - 0.1, 0.3)

    # Failed GLP-1 medications: strengthens surgery candidacy
    if has_glp1_history and current_path in (
        RecommendationPath.PHARMACOTHERAPY, RecommendationPath.SURGERY_CANDIDATE
    ):
        if current_path == RecommendationPath.PHARMACOTHERAPY:
            current_path = RecommendationPath.SURGERY_CANDIDATE
            reasoning_parts.append(
                "Failed GLP-1 agonist therapy: Strengthens surgical candidacy."
            )
        confidence = min(confidence + 0.1, 0.95)

    # Prior bariatric surgery: revisional surgery discussion
    if has_prior_bariatric:
        flags.append("revisional_surgery_discussion")
        reasoning_parts.append(
            "Prior bariatric surgery noted: Revisional surgery options should be discussed."
        )

    gate_results.append({
        "gate": "prior_attempts",
        "lifestyle_attempts": has_tried_lifestyle,
        "medication_attempts": has_tried_meds,
        "glp1_history": has_glp1_history,
        "prior_bariatric": has_prior_bariatric,
        "path_after": current_path.value,
    })

    # -----------------------------------------------------------------------
    # GATE 4: Surgical Fitness / Special Populations
    # -----------------------------------------------------------------------
    if age is not None:
        if age < 18:
            flags.append("adolescent_protocol")
            reasoning_parts.append(
                "Patient under 18: Adolescent bariatric surgery protocols apply. "
                "Requires multidisciplinary pediatric team evaluation."
            )
        elif age > 70:
            flags.append("elderly_protocol")
            reasoning_parts.append(
                "Patient over 70: Increased surgical risk. Careful risk-benefit analysis required."
            )
            confidence = max(confidence - 0.1, 0.3)

    anesthesia_issues = intake_data.get("anesthesia_complications")
    if anesthesia_issues and anesthesia_issues.strip():
        flags.append("anesthesia_risk")
        reasoning_parts.append(
            f"Previous anesthesia complications noted: {anesthesia_issues}. "
            "Requires anesthesia consultation before surgical clearance."
        )

    # Depression/mental health: flag for psych eval but don't contraindicate
    if has_depression or intake_data.get("mental_health_conditions"):
        mental_conditions = intake_data.get("mental_health_conditions", [])
        if isinstance(mental_conditions, str):
            import json
            try:
                mental_conditions = json.loads(mental_conditions)
            except (json.JSONDecodeError, TypeError):
                mental_conditions = []
        if mental_conditions:
            flags.append("mental_health_evaluation")
            reasoning_parts.append(
                "Mental health conditions noted: Pre-surgical psychological evaluation recommended."
            )

    # Smoking: flag but don't contraindicate
    smoking = intake_data.get("smoking_status")
    if smoking == "current":
        flags.append("active_smoker")
        reasoning_parts.append(
            "Active smoker: Smoking cessation required before bariatric surgery (minimum 6-8 weeks)."
        )

    gate_results.append({
        "gate": "surgical_fitness",
        "age": age,
        "anesthesia_issues": bool(anesthesia_issues and anesthesia_issues.strip()),
        "smoking": smoking,
        "path_after": current_path.value,
    })

    # -----------------------------------------------------------------------
    # Determine surgery types to discuss
    # -----------------------------------------------------------------------
    surgery_types: list[str] = []
    if current_path in (RecommendationPath.SURGERY_CANDIDATE, RecommendationPath.SURGERY_URGENT):
        # Default recommendations based on patient profile
        surgery_types = ["sleeve_gastrectomy", "rygb"]

        if has_gerd:
            # RYGB preferred over sleeve for GERD patients
            surgery_types = ["rygb", "oagb"]
            reasoning_parts.append(
                "Due to GERD: RYGB and OAGB are preferred over sleeve gastrectomy."
            )

        if bmi >= 50:
            # Super-obese: consider duodenal switch / SADI-S
            surgery_types.extend(["duodenal_switch", "sadi_s"])
            reasoning_parts.append(
                "Super-obesity (BMI >= 50): Duodenal switch and SADI-S should also be discussed."
            )

        if has_t2dm:
            # Metabolic surgery: RYGB has best T2DM resolution
            if "rygb" not in surgery_types:
                surgery_types.insert(0, "rygb")
            reasoning_parts.append(
                "T2DM present: RYGB has highest T2DM resolution rates."
            )

        if has_prior_bariatric:
            surgery_types = ["rygb", "sleeve_gastrectomy", "duodenal_switch"]
            flags.append("revisional_options")

        # Lower BMI candidates might benefit from endoscopic options
        if 30 <= bmi < 35 and has_t2dm:
            surgery_types.append("endoscopic")

        # Remove duplicates while preserving order
        seen = set()
        unique_types = []
        for st in surgery_types:
            if st not in seen:
                seen.add(st)
                unique_types.append(st)
        surgery_types = unique_types

    # -----------------------------------------------------------------------
    # Build final reasoning
    # -----------------------------------------------------------------------
    reasoning = " ".join(reasoning_parts) if reasoning_parts else f"BMI {bmi}: {current_path.value} pathway."

    return DecisionResult(
        path=current_path,
        reasoning=reasoning,
        confidence=round(confidence, 2),
        surgery_types_to_discuss=surgery_types,
        flags=flags,
        gate_results=gate_results,
    )
