# Guideline Adherence of a RAG-Powered AI Bariatric Surgery Consultant: A Systematic Evaluation

## Study Design & Methods

---

## 1. Study Overview

| Field | Detail |
|-------|--------|
| **Design** | Cross-sectional, systematic audit study |
| **Setting** | In silico — standardized vignettes evaluated against published guidelines |
| **Index system** | weightwAIse clinical decision engine (RAG + dual-LLM + rule-based decision tree) |
| **Reference standard** | Published clinical practice guidelines (ASMBS 2022, IFSO 2023, AGA 2024, NICE CG189) |
| **Reporting standard** | TRIPOD+AI, AGREE II (for guideline quality assessment) |
| **Registration** | OSF pre-registration recommended |
| **Ethics** | Exempt — no human subjects, synthetic vignettes only |
| **Target format** | Brief communication / Original research |

---

## 2. Objectives

### 2.1 Primary Objective

To determine the rate at which weightwAIse's clinical recommendations adhere to published bariatric and metabolic surgery guidelines when presented with standardized patient vignettes.

### 2.2 Secondary Objectives

1. Identify which specific guideline domains (surgical eligibility, contraindications, pre-operative requirements, procedure selection, comorbidity management) have the highest and lowest adherence rates.
2. Characterize the types of non-adherence (omission vs. commission vs. outdated recommendation).
3. Compare adherence across patient complexity tiers (straightforward vs. borderline vs. complex).
4. Assess whether RAG-retrieved evidence chunks align with the guideline statements that apply to each case.

---

## 3. Guideline Framework

### 3.1 Source Guidelines

| Guideline | Year | Issuing Body | Scope |
|-----------|------|-------------|-------|
| ASMBS/IFSO Indications for Metabolic and Bariatric Surgery | 2022 | ASMBS + IFSO | Surgical eligibility criteria, BMI thresholds, comorbidity indications |
| IFSO Guidelines on Conditions and Procedures | 2023 | IFSO | Procedure selection, contraindications, pre-operative evaluation |
| AGA Clinical Practice Guideline on Pharmacological Interventions for Adults with Obesity | 2024 | AGA | Pharmacotherapy indications and thresholds (for non-surgical pathway validation) |
| NICE Clinical Guideline CG189 (Obesity) | 2014, updated 2023 | NICE | Tiered management approach, BMI thresholds (includes ethnic adjustments) |
| ASMBS Guidelines on Psychological Assessment | 2023 | ASMBS | Psychological evaluation criteria |

### 3.2 Guideline Decomposition

Each guideline is decomposed into discrete, testable recommendation statements. Each statement is assigned:

- **Statement ID** (e.g., ASMBS-2022-S01)
- **Domain** (one of: eligibility, contraindication, pre-operative, procedure selection, comorbidity management, psychological, follow-up)
- **Strength** (strong recommendation, conditional recommendation, expert opinion)
- **Testability** (can this be evaluated from a vignette response? yes/no)

Only statements marked "testable = yes" are included in the audit.

**Expected yield:** ~60-80 testable statements across all guidelines.

### 3.3 Guideline Statement Examples

| ID | Domain | Statement | How to Test |
|----|--------|-----------|-------------|
| ASMBS-2022-S01 | Eligibility | Metabolic/bariatric surgery is recommended for individuals with BMI >= 35 regardless of comorbidities | Present vignette with BMI 36, no comorbidities — AI should recommend surgical pathway |
| ASMBS-2022-S02 | Eligibility | Metabolic/bariatric surgery should be considered for individuals with BMI 30-34.9 with metabolic disease | Present vignette with BMI 32 + T2DM — AI should recommend surgical pathway |
| ASMBS-2022-S03 | Eligibility | Lower BMI thresholds (27.5) should be used for Asian populations | Present Asian patient with BMI 28 + T2DM — AI should apply adjusted threshold |
| IFSO-2023-C01 | Contraindication | Active untreated substance abuse is a contraindication to bariatric surgery | Present vignette with active alcohol dependence — AI should route to CONTRA or PSYCH_EVAL |
| ASMBS-2023-P01 | Psychological | Patients with active binge eating disorder should receive psychological evaluation before surgical clearance | Present vignette with active BED — AI should route to PSYCH_EVAL |

---

## 4. Vignette Design

### 4.1 Vignette-to-Statement Mapping

Unlike the concordance study (which uses pathway-balanced vignettes), this study designs vignettes to **test specific guideline statements**. Each vignette is crafted to trigger one or more guideline recommendations.

### 4.2 Vignette Types

| Type | Description | Target N |
|------|-------------|----------|
| **Single-statement** | Tests one specific guideline recommendation in isolation | 40 |
| **Multi-statement** | Tests 2-3 overlapping recommendations (e.g., BMI threshold + comorbidity indication + psychological flag) | 30 |
| **Edge-case** | Tests boundary conditions (BMI exactly at threshold, resolved vs. active comorbidity, prior bariatric surgery) | 20 |
| **Negative control** | Patient who clearly does NOT meet any surgical criteria — AI should NOT recommend surgery | 10 |

**Total: 100 vignettes**, collectively covering all testable guideline statements at least twice.

### 4.3 Coverage Matrix

A coverage matrix is maintained ensuring:
- Every testable guideline statement is triggered by at least 2 vignettes
- Every domain has at least 10 vignettes
- Edge cases cover all pathway boundaries

### 4.4 Vignette Format

Same structured format as the concordance study (see Appendix A of that protocol), with an additional field:

```json
{
  "target_statements": ["ASMBS-2022-S01", "IFSO-2023-C01"],
  "expected_adherent_behavior": "Recommend surgical pathway AND flag substance abuse for evaluation"
}
```

---

## 5. Audit Procedure

### 5.1 weightwAIse Execution

1. Each vignette is entered into weightwAIse through the standard intake + consultation flow.
2. System version is locked (same commit, same knowledge base, same model versions as recorded at study start).
3. Full outputs captured: pathway assignment, consultation transcript, PDF report, RAG-retrieved chunks.

### 5.2 Adherence Scoring

For each vignette, two independent reviewers (the PI + one trained research assistant) evaluate each applicable guideline statement:

| Score | Definition | Example |
|-------|-----------|---------|
| **Adherent** | The AI's recommendation is consistent with the guideline statement | BMI 38 patient correctly routed to surgical pathway per ASMBS-2022-S01 |
| **Non-adherent: Omission** | The AI failed to address a relevant guideline recommendation | Patient with active BED not flagged for psychological evaluation |
| **Non-adherent: Commission** | The AI made a recommendation that contradicts the guideline | Recommended surgery for a patient with active untreated substance abuse |
| **Non-adherent: Outdated** | The AI applied an older version of a guideline (e.g., old BMI >= 40 threshold instead of >= 35) | Used pre-2022 BMI thresholds |
| **Not assessable** | The vignette did not elicit enough AI output to evaluate this statement | AI ended consultation early or gave vague response |

### 5.3 Reviewer Calibration

- Both reviewers independently score 10 pilot vignettes
- Disagreements discussed and resolved to establish scoring norms
- Cohen's kappa calculated for pilot; target >= 0.80 before proceeding
- Remaining vignettes scored independently; disagreements resolved by discussion

### 5.4 RAG Retrieval Audit

For each vignette, the RAG-retrieved context chunks are examined:

| Question | Scoring |
|----------|---------|
| Did the RAG system retrieve a chunk containing the applicable guideline text? | Yes / No / Partially |
| Was the retrieved chunk from the correct (most current) guideline version? | Yes / No |
| Did the LLM's response reflect the retrieved guideline content? | Faithfully / Partially / Ignored / Not retrieved |

This determines whether non-adherence stems from **retrieval failure** (guideline not found) or **reasoning failure** (guideline found but not applied correctly).

---

## 6. Outcomes & Statistical Analysis

### 6.1 Primary Outcome

**Overall guideline adherence rate:**

- Numerator: Total adherent scores across all vignette-statement pairs
- Denominator: Total assessable vignette-statement pairs
- Reported as percentage with 95% Wilson confidence interval

### 6.2 Secondary Outcomes

| Outcome | Analysis |
|---------|----------|
| Domain-specific adherence | Adherence rate per domain (eligibility, contraindication, pre-operative, procedure, psychological, comorbidity, follow-up) with 95% CIs |
| Non-adherence characterization | Proportion of non-adherence by type (omission, commission, outdated) — descriptive |
| Complexity-stratified adherence | Adherence rate by vignette complexity tier (single-statement vs. multi-statement vs. edge-case) |
| RAG retrieval success rate | Proportion of applicable guidelines successfully retrieved |
| Retrieval-reasoning gap | Among cases where guideline was retrieved, how often was it correctly applied? |
| Guideline source analysis | Adherence rate stratified by source guideline (ASMBS vs. IFSO vs. NICE vs. AGA) |
| Recommendation strength analysis | Adherence for strong recommendations vs. conditional recommendations |

### 6.3 Visualization

- **Adherence heatmap:** Domain (rows) x Guideline source (columns), cells colored by adherence rate
- **Failure mode Sankey diagram:** Flow from guideline statement -> retrieval success/failure -> reasoning success/failure -> adherence outcome
- **Forest plot:** Domain-specific adherence rates with 95% CIs

### 6.4 Sample Size Rationale

- With 100 vignettes and an average of 2.5 guideline statements per vignette, we expect ~250 vignette-statement pairs
- For an expected adherence rate of 85%, the 95% CI half-width is +/- 4.4%
- Sufficient to detect domain-specific adherence differences of >= 15% with reasonable power

### 6.5 Software

- Scoring: REDCap or structured spreadsheet with dual-entry
- Analysis: Python (pandas, statsmodels, matplotlib/seaborn) or R
- All code version-controlled and shared as supplementary material

---

## 7. Bias Mitigation

| Bias | Mitigation |
|------|-----------|
| Scorer bias (PI developed the system) | Second independent reviewer; inter-rater reliability reported; consider external reviewer for final adjudication |
| Selection bias in vignettes | Coverage matrix ensures all guideline statements tested; vignettes reviewed by independent surgeon for plausibility |
| Cherry-picking results | Pre-registration of outcomes and analysis plan; all statement-level results reported, not just aggregates |
| Guideline interpretation ambiguity | Guideline statements decomposed and operationalized before vignette creation; interpretation rules documented |
| Version confounding | Guideline versions explicitly declared; system knowledge base contents documented |

---

## 8. Relationship to Concordance Study

This study is designed to complement the concordance study (Study 1):

| Dimension | Concordance Study | Guideline Adherence Study |
|-----------|------------------|--------------------------|
| Question | Does AI agree with experts? | Does AI follow the guidelines? |
| Reference standard | Expert consensus | Published guidelines |
| Vignette design | Pathway-balanced | Statement-targeted |
| Primary metric | Cohen's kappa | Adherence rate (%) |
| Failure analysis | Where AI and experts disagree | Where AI deviates from guidelines |
| Unique insight | Clinical acceptability | Regulatory / quality assurance |

**Key synergy:** Cases where AI disagrees with experts BUT adheres to guidelines (or vice versa) are particularly interesting and should be highlighted in both manuscripts.

The same 100 vignettes from the concordance study can be reused here with additional guideline-targeted vignettes supplementing the set. This reduces total vignette authoring burden.

---

## 9. Ethical Considerations

- No human subjects — all synthetic vignettes
- IRB exempt (confirm with institutional policy)
- Conflict of interest: PI is the system developer — must be declared
- Negative results (low adherence in certain domains) are clinically important safety findings and must be reported

---

## 10. Limitations (to acknowledge in manuscript)

1. Guidelines themselves may have areas of ambiguity or insufficient evidence; adherence to an imperfect guideline is not the same as clinical correctness.
2. Synthetic vignettes test explicit information; real patients present with ambiguous or incomplete data.
3. This study evaluates one version of the system with one knowledge base snapshot — adherence may change as the RAG corpus is updated.
4. Guideline decomposition involves subjective judgment about what constitutes a "testable statement."
5. The study does not evaluate whether guideline-adherent recommendations lead to better patient outcomes.

---

## 11. Expected Deliverables

| Deliverable | Format |
|------------|--------|
| Guideline decomposition table | Supplementary table (all statements with IDs, domains, testability) |
| Coverage matrix | Supplementary table (statements x vignettes) |
| Vignette bank | Structured JSON (shared with concordance study where overlapping) |
| Scoring rubric | Document with examples for each adherence category |
| Raw scoring data | CSV with dual-reviewer scores and adjudication |
| Analysis notebook | Jupyter / R Markdown |
| Manuscript | Brief communication or original research |
| Adherence heatmap + Sankey diagram | Figures for manuscript |

---

## 12. Target Journals

| Journal | IF (approx.) | Format | Fit |
|---------|-------------|--------|-----|
| Surgery for Obesity and Related Diseases (SOARD) | ~4 | Brief communication | Ideal — domain-specific, guideline-focused audience |
| Obesity Surgery | ~3.5 | Original article | Good alternative |
| BMJ Quality & Safety | ~7 | Short report | If framing emphasizes AI quality assurance |
| npj Digital Medicine | ~13 | Brief communication | If framing emphasizes AI evaluation methodology |
| JMIR | ~7 | Original research | Health informatics angle |

**Note:** This paper can be published independently or as a companion to the concordance study. If submitted as a companion, cross-reference and coordinate submission timing.

---

## 13. Timeline

| Phase | Duration | Activities |
|-------|----------|-----------|
| Guideline decomposition | Weeks 1-3 | Extract and operationalize testable statements from all 5 guidelines |
| Vignette design | Weeks 3-5 | Design statement-targeted vignettes, build coverage matrix |
| Pilot scoring | Week 6 | Calibrate 2 reviewers on 10 vignettes, establish inter-rater norms |
| Data collection | Weeks 7-9 | Run all vignettes through weightwAIse, dual-reviewer scoring |
| RAG audit | Weeks 9-10 | Examine retrieved chunks for each vignette |
| Analysis | Weeks 11-12 | Statistical analysis, generate figures |
| Writing | Weeks 13-15 | Manuscript drafting |
| Submission | Week 16 | Submit to target journal |

**Note:** If running concurrently with the concordance study, Weeks 1-5 overlap with concordance study preparation. Shared vignettes reduce authoring burden. The guideline adherence study can start analysis as soon as weightwAIse runs are complete — it does not need to wait for the expert panel.

---

## Appendix A: Guideline Statement Decomposition Template

```yaml
statement_id: "ASMBS-2022-S01"
source: "ASMBS/IFSO 2022 Indications Guidelines"
domain: "eligibility"
strength: "strong recommendation"
original_text: >
  Metabolic and bariatric surgery is recommended for individuals
  with BMI >= 35 kg/m2 regardless of the presence, absence, or
  severity of obesity-related conditions.
testable: true
operationalized_test: >
  When presented with a patient with BMI >= 35 and no comorbidities,
  weightwAIse should recommend a surgical pathway (SURG_CANDIDATE
  or SURG_URGENT).
minimum_vignettes: 2
assigned_vignettes: ["VIG-012", "VIG-045"]
```

## Appendix B: Scoring Form Template

| Field | Type | Options |
|-------|------|---------|
| Vignette ID | Auto-filled | VIG-XXX |
| Statement ID | Auto-filled | ASMBS-2022-SXX |
| Adherence | Single select | Adherent, Non-adherent: Omission, Non-adherent: Commission, Non-adherent: Outdated, Not assessable |
| Evidence in transcript | Yes / No | Did the AI explicitly reference this guideline concept in its consultation? |
| RAG chunk retrieved | Yes / No / Partial | Was the relevant guideline text in the retrieved chunks? |
| RAG chunk applied | Faithfully / Partially / Ignored / N/A | If retrieved, was it correctly applied? |
| Reviewer notes | Free text | Optional |
