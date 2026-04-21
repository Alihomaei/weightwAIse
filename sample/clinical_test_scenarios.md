# WeightwAIse — Clinical Test Scenarios

These 10 diverse clinical scenarios are designed to test the WeightwAIse application's conversational intake flow, data extraction accuracy, and the adherence of the Clinical Decision Engine (Gemini 3.1 Pro) to ASMBS/IFSO guidelines. They cover every major decision pathway configured in the system.

---

## Scenario 1: Uncomplicated Class I Obesity
**Target Pathway**: Lifestyle Modification / Early Pharmacotherapy
**Objective**: Test the baseline routing for patients who do not yet meet surgical thresholds and haven't exhausted conservative therapies.

*   **Demographics**: 28-year-old Female, Height: 165 cm, Weight: 84 kg (BMI: 30.8)
*   **Comorbidities**: None.
*   **Previous Attempts**: Tried Weight Watchers for 6 months, lost 3kg, regained. No history of using weight loss medications (GLP-1s).
*   **Psychological**: Occasional emotional eating triggered by work stress. No eating disorders.
*   **Family/Social**: No family history of obesity. Non-smoker, drinks socially (1-2 drinks/week). Sedentary office job, exercises occasionally.
*   **Surgical History**: None.

---

## Scenario 2: Class I Obesity with T2DM
**Target Pathway**: Pharmacotherapy Primary / Surgery Candidate (Metabolic Indication)
**Objective**: Test Gate 1 and Gate 2 rules where a lower BMI (30-34.9) triggers a surgical consideration specifically because the patient has Type 2 Diabetes.

*   **Demographics**: 45-year-old Male, Height: 178 cm, Weight: 108 kg (BMI: 34.1)
*   **Comorbidities**: Type 2 Diabetes (HbA1c 8.2%), Hypertension, Dyslipidemia.
*   **Previous Attempts**: Metformin for T2DM management. Tried low-carb diet. Never used GLP-1 weight-loss medications. No previous weight-loss surgeries.
*   **Psychological**: No psychological issues or emotional eating.
*   **Family/Social**: Father had T2DM. Former smoker (quit 5 years ago). Married with good support system.
*   **Surgical History**: Appendectomy (2005) with no anesthesia complications.

---

## Scenario 3: Class II Obesity with Comorbidities (Failed GLP-1)
**Target Pathway**: Strong Surgery Candidate
**Objective**: Test Gate 3 (failed meds). With a BMI >35, comorbidities, and failed pharmacotherapy, the system should strongly recommend surgical consultation. GERD presence should test LLM's procedure-specific context (e.g., RYGB over Sleeve).

*   **Demographics**: 38-year-old Female, Height: 160 cm, Weight: 97 kg (BMI: 37.9)
*   **Comorbidities**: Obstructive Sleep Apnea (uses CPAP), severe GERD, PCOS.
*   **Previous Attempts**: Tried Semaglutide (2.4mg) for 8 months. Lost 8kg but plateaued. Stopped due to costs.
*   **Psychological**: Treated depression (well-controlled on SSRIs).
*   **Family/Social**: Mother had gastric bypass surgery. Never smoked. Active support system.
*   **Surgical History**: Laparoscopic cholecystectomy (gallbladder removal).

---

## Scenario 4: Class III Obesity, Uncomplicated
**Target Pathway**: Surgery Candidate
**Objective**: Test Gate 1 rule where BMI ≥ 40 justifies bariatric surgery independent of specific comorbidities.

*   **Demographics**: 32-year-old Male, Height: 182 cm, Weight: 140 kg (BMI: 42.3)
*   **Comorbidities**: Mild joint pain (knees). No diagnosed metabolic diseases.
*   **Previous Attempts**: Numerous supervised diets (keto, paleo), periods of heavy gym use, invariably regains weight.
*   **Psychological**: Binge eating tendencies, but no formal diagnosis.
*   **Family/Social**: Strong family history of severe obesity on both maternal and paternal sides. Works in construction. Never smoked.
*   **Surgical History**: None.

---

## Scenario 5: Super-Obese, High Risk
**Target Pathway**: Surgery Urgent
**Objective**: Test the "Surgery Urgent" pathway for BMI ≥ 50, requiring careful LLM phrasing addressing the urgency and surgical risks associated with high BMI.

*   **Demographics**: 52-year-old Female, Height: 168 cm, Weight: 155 kg (BMI: 54.9)
*   **Comorbidities**: Severe osteoarthritis (mostly wheelchair dependent), poorly controlled T2DM, severe OSA, Hypertension.
*   **Previous Attempts**: Unable to exercise due to joints. Tried Phentermine years ago with little effect.
*   **Psychological**: Moderate depression due to poor mobility.
*   **Family/Social**: Lives with daughter who is the primary caretaker. Non-smoker.
*   **Surgical History**: C-section (x2). Difficult intubation noted in the past.

---

## Scenario 6: Active Eating Disorder
**Target Pathway**: Needs Psych Eval / Temporarily Contraindicated
**Objective**: Test Gate 2 modifiers. Active eating disorders represent a psychological contraindication requiring specialized care before surgery can be safely performed.

*   **Demographics**: 25-year-old Female, Height: 162 cm, Weight: 95 kg (BMI: 36.2)
*   **Comorbidities**: None medically.
*   **Previous Attempts**: Frequent crash diets, occasionally uses over-the-counter laxatives.
*   **Psychological**: Active Bulimia Nervosa. Intense fear of weight gain but binges and purges regularly. High emotional eating.
*   **Family/Social**: Single, high-stress job in fashion. Heavy alcohol use (3-4 times a week).
*   **Surgical History**: None.

---

## Scenario 7: Bariatric Revision Candidate
**Target Pathway**: Revisional Surgery Candidate
**Objective**: Test the system's ability to extract prior surgical data, recognize complications (slipped band, weight regain), and route to a revisional bariatric consultation rather than a primary procedure.

*   **Demographics**: 44-year-old Female, Height: 165 cm, Weight: 106 kg (BMI: 38.9)
*   **Comorbidities**: Severe intractable GERD, early-stage Barrett's esophagus.
*   **Previous Attempts**: Laparoscopic Adjustable Gastric Band (Lap-Band) in 2012. Lost 30kg initially, regained 25kg. Currently on Wegovy with poor tolerance due to reflux.
*   **Psychological**: Frustrated but highly motivated to resolve GERD and weight regain.
*   **Family/Social**: Supportive spouse. Non-smoker.
*   **Surgical History**: Lap-Band insertion (2012), Lap-Band removal due to slippage (2021). No anesthesia complications.

---

## Scenario 8: Absolute Contraindications (Substance Abuse & Severe Risk)
**Target Pathway**: Contraindicated
**Objective**: Test Gate 2 (active substance abuse) and Gate 4 (severe anesthesia contraindications). The AI must identify that surgery is not safe and recommend alternative medical pathways or rehabilitation.

*   **Demographics**: 59-year-old Male, Height: 175 cm, Weight: 142 kg (BMI: 46.4)
*   **Comorbidities**: Severe COPD (on home oxygen), Alcoholic Cirrhosis (Child-Pugh B), recent NSTEMI (heart attack) 3 months ago.
*   **Previous Attempts**: None recently.
*   **Psychological**: Active severe alcohol use disorder (drinks roughly a pint of hard liquor daily). Refuses rehab.
*   **Family/Social**: Divorced, lives alone. Smokes 2 packs of cigarettes per day.
*   **Surgical History**: None.

---

## Scenario 9: Adolescent Patient
**Target Pathway**: Surgery Candidate (Special Protocol)
**Objective**: Test Gate 4 age considerations. The system should apply pediatric/adolescent guidelines and stress the need for specialized adolescent multidisciplinary teams.

*   **Demographics**: 17-year-old Female, Height: 163 cm, Weight: 115 kg (BMI: 43.3)
*   **Comorbidities**: Pre-diabetes, NAFLD (Non-Alcoholic Fatty Liver Disease).
*   **Previous Attempts**: Working with a pediatric nutritionist for 2 years. Tried Orlistat with intolerable side effects.
*   **Psychological**: Mild anxiety, severe bullying at school. Mature and understands the implications of surgery.
*   **Family/Social**: Mother is highly supportive and will manage the post-op diet. High school student. Non-smoker.
*   **Surgical History**: Tonsillectomy as a child.

---

## Scenario 10: Pharmacotherapy Candidate (Frequent Traveler)
**Target Pathway**: Pharmacotherapy Primary
**Objective**: Test routing for a patient eligible for surgery/meds who has lifestyle barriers to immediate surgery, pushing the AI to lean on GLP-1 recommendations per current guidelines.

*   **Demographics**: 36-year-old Male, Height: 180 cm, Weight: 110 kg (BMI: 33.9)
*   **Comorbidities**: Dyslipidemia. No T2DM.
*   **Previous Attempts**: Used the Noom app for 1 month casually. Never tried GLP-1 agonists.
*   **Psychological**: Stress eater during travel.
*   **Family/Social**: Works as a consultant, travels 4 days a week, eats out for 90% of meals. Occasional smoker.
*   **Surgical History**: Knee arthroscopy (2019).
