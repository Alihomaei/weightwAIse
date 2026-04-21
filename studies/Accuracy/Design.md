# Accuracy of a RAG-Powered AI Consultant in Bariatric Surgical Candidacy Assessment: A Prospective Validation Study

## Study Design & Methods

---

## 1. Study Overview

| Field | Detail |
|-------|--------|
| **Design** | Prospective, blinded, diagnostic accuracy study |
| **Setting** | In silico validation using standardized patient vignettes |
| **Comparator** | Expert bariatric surgeon consensus panel |
| **Index test** | weightwAIse clinical decision engine (RAG + dual-LLM + rule-based decision tree) |
| **Registration** | ClinicalTrials.gov or OSF pre-registration recommended prior to data collection |
| **Reporting standard** | STARD 2015 (Standards for Reporting Diagnostic Accuracy Studies), TRIPOD+AI |
| **Ethics** | Exempt or expedited IRB review (no human subjects — synthetic vignettes only) |

---

## 2. Objectives

### 2.1 Primary Objective

To evaluate the concordance between weightwAIse's bariatric surgical pathway recommendations and expert surgeon consensus when presented with standardized patient vignettes.

### 2.2 Secondary Objectives

1. Determine sensitivity and specificity of weightwAIse for identifying surgical candidates (surgery candidate + surgery urgent) vs. non-surgical pathways.
2. Measure pathway-specific classification accuracy across all six decision categories.
3. Assess the consistency (test-retest reliability) of weightwAIse's recommendations on repeated presentation of identical vignettes.
4. Evaluate the clinical relevance of weightwAIse's free-text consultation output as judged by blinded experts.

---

## 3. Hypotheses

- **H1 (primary):** weightwAIse achieves substantial agreement (Cohen's kappa >= 0.61) with expert consensus on primary pathway assignment.
- **H2:** weightwAIse achieves sensitivity >= 90% and specificity >= 80% for identifying surgical candidates.
- **H3:** weightwAIse demonstrates high test-retest reliability (ICC >= 0.80) on repeated vignette presentation.

---

## 4. Clinical Decision Pathways (Index Classification)

weightwAIse routes patients into one of six pathways based on ASMBS/IFSO guideline criteria:

| Code | Pathway | Key Triggers |
|------|---------|-------------|
| `LIFESTYLE` | Lifestyle modification | BMI < 30 (or < 27.5 Asian), no comorbidities meeting surgical thresholds |
| `PHARMA` | Pharmacotherapy | BMI 27-34.9 with comorbidities, or BMI 30-34.9 without comorbidities, insufficient prior attempts |
| `SURG_CANDIDATE` | Surgery candidate | BMI >= 35, or BMI >= 30 with metabolic comorbidities, adequate prior attempts, surgically fit |
| `SURG_URGENT` | Surgery — urgent referral | BMI >= 50, or BMI >= 40 with life-threatening comorbidity (uncontrolled T2DM, obesity hypoventilation, severe NASH) |
| `PSYCH_EVAL` | Needs psychological evaluation | Active eating disorder, untreated severe depression/anxiety, substance abuse, cognitive concerns |
| `CONTRA` | Contraindicated | Active malignancy, end-stage organ failure, inability to comply with post-op requirements, pregnancy |

For the binary surgical candidacy analysis (secondary outcome), pathways are collapsed:
- **Surgical:** `SURG_CANDIDATE` + `SURG_URGENT`
- **Non-surgical:** `LIFESTYLE` + `PHARMA` + `PSYCH_EVAL` + `CONTRA`

---

## 5. Vignette Development

### 5.1 Structure

Each vignette is a standardized patient scenario containing:

| Field | Description | Example |
|-------|-------------|---------|
| Age | Years | 42 |
| Sex | M / F / Other | F |
| Ethnicity | For BMI threshold adjustment (Asian ethnicity uses lower thresholds) | Hispanic |
| BMI | kg/m^2 | 38.4 |
| Weight history | Duration of obesity, prior weight loss attempts (type, duration, outcome) | "3 attempts: dietitian x 6mo, Weight Watchers x 12mo, Saxenda x 6mo — all regained" |
| Comorbidities | T2DM, HTN, OSA, GERD, NAFLD/NASH, dyslipidemia, joint disease, PCOS, etc. | T2DM (A1c 8.2%), moderate OSA on CPAP, HTN on 2 agents |
| Medications | Current medications | Metformin 1000mg BID, lisinopril 20mg, amlodipine 5mg |
| Surgical history | Prior abdominal/bariatric surgeries | Laparoscopic cholecystectomy 2019 |
| Psychological history | Mental health conditions, eating disorders, substance use | Mild depression, well-controlled on sertraline |
| Functional status | ASA class, mobility, ability to comply with post-op program | ASA II, ambulatory, strong social support |
| Patient preference | Stated interest or concern | "Interested in surgery but worried about complications" |
| Special flags | Pregnancy, active cancer, organ failure, etc. | None |

### 5.2 Vignette Count and Distribution

**Total: 100 vignettes** distributed to ensure adequate representation:

| Pathway | Target N | Rationale |
|---------|----------|-----------|
| `LIFESTYLE` | 12 | Less common in bariatric clinic populations |
| `PHARMA` | 15 | Borderline cases — important to test |
| `SURG_CANDIDATE` | 30 | Most common expected pathway |
| `SURG_URGENT` | 15 | High-stakes classification |
| `PSYCH_EVAL` | 15 | Nuanced clinical judgment |
| `CONTRA` | 13 | Important safety classification |

An additional **20 "borderline" vignettes** are included within the above counts — cases deliberately designed to sit at decision boundaries (e.g., BMI 34.8 with one comorbidity, patient with resolved eating disorder). These are tagged internally but not revealed to raters.

### 5.3 Vignette Authoring

- Authored by the principal investigator (bariatric surgery domain expertise)
- Reviewed by one independent bariatric surgeon for clinical plausibility
- Each vignette assigned a unique ID (VIG-001 through VIG-100)
- Vignettes should cover diverse demographics (age range 18-70, balanced sex distribution, multi-ethnic representation including cases requiring Asian BMI thresholds)

### 5.4 Pilot Testing

- 10 vignettes (2 per pathway, excluding borderline) are piloted with 2 surgeons before full study
- Purpose: calibrate vignette clarity, identify ambiguous wording, confirm raters understand the classification scheme
- Pilot vignettes may be revised and are excluded from the final analysis dataset if modified

---

## 6. Expert Panel (Reference Standard)

### 6.1 Composition

- **N = 5** fellowship-trained bariatric/metabolic surgeons
- Minimum 3 years post-fellowship clinical practice
- Active ASMBS or IFSO membership
- From at least 2 different institutions (to reduce institutional bias)
- Blinded to weightwAIse output

### 6.2 Rating Procedure

1. Each surgeon independently reviews all 100 vignettes in randomized order (unique randomization per rater).
2. For each vignette, the surgeon selects:
   - **Primary pathway** (one of the six codes)
   - **Confidence level** (1 = low, 2 = moderate, 3 = high)
   - **Free-text justification** (optional, 1-2 sentences)
3. Surgeons complete ratings within a 4-week window using a secure web form (REDCap or equivalent).
4. No communication between raters until all ratings are submitted.

### 6.3 Consensus Derivation

- **Consensus pathway** = majority vote (>= 3/5 agreement)
- If no majority exists (e.g., 2-2-1 split), the vignette is flagged as "no consensus" and analyzed separately
- Inter-rater reliability is reported (Fleiss' kappa across all 5 raters)

---

## 7. Index Test: weightwAIse Execution

### 7.1 System Configuration

The weightwAIse instance used for the study must be version-locked:

| Component | Version / Config |
|-----------|-----------------|
| Decision engine | Commit hash recorded at study start |
| Gemini 2.5 Flash | Temperature 0.3 (chat) |
| Gemini 3.1 Pro | Temperature 0.2 (clinical reasoning) |
| Pinecone index | Snapshot of ingested knowledge base at study start |
| Guidelines loaded | ASMBS 2022, IFSO 2023, Maingot's 13th Ed. |

### 7.2 Vignette Input

Each vignette is entered into weightwAIse through the standard intake flow:
1. A research account is created for each vignette run (or a "vignette mode" that accepts structured input)
2. The intake fields are populated from the vignette specification
3. The system completes its consultation phase and assigns a pathway
4. All outputs are captured: pathway assignment, full consultation transcript, PDF report

### 7.3 Test-Retest

- A random subset of 20 vignettes (stratified: ~3-4 per pathway) is re-entered 7 days after initial run
- Same system version, same input
- Used to assess reproducibility (note: LLM non-determinism even at low temperature means perfect agreement is not expected)

### 7.4 Output Capture

For each vignette run, the following are recorded:

| Data Point | Source |
|-----------|--------|
| Assigned pathway code | Decision engine output |
| Decision tree gate values | Backend logs (BMI threshold met, comorbidity flags, etc.) |
| Full chat transcript | Database export |
| RAG-retrieved context chunks | Backend logs |
| Consultation reasoning text | Gemini 3.1 Pro output |
| PDF report | Report service output |
| Execution timestamp + duration | System logs |

---

## 8. Outcomes & Statistical Analysis

### 8.1 Primary Outcome

**Overall concordance** between weightwAIse pathway assignment and expert consensus:

- **Metric:** Cohen's kappa (weightwAIse vs. consensus) with 95% confidence interval
- **Interpretation scale:** < 0.20 poor, 0.21-0.40 fair, 0.41-0.60 moderate, 0.61-0.80 substantial, 0.81-1.00 almost perfect
- **Target:** kappa >= 0.61 (substantial agreement)

### 8.2 Secondary Outcomes

| Outcome | Metric | Analysis |
|---------|--------|----------|
| Surgical candidacy detection | Sensitivity, specificity, PPV, NPV, AUROC | Binary classification (surgical vs. non-surgical) with 95% CIs |
| Pathway-specific accuracy | Per-class precision, recall, F1-score | 6x6 confusion matrix |
| Inter-rater reliability (surgeons) | Fleiss' kappa | Reported to contextualize the difficulty of the task |
| Test-retest reliability | ICC (two-way random, absolute agreement) | On the 20 repeated vignettes |
| Borderline case accuracy | Kappa on borderline subset vs. non-borderline subset | Subgroup analysis |
| Confidence-stratified accuracy | Kappa stratified by surgeon confidence level | Exploratory: is AI more accurate when experts are confident? |

### 8.3 Sample Size Justification

For kappa estimation with 6 categories:
- With N = 100 cases, assuming true kappa = 0.70, the 95% CI half-width is approximately +/- 0.09 (based on Sim & Wright, 2005 simulation tables for ordinal kappa with moderate prevalence)
- This provides sufficient precision to distinguish "substantial" from "moderate" agreement
- The 100-vignette target also ensures >= 12 cases per pathway, meeting minimum cell-count recommendations for confusion matrix stability

### 8.4 Handling of "No Consensus" Vignettes

- Reported descriptively (how many, which pathways)
- Excluded from primary kappa calculation
- Sensitivity analysis: re-include with plurality vote as consensus
- If > 15% of vignettes have no consensus, this itself is a finding about task difficulty

### 8.5 Software

- Statistical analysis: Python (scikit-learn, statsmodels) or R (irr, caret packages)
- Visualization: confusion matrix heatmap, ROC curve, kappa by pathway bar chart
- All analysis code version-controlled and shared as supplementary material

---

## 9. Blinding & Bias Mitigation

| Bias | Mitigation |
|------|-----------|
| Rater bias | Surgeons blinded to AI output; independent rating |
| Order effects | Vignettes presented in unique random order per rater |
| Incorporation bias | Expert panel never sees weightwAIse output; AI never sees expert ratings |
| Spectrum bias | Vignettes designed to cover all pathways with borderline cases |
| Overfitting to training data | Knowledge base contents are declared; vignettes are novel cases, not derived from training documents |
| LLM non-determinism | Test-retest analysis quantifies this; system version locked |

---

## 10. Data Management

- All vignettes, expert ratings, and AI outputs stored in a structured database
- Data dictionary published as supplementary material
- De-identified dataset (no real patient data exists — all synthetic vignettes) made available on GitHub or Zenodo upon publication
- Analysis scripts shared for reproducibility

---

## 11. Ethical Considerations

- **No human subjects:** All vignettes are synthetic. No real patient data is collected or used.
- **IRB:** Likely exempt (check institutional policy). Submit determination request before data collection.
- **Conflicts of interest:** The principal investigator is the developer of weightwAIse. This must be declared. Consider having the statistical analysis independently verified.
- **Responsible AI disclosure:** The study tests an AI system; results (including failures) are reported transparently.

---

## 12. Limitations (to acknowledge in manuscript)

1. Synthetic vignettes may not capture the full complexity of real patient presentations (missing nonverbal cues, incomplete histories, patient affect).
2. Expert consensus as reference standard is imperfect — surgeons may disagree, and "correct" pathway can be debatable.
3. Single-system evaluation — results apply to this version of weightwAIse with this specific knowledge base.
4. Vignettes are entered in English only (Spanish language accuracy is a separate validation).
5. The decision tree is rule-based with LLM augmentation; changes to guidelines would require system updates.

---

## 13. Expected Deliverables

| Deliverable | Format |
|------------|--------|
| Vignette bank (100 cases) | Structured JSON + human-readable PDF |
| Expert rating forms | REDCap instrument or web form |
| Raw data (ratings + AI outputs) | CSV / JSON |
| Analysis notebook | Jupyter / R Markdown |
| Manuscript | Target: JAMA Surgery, Annals of Surgery, or SOARD |
| Supplementary material | Vignette bank, confusion matrices, analysis code |
| STARD flow diagram | Required for submission |

---

## 14. Target Journals (ranked by impact)

| Journal | IF (approx.) | Fit |
|---------|-------------|-----|
| JAMA Surgery | ~16 | AI in surgical decision-making — strong fit |
| Annals of Surgery | ~11 | Broad surgical audience |
| Surgery for Obesity and Related Diseases (SOARD) | ~4 | Domain-specific, high readership in bariatric community |
| Obesity Surgery | ~3.5 | Domain-specific alternative |
| npj Digital Medicine | ~13 | If framing emphasizes digital health / AI validation methodology |
| Journal of Medical Internet Research (JMIR) | ~7 | If framing emphasizes health informatics |

---

## 15. Timeline

| Phase | Duration | Activities |
|-------|----------|-----------|
| Preparation | Weeks 1-4 | Vignette authoring, expert panel recruitment, build vignette mode in weightwAIse, IRB determination |
| Pilot | Weeks 5-6 | Pilot 10 vignettes with 2 raters, refine |
| Data collection | Weeks 7-12 | Expert rating period (4 weeks) + weightwAIse vignette runs |
| Test-retest | Week 13 | Re-run 20 vignettes |
| Analysis | Weeks 14-16 | Statistical analysis, figures, tables |
| Writing | Weeks 17-20 | Manuscript drafting, internal review |
| Submission | Week 21 | Target journal submission |

---

## Appendix A: Vignette Template

```json
{
  "vignette_id": "VIG-001",
  "expected_pathway": "SURG_CANDIDATE",
  "is_borderline": false,
  "demographics": {
    "age": 42,
    "sex": "F",
    "ethnicity": "Hispanic",
    "primary_language": "English"
  },
  "anthropometrics": {
    "height_cm": 162,
    "weight_kg": 101,
    "bmi": 38.4
  },
  "weight_history": {
    "obesity_duration_years": 12,
    "max_bmi": 41.2,
    "prior_attempts": [
      {"type": "dietitian", "duration_months": 6, "outcome": "lost 5kg, regained"},
      {"type": "commercial_program", "name": "Weight Watchers", "duration_months": 12, "outcome": "lost 8kg, regained"},
      {"type": "pharmacotherapy", "drug": "liraglutide", "duration_months": 6, "outcome": "lost 7kg, regained after discontinuation"}
    ]
  },
  "comorbidities": [
    {"condition": "T2DM", "details": "A1c 8.2%, on metformin 1000mg BID"},
    {"condition": "OSA", "details": "moderate, on CPAP"},
    {"condition": "HTN", "details": "on lisinopril 20mg + amlodipine 5mg"}
  ],
  "medications": ["metformin 1000mg BID", "lisinopril 20mg daily", "amlodipine 5mg daily", "sertraline 50mg daily"],
  "surgical_history": ["laparoscopic cholecystectomy 2019"],
  "psychological": {
    "conditions": ["mild depression, well-controlled"],
    "eating_disorders": "none",
    "substance_use": "none"
  },
  "functional_status": {
    "asa_class": 2,
    "mobility": "ambulatory, no limitations",
    "social_support": "strong — supportive spouse, flexible work schedule"
  },
  "patient_preference": "Interested in surgery, concerned about long-term vitamin requirements",
  "special_flags": []
}
```

## Appendix B: Expert Rating Form Fields

| Field | Type | Options |
|-------|------|---------|
| Vignette ID | Auto-filled | VIG-XXX |
| Primary pathway | Single select | LIFESTYLE, PHARMA, SURG_CANDIDATE, SURG_URGENT, PSYCH_EVAL, CONTRA |
| Confidence | Likert 1-3 | 1 = Low, 2 = Moderate, 3 = High |
| Justification | Free text | Optional, 1-2 sentences |
| Alternative pathway considered | Single select | Same options + "None" |
| Any missing information that would change your decision? | Free text | Optional |
