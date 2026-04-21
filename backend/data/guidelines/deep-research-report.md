# Collecting and Preparing Visual Materials for a Medical Presentation Involving Drugs and Surgical Operations

## Executive summary

This report addresses the end-to-end workflow for sourcing (or producing), technically preparing, and legally/ethically clearing visual assets for a medical presentation that includes **drug content** (product photos, dosage forms, packaging/labeling, diagrams of mechanism) and **surgical content** (anatomical illustrations, procedural step images, risks, and postoperative care infographics). Because you did not specify particular drugs or operations, this report assumes a **general** surgical context and uses a small number of **illustrative examples** (e.g., drug labeling/package photos from the U.S. drug-labeling ecosystem and open-access surgical-technique figures) to demonstrate practical sourcing patterns and rights constraints. citeturn5search0turn14view1turn12view2turn12view1

Key takeaways:

- The most reliable “high-yield” visual sources for medical presentations are those with **explicit reuse terms**: open-license medical art libraries (e.g., CC BY), open-access journals with clear Creative Commons licenses, and U.S. government images that are explicitly public domain (unless otherwise noted). citeturn0search8turn2search1turn2search2turn7search0turn1search5  
- “Open access” does **not** always mean “editable and reusable without constraints.” Common restrictions include **NoDerivatives (ND)** and **NonCommercial (NC)**, which can block adaptation (recoloring, cropping, annotating, combining) and can be problematic for industry-sponsored talks or broadly distributed slide decks. citeturn12view1turn4search29turn2search19  
- For **drug images**, widely accessible regulatory-labeling portals can provide packaging and some product visuals, but the safest path to true “presentation-grade” photography is often either (a) a **manufacturer media/press kit with written permission** or (b) **your own photography** under controlled conditions (which simplifies licensing). citeturn5search14turn13view0turn7search18turn6search3  
- For **surgical images**, open-access technique articles can provide high-resolution figure files (sometimes even original TIFFs), but you must confirm the exact license and check for third‑party figure components. citeturn12view2turn7search16turn2search2  
- For patient/intraoperative images, the strongest practice is “**consent if any doubt**” and to treat recognizable photographs as sensitive identifiers; HIPAA de-identification includes “full-face photographs and comparable images” as identifiers. citeturn1search2turn1search3turn1search26  

## Assumptions and scope

You explicitly stated:
- **No specific drugs** were provided → I assume no constraints and cover common drug image formats (tablets/capsules; vials/ampoules; blister packs; bottles; cartons/outer packaging; label panels).  
- **No specific operations** were provided → I assume general surgical procedures and focus on a reusable approach for common operations (open and minimally invasive) rather than procedure-specific anatomy.  
- You want both an **executive summary and an analytical report**, and you want **web links**, example references, a **source-comparison table**, **infographic mockups**, and a **mermaid workflow**.

This scope choice matters because licensing/permissions and image choices differ substantially between (a) a teaching talk in a hospital, (b) CME content posted online, and (c) industry-sponsored or promotional-use slide decks. The contact points and permission pathways also differ by publisher and by whether you are adapting the image. citeturn9search0turn9search1turn9search15turn9search14

## Source landscape and licensing analysis

A practical medical-presentation workflow typically mixes four image classes: **drug photos**, **anatomy/procedure illustrations**, **procedural/intraoperative images**, and **infographics** you author. Below is how the main source categories behave in terms of quality, reliability, and rights.

### Open-license medical illustration libraries and anatomy assets

- **entity["organization","Servier Medical Art","medical illustration library"] (SMART)**: explicitly states its images are available under **CC BY 4.0**, allowing reuse and adaptation (including commercial) with proper credit; it provides a recommended attribution string. citeturn0search4turn0search8turn0search0  
- **Open textbook anatomy images (OpenStax)**: the textbook content is under **CC BY** with required attribution; however, OpenStax warns that some brand elements (e.g., logos) are not covered and must not be reused without permission. citeturn0search31turn0search15turn0search7  
- **entity["organization","BodyParts3D","dbcls anatomy database"]: the licensing page specifies **CC BY 4.0** and provides a required attribution statement for reuse. (Historically, some BodyParts3D/Anatomography outputs were CC BY-SA 2.1 Japan; always follow the license shown for the specific asset/version you use.) citeturn4search0turn4search4turn4search5  
- **entity["organization","Wikimedia Commons","open media repository"]: Commons accepts only freely licensed or public-domain media; each file has its own license and you should verify it for your specific reuse. citeturn3search7turn18search13turn3search3  

image_group{"layout":"carousel","aspect_ratio":"1:1","query":["SMART Servier Medical Art anatomy illustration CC BY 4.0","BodyParts3D Anatomography example rendering","OpenStax Anatomy and Physiology figure CC BY","Wikimedia Commons anatomical diagram public domain"]}

### Open-access journals and figure reuse

- Many open-access journals apply **CC BY 4.0** (or comparable permissive licenses), enabling reuse and adaptation with attribution. For example, **entity["organization","PLOS ONE","open access journal"] describes applying CC BY 4.0 to published works, allowing reuse when properly cited; **entity["organization","BMC Surgery","open access journal"] states its work is licensed under CC BY 4.0. citeturn2search1turn2search5turn2search2  
- Important caveat: even in open repositories, specific figures may include third-party materials not covered by the surrounding license. entity["organization","PubMed Central","biomedical full-text archive"] explicitly warns that open access/public domain articles may still contain copyrighted photographs/illustrations that require permission. citeturn7search16  

Concrete example of “presentation-grade” figure files from an open-access surgical paper:
- A technique paper hosted on Springer/BMC shows “authors’ original submitted files” downloadable as **TIFF** (useful for high-resolution slide and print graphics) and states it is distributed under a **Creative Commons Attribution license**. citeturn12view2  

### Drug product images and labeling visuals

- **Regulatory-labeling portals (U.S.)**: **entity["organization","DailyMed","nlm drug labeling database"] hosts manufacturer/labeler-submitted labeling (SPL); it includes package/label images for some products and provides downloadable label files. citeturn5search0turn11view2turn6search13  
  - DailyMed includes technical guidance for oral-solid “SPLIMAGE” submissions (e.g., 1024×768 pixels, JPEG, sRGB, size limits). This is valuable as a **minimum technical baseline**, but it is not a guarantee of “high-res, poster-grade” imagery. citeturn5search14  
  - Example: DailyMed package photo pages show carton/label artwork images for injectables such as cefazolin cartons. citeturn13view0turn13view1turn11view2  
- **Manufacturer product pages / media kits**: most manufacturer sites treat website content (including images) as copyrighted and restrict reuse unless permission is granted. A typical manufacturer legal notice explicitly instructs users to assume all website contents are copyrighted and prohibits image use without express written permission. citeturn7search18  
- **RxImage / pill-photo datasets**: NLM previously provided the RxImage API and indicated it was discontinued; some datasets may remain downloadable, and some pill images may be supplied by labelers in SPL. However, some pill-photo collections (e.g., research datasets) can be restricted to research-and-development use only—so they are often unsuitable for general presentations, promotion, or broad distribution. citeturn0search22turn0search26turn0search13  

### Government sources for figures/graphics

- **entity["organization","U.S. Food and Drug Administration","drug regulator us"] states that, unless otherwise noted, the contents of its website (text and graphics) are public domain and may be used without permission (credit appreciated). This is especially helpful for regulatory flowcharts, public-facing educational graphics, or non–third-party FDA visuals. citeturn7search0  
- **entity["organization","Centers for Disease Control and Prevention","public health agency us"] image libraries: the CDC indicates most images in its Public Health Image Library are royalty-free/public domain and can be used with appropriate credit; some items may be copyright-protected and the per-image statement should be checked. citeturn1search5turn1search1turn1search33  

### Quick “web links” bundle

The citations throughout this report resolve as clickable links. If you also want a plain link list for your workflow documentation, here are key starting points (all are also cited in-context):

```text
SMART Servier Medical Art (CC BY 4.0): https://smart.servier.com/
How to cite: https://smart.servier.com/how-to-cite-servier-medical-art/

DailyMed (drug labels & some package photos): https://dailymed.nlm.nih.gov/
SPLIMAGE technical guidance: https://dailymed.nlm.nih.gov/dailymed/splimage-guidelines.cfm

PLOS ONE license: https://journals.plos.org/plosone/s/licenses-and-copyright
BMC Surgery open access policy: https://www.bmcsurgery.com/guidelines/

BodyParts3D licensing: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html

CDC PHIL FAQ: https://wwwn.cdc.gov/PHIL/FAQ.aspx
FDA Website Policies (public domain statement): https://www.fda.gov/about-fda/about-website/website-policies

HIPAA De-identification (HHS): https://www.hhs.gov/hipaa/for-professionals/special-topics/de-identification/index.html
ICMJE privacy guidance: https://www.icmje.org/recommendations/browse/roles-and-responsibilities/protection-of-research-participants.html

PowerPoint export-resolution guidance (Microsoft): https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/powerpoint/change-export-slide-resolution
```

## Technical specifications for high-quality assets

This section focuses on making images look sharp on modern projectors, conference screens, and recordings—while preserving an archival “master” that you can reuse later.

### Resolution targets for medical slide decks

- For **Full HD delivery**, a common practical target is ensuring a full-slide background image is at least **1920×1080 px** (or larger if you plan to crop/zoom). citeturn1search4turn1search28  
- For **4K delivery**, aim for **3840×2160 px** for full-slide background photography; smaller images can still be adequate if they occupy only part of the slide. citeturn1search12turn1search28  
- If you frequently need to export slides as images for handouts or websites, note that some PowerPoint export workflows have pixel limits (historically described as ~3072 pixels on the long edge for some versions/export methods). Plan to keep an external “master” asset library rather than relying on slide exports as your only high-res source. citeturn1search16  

### Recommended file formats by asset type

- **Photographs (drugs, devices, OR photos)**:  
  - *Working format for slides*: high-quality **JPEG** (quality ~85–95) or **PNG** if transparency is useful.  
  - *Archival master*: **TIFF** (uncompressed or LZW) when you need maximum quality and future-proofing.  
  - When an open-access journal provides original TIFF figure files, prefer those over embedded low-res PDFs. citeturn12view2  

- **Line art (anatomy drawings, diagrams, infographics)**:  
  - Prefer **vector** whenever possible (SVG/PDF/EPS) to avoid pixelation at zoom.  
  - If you must use raster: **PNG** (lossless) is usually better than JPEG for crisp labels and sharp edges.

- **Drug dosage-form images from labeling ecosystems**:  
  - SPLIMAGE guidance describes a standardized pill photo format (e.g., 1024×768, JPEG, sRGB) used for regulatory submissions. Treat this as a **minimum** and expect to supplement with manufacturer photography or your own images for high-end visuals. citeturn5search14  

### Color, accessibility, and iconography standards

- Use **contrast targets** consistent with accessibility guidance: WCAG references commonly used thresholds such as **4.5:1 for normal text** and **3:1 for graphical objects/icons** in many contexts. citeturn2search7turn2search3turn2search15  
- Prefer a colorblind-friendly palette for categorical highlights. A widely used option is the **Okabe–Ito** palette; the creators’ Color Universal Design resources explicitly encourage reuse for classes/seminars with credit. citeturn8search1turn8search0  
- Icon sources with clear licensing reduce friction:
  - **entity["organization","Bioicons","open science icon library"] offers icons under permissive licenses (CC0, CC BY variants, MIT) and provides SVG downloads. citeturn3search1turn3search21  
  - **entity["organization","Font Awesome","icon library"] specifies that its free icons packaged as SVG/JS are under CC BY 4.0, with code/fonts under other licenses—useful if you want consistent UI-style pictograms. citeturn3search2turn3search32  
  - **entity["company","BioRender","scientific illustration software"] can be excellent for medical schematics, but licensing depends on your plan and whether the figure is for publication vs educational presentation; their help pages describe publication rights and restrictions. citeturn3search4turn3search31turn3search0  

## Infographic concepts and mockups

You requested **two mockups per topic** for: indications, mechanisms, dosing, contraindications, steps of the operation, risks, and postoperative care. The mockups below are intended as “wireframes” you could build in PowerPoint/Keynote/Figma/Illustrator; they assume you’ll drop in properly licensed images and your own text.

Color palette recommendation (applies to all topics):
- Base: neutral background (white or very light gray), primary text in near-black.
- Accents: Okabe–Ito-style categorical colors for highlights (limit to ~4 on a single slide). citeturn8search1turn8search0  
- Safety cues: reserve one high-salience “warning” color (often orange/vermilion) and ensure contrast targets for icons/text. citeturn2search15turn2search3  

Iconography recommendation:
- Use a single icon family (stroke weight/style) for consistency; pull medical icons from Bioicons where possible; document per-icon license/credit when required. citeturn3search1turn3search9  

### Indications

**Mockup A: “Eligibility tile + decision tree” (single slide)**  
```text
┌──────────────────────────────────────────────────────────────┐
│ DRUG / PROCEDURE NAME (generic)                               │
│ One-line clinical intent                                      │
├─────────────────────────┬────────────────────────────────────┤
│ INDICATIONS (tiles)     │ QUICK DECISION TREE                │
│ □ Indication 1          │ Start → Criteria A? → Yes/No        │
│ □ Indication 2          │        ↓                             │
│ □ Indication 3          │ Contraindication? → Stop/Alternative │
│                         │        ↓                             │
│                         │ Next step / referral                 │
├─────────────────────────┴────────────────────────────────────┤
│ Evidence line + guideline citation + image credit             │
└──────────────────────────────────────────────────────────────┘
```

**Mockup B: “Phenotype-to-therapy map” (two-column)**  
```text
┌──────────────────────────────────────────────────────────────┐
│ INDICATIONS AT A GLANCE                                       │
├───────────────────────────────┬──────────────────────────────┤
│ Patient phenotype / context    │ Recommended option           │
│ • Comorbidity cluster A        │ → Option 1 (why)             │
│ • Cluster B                    │ → Option 2 (why)             │
│ • Cluster C                    │ → Not recommended (why)      │
├───────────────────────────────┴──────────────────────────────┤
│ Footer: contraindications reminder + references + credits     │
└──────────────────────────────────────────────────────────────┘
```

### Mechanisms

**Mockup A: “Mechanism storyboard” (left-to-right pathway)**  
```text
┌──────────────────────────────────────────────────────────────┐
│ MECHANISM OF ACTION                                           │
├──────────────────────────────────────────────────────────────┤
│ [Target] → [Binding/Step] → [Cellular effect] → [Clinical]     │
│   icon        arrow            icon               outcome      │
│ (optional: small receptor/cell diagram behind pathway)         │
├──────────────────────────────────────────────────────────────┤
│ Callout box: onset/duration + key interaction note             │
└──────────────────────────────────────────────────────────────┘
```

**Mockup B: “Layered anatomy + mechanism overlay” (surgery or drug)**  
```text
┌──────────────────────────────────────────────────────────────┐
│ MECHANISM / PHYSIOLOGY OVERLAY                                │
├───────────────────────────────┬──────────────────────────────┤
│ Anatomy illustration (base)    │ Key mechanism bullets        │
│ (vector) with numbered pins    │ 1) ...                       │
│ ① ② ③                          │ 2) ...                       │
│                               │ 3) ...                       │
├───────────────────────────────┴──────────────────────────────┤
│ Legend: pin labels + citations + art credit                   │
└──────────────────────────────────────────────────────────────┘
```

### Dosing

**Mockup A: “Dosing ladder + renal/hepatic adjustment” (grid)**  
```text
┌──────────────────────────────────────────────────────────────┐
│ DOSING SUMMARY                                                 │
├───────────────────────────────┬──────────────────────────────┤
│ Standard adult dosing          │ Adjustments                  │
│ • Dose: ___                    │ • Renal: rules / table       │
│ • Interval: ___                │ • Hepatic: rules             │
│ • Route: ___                   │ • Age/frailty: note          │
├───────────────────────────────┴──────────────────────────────┤
│ Monitoring: labs/vitals + max dose warning + references       │
└──────────────────────────────────────────────────────────────┘
```

**Mockup B: “24-hour clock + perioperative timing”**  
```text
┌──────────────────────────────────────────────────────────────┐
│ DOSING & TIMING (PERIOP / INPATIENT)                          │
├──────────────────────────────────────────────────────────────┤
│ 0h ──●────●────●────●────●──── 24h                             │
│     pre   intra  PACU  ward   next dose                        │
│ Notes under each marker (route, dose, key hold criteria)       │
├──────────────────────────────────────────────────────────────┤
│ Box: missed dose / hold parameters / restart rules             │
└──────────────────────────────────────────────────────────────┘
```

### Contraindications

**Mockup A: “Red flag panel + relative contraindications”**  
```text
┌──────────────────────────────────────────────────────────────┐
│ CONTRAINDICATIONS & WARNINGS                                  │
├───────────────────────────────┬──────────────────────────────┤
│ Absolute contraindications     │ Relative / caution           │
│ ⛔ 1) ...                      │ ⚠ 1) ...                     │
│ ⛔ 2) ...                      │ ⚠ 2) ...                     │
│ ⛔ 3) ...                      │ ⚠ 3) ...                     │
├───────────────────────────────┴──────────────────────────────┤
│ Interactions & monitoring triggers (icons + short text)       │
└──────────────────────────────────────────────────────────────┘
```

**Mockup B: “Stoplight matrix (condition × action)”**  
```text
┌──────────────────────────────────────────────────────────────┐
│ CONTRAINDICATION MATRIX                                       │
├───────────────────────────────┬───────────┬───────────┬──────┤
│ Condition / factor            │ OK (green)│ Caution    │ Stop │
├───────────────────────────────┼───────────┼───────────┼──────┤
│ Example condition A           │    ✓      │           │      │
│ Example condition B           │           │    ⚠      │      │
│ Example condition C           │           │           │  ⛔  │
└──────────────────────────────────────────────────────────────┘
```

### Steps of the operation

**Mockup A: “Step strip with anatomy inset” (procedural storyboard)**  
```text
┌──────────────────────────────────────────────────────────────┐
│ PROCEDURE OVERVIEW (generic)                                  │
├──────────────────────────────────────────────────────────────┤
│ Step 1      Step 2      Step 3      Step 4      Step 5        │
│ [img]       [img]       [img]       [img]       [img]         │
│ 1-line cap  1-line cap  1-line cap  1-line cap  1-line cap    │
├──────────────────────────────────────────────────────────────┤
│ Inset: anatomy diagram with key landmarks                     │
└──────────────────────────────────────────────────────────────┘
```

**Mockup B: “Instruments + ports + critical anatomy” (lap-style)**  
```text
┌──────────────────────────────────────────────────────────────┐
│ OPERATIVE SETUP + KEY STEPS                                   │
├───────────────────────────────┬──────────────────────────────┤
│ Port map / patient position   │ Critical view / key landmarks │
│ [diagram]                     │ [diagram] + numbered points   │
├───────────────────────────────┴──────────────────────────────┤
│ 3-step summary + pitfalls + troubleshooting callouts          │
└──────────────────────────────────────────────────────────────┘
```

### Risks

**Mockup A: “Risk categories + frequency banding”**  
```text
┌──────────────────────────────────────────────────────────────┐
│ RISKS & COMPLICATIONS                                         │
├───────────────────────────────┬──────────────────────────────┤
│ Common (≥X%)                  │ Serious / rare               │
│ • ...                         │ • ...                         │
│ • ...                         │ • ...                         │
│ (use icons per organ-system)  │ (use escalation icons)        │
├───────────────────────────────┴──────────────────────────────┤
│ When to escalate / call surgeon / ED triggers                 │
└──────────────────────────────────────────────────────────────┘
```

**Mockup B: “Risk matrix (severity × likelihood) + mitigations”**  
```text
┌──────────────────────────────────────────────────────────────┐
│ RISK MATRIX                                                   │
├──────────────────────────────────────────────────────────────┤
│ Likelihood ↑                                                  │
│   High   [  ] [  ] [  ]                                       │
│   Med    [  ] [  ] [  ]   → Each cell has 1–2 risks           │
│   Low    [  ] [  ] [  ]                                       │
│         Low  Med  High  Severity →                            │
├──────────────────────────────────────────────────────────────┤
│ Mitigation checklist (prophylaxis, monitoring, red flags)     │
└──────────────────────────────────────────────────────────────┘
```

### Postoperative care

**Mockup A: “Follow-up timeline with milestones”**  
```text
┌──────────────────────────────────────────────────────────────┐
│ POSTOPERATIVE CARE TIMELINE                                   │
├──────────────────────────────────────────────────────────────┤
│ POD0 ─ POD1 ─ Week1 ─ Week2 ─ Month1 ─ Month3 ─ Long-term      │
│ • pain • diet • wound • meds • activity • labs • follow-up     │
├──────────────────────────────────────────────────────────────┤
│ Box: warning symptoms + contact instructions                  │
└──────────────────────────────────────────────────────────────┘
```

**Mockup B: “Care bundle checklist (ERAS-style visual)”**  
```text
┌──────────────────────────────────────────────────────────────┐
│ POSTOP BUNDLE                                                 │
├───────────────────────────────┬──────────────────────────────┤
│ In-hospital bundle            │ At-home bundle               │
│ □ VTE prophylaxis             │ □ Wound care                 │
│ □ Early mobilization          │ □ Diet progression           │
│ □ Pulmonary hygiene           │ □ Med adherence              │
│ □ Pain plan (opioid-sparing)  │ □ Follow-up appointments      │
└──────────────────────────────────────────────────────────────┘
```

## Ethical, privacy, and permissions workflow

### Patient images, intraoperative photos, and consent

- **Patient privacy**: The ICMJE states that identifiable patient information—including photographs—should not be published without written informed consent, and patients should be told that online dissemination may occur. citeturn1search2turn1search14  
- **HIPAA de-identification**: HHS lists “full-face photographs and any comparable images” among the identifiers that must be removed for Safe Harbor de-identification; this is a strong reminder that faces (and comparable identifying imagery) are high risk in educational materials. citeturn1search3  
- “Blur the eyes” is often insufficient; older ICMJE guidance explicitly notes that masking the eye region is inadequate protection of anonymity. citeturn1search26  
- If you plan to use clinical images, build a “consent + de-identification + audit trail” workflow that treats social media and conference reposting as likely. Recent scholarship highlights that open-access publication of patient photographs is complex and requires robust safeguards. citeturn1search6turn1search18  

### Permissions and rights clearance steps

For non–open-license items (publisher figures, textbooks, manufacturer photography), plan for permissions early:

1. **Identify the rights holder**  
   - Often the publisher holds the rights for figures in subscription journals/books unless explicitly stated otherwise. citeturn9search0turn9search30  

2. **Determine your use case**  
   - Live talk only vs recorded/web-posted; internal training vs external; nonprofit education vs sponsored. Different uses can require different permissions. citeturn9search14turn9search3  

3. **Request permission via the publisher’s workflow**  
   - Many major publishers route permissions through **RightsLink** (via Copyright Clearance Center). Elsevier and others describe this process explicitly. citeturn9search1turn9search32turn9search15  

4. **Document the grant**  
   - Save the license PDF/email, keep the “scope of use” (audience size, distribution, duration, territory), and store it with the asset in your library.

5. **Use the required credit line**  
   - If a license requires “Used with permission,” include it in the caption/credit line.

### End-to-end workflow flowchart (selection → final assets)

```mermaid
flowchart TD
  A[Define scope: drugs + operations + audience + distribution] --> B[Build asset list + required messages]
  B --> C[Source triage: open-license vs permission-needed vs self-created]
  C --> D{Rights check}
  D -->|CC BY/CC0/PD OK| E[Download master files + capture license metadata]
  D -->|NC/ND/unclear| F[Decide: use as-is, replace, or request permission]
  F --> G[Request permission (RightsLink/publisher/manufacturer)]
  G --> H{Permission granted?}
  H -->|Yes| E
  H -->|No| I[Replace with open-license or create new asset]
  E --> J[Technical prep: crop, color, labels, anonymize, accessibility]
  J --> K[Caption + attribution + alt text + keywords]
  K --> L[Versioning + archive masters + export slide-ready files]
  L --> M[Final QA: readability, licensing, privacy, citation audit]
```

## Candidate source comparison and practical templates

### Table comparing candidate image sources

| Source (site) | Best image types | Typical availability/resolution | License / reuse posture | Cost | Reliability & cautions |
|---|---|---|---|---|---|
| entity["organization","Servier Medical Art","medical illustration library"] | Anatomy, physiology, drug/medical concept vectors | Often vector (downloadable), presentation-friendly | CC BY 4.0; reuse + adapt with attribution; recommended credit text provided citeturn0search0turn0search8 | Free | High reliability for licensing clarity; verify per-asset if anything differs citeturn0search8 |
| OpenStax (Anatomy & Physiology) | Anatomy diagrams, educational figures | Mixed; often good slide quality | CC BY; attribution required; some brand elements excluded citeturn0search31turn0search15 | Free | Strong for foundational anatomy; check figure-level credits if present citeturn0search31 |
| entity["organization","BodyParts3D","dbcls anatomy database"] | Custom 3D anatomy renderings, labels | 3D-derived; can generate views | License page specifies CC BY 4.0 + required attribution string citeturn4search0turn4search8 | Free | Excellent for customizable anatomic views; confirm license for the specific output/version citeturn4search4turn4search0 |
| entity["organization","Wikimedia Commons","open media repository"] | Broad: anatomy diagrams, icons, historical atlases | Varies greatly; some very high-res | File-specific free licenses/PD; you must verify license per file citeturn3search7turn18search13 | Free | Great breadth; verify attribution requirements and provenance; no warranty citeturn18search13 |
| entity["organization","PLOS ONE","open access journal"] | Figures: mechanisms, outcomes plots, some procedure schematics | Often high-res; can access article figures | Generally CC BY 4.0 with proper citation citeturn2search1turn2search5 | Free | Strong for reuse; still watch for third-party material embedded in figures citeturn7search16 |
| entity["organization","BMC Surgery","open access journal"] | Procedural figures, technique diagrams; sometimes original TIFFs | Can include original submitted TIFFs on article pages citeturn12view2 | Licensed under CC BY 4.0 (journal policy); older articles may show CC BY 2.0 on-page citeturn2search2turn12view2 | Free | Excellent for surgical step figures; check the on-article license and any third‑party figure notes citeturn12view2turn7search16 |
| entity["organization","DailyMed","nlm drug labeling database"] | Package photos, label panels, sometimes product visuals | Varies; SPLIMAGE standard describes 1024×768 JPEG for oral solids citeturn5search14 | Labeling is manufacturer-submitted; copyright status can vary; NLM notes users must determine restrictions and NLM cannot guarantee status citeturn7search23turn6search3 | Free | Great for “what the label says” and packaging art examples; safest to treat images as rights-managed unless clearly public domain citeturn7search23turn6search3 |
| entity["organization","Centers for Disease Control and Prevention","public health agency us"] PHIL | Public health photos, some clinical/public domain images | Many medium–high res | Many images public domain; some copyrighted—check per-image statement; credit requested citeturn1search5turn1search1 | Free | Very strong for public-health imagery; less targeted for OR step-by-step surgical series citeturn1search5 |
| Manufacturer sites (example pattern) | Official product photos, packaging shots, branding-consistent visuals | Often high-res press images (if provided) | Typically copyrighted; reuse often prohibited without written permission citeturn7search18 | Usually free to request; may be restricted | Most authoritative depiction of the exact commercial product; clearance time can be the bottleneck citeturn7search18 |
| entity["company","BioRender","scientific illustration software"] | Mechanism/cartoon biology, custom diagrams | Vector-like exports; publication-ready depending on plan | License depends on plan + use; publication rights often require appropriate subscription; figures must be cited per terms citeturn3search4turn3search31turn3search0 | Subscription | High design efficiency; ensure your plan covers intended distribution (esp. publication/marketing) citeturn3search4turn3search31 |
| entity["organization","Bioicons","open science icon library"] | Medical/science icons (SVG) | Scalable SVG | Mixed permissive licenses (CC0/CC BY/MIT); check per icon citeturn3search1turn3search21 | Free | Great for consistent infographics; requires license tracking at icon-level citeturn3search1 |

### Practical “item sheets” for your core asset set

Below is a reusable, presentation-oriented “minimum viable” asset set. Each item includes sources, technical specs, licensing/attribution guidance, caption examples, and metadata fields. Replace illustrated examples with your chosen drugs/procedures.

#### Drug photo item: tablet/capsule (dosage form)

**Source options (prioritized)**  
1) Manufacturer press kit / product page (best for true product photography, but permission typically required). citeturn7search18  
2) Your own photography (preferred when you can obtain a sample legally and photograph in a controlled studio setup; you own the copyright).  
3) Regulatory-labeling imagery (SPLIMAGE) as a fallback reference standard (often not “hero image” quality). citeturn5search14  

**Resolution & format recommendation**  
- Master: RAW/TIFF; Slide: PNG (if transparent background) or high-quality JPG.  
- Capture target: ≥3000 px on the long edge if you anticipate cropping; never upscale a small image as your primary asset. citeturn1search4turn1search12  

**Licensing/rights & attribution text**  
- Manufacturer: “Used with permission of [Company], [Year].” (Add any required trademark disclaimer if provided.) citeturn7search18  
- Self-photo: “Photo © [Presenter/Institution], [Year].”  
- SPLIMAGE/published labeling: treat as potentially rights-managed unless clearly public domain; NLM policies place responsibility on the user to determine restrictions. citeturn7search23turn6search3  

**Suggested caption**  
- “Oral solid dosage form (example): [Drug generic name], [strength], [release form].”

**Metadata**  
- Alt text: “Photo of [shape/color] [tablet/capsule] labeled as [drug], shown on neutral background.”  
- Keywords: drug name, generic, dosage form, strength, route, “tablet photo,” “capsule photo,” pharmacology topic.

#### Drug photo item: vial/ampoule/syringe and carton/label (packaging)

**Source options**  
- DailyMed package photos can contain carton art/label panels (helpful for showing labeling structure or device format). Example carton images are accessible for cefazolin packaging. citeturn13view0turn13view1turn11view2  
- Manufacturer press kit (best for clean product shots; permission usually required). citeturn7search18  

**Resolution & format recommendation**  
- For carton “principal display panel” artwork: aim for ≥2000 px width; prefer original artwork files if provided.  
- If you must use a screenshot (not recommended), capture at device-native resolution and avoid recompression.

**Licensing/attribution text**  
- DailyMed/NLM: determine rights for the specific image; store license notes with the asset. citeturn7search23turn6search3  
- Manufacturer: “Used with permission …” citeturn7search18  

**Suggested caption**  
- “Example package label/carton for [drug] [strength] (illustrative).”

**Metadata**  
- Alt text: “Package label layout for [drug], showing brand/generic name, strength, NDC, and warnings.”  
- Keywords: packaging, carton label, vial label, NDC, medication safety, labeling.

#### Drug diagram item: chemical structure / basic mechanism visual

**Source options**  
- Government/public domain graphics (where explicitly public domain) can be reused freely; the FDA publishes a general public-domain statement for its website content unless otherwise noted. citeturn7search0  
- Open-license medical art libraries (for conceptual mechanism graphics). citeturn0search8turn0search0  
- Journal figures (ensure license allows adaptation; avoid ND if you need to recolor/annotate). citeturn2search1turn12view1turn4search29  

**Resolution & format recommendation**  
- Vector preferred (SVG/PDF).  
- If raster: PNG, ≥2000 px width for slide zoom/crop.

**Licensing/attribution text**  
- CC BY assets: include Title/Author/Source/License (TASL) and indicate modifications if made. citeturn18search1turn2search8turn2search0  
- Servier Medical Art provides a ready-to-use attribution string. citeturn0search0  

**Suggested caption**  
- “Mechanism schematic for [drug/class]: [target → effect → clinical result].”

**Metadata**  
- Alt text: “Diagram showing [drug/class] acting on [target], leading to [physiologic effect].”  
- Keywords: mechanism of action, receptor/enzyme, pathway, pharmacodynamics.

#### Anatomy illustration item: region + key landmarks for surgery

**Source options**  
- Servier Medical Art (CC BY 4.0) for stylized anatomy and physiology elements. citeturn0search8turn0search0  
- OpenStax anatomy figures (CC BY with attribution). citeturn0search31turn0search15  
- BodyParts3D for custom views (CC BY with required attribution statement). citeturn4search0turn4search8  

**Resolution & format recommendation**  
- Prefer SVG/PDF; otherwise PNG ≥2500 px width if it will be a primary slide figure.

**Licensing/attribution text examples**  
- Servier (recommended): “Image(s) provided by Servier Medical Art (smart.servier.com), licensed under CC BY 4.0.” citeturn0search0  
- BodyParts3D (required statement): “BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.” citeturn4search0  

**Suggested caption**  
- “Relevant anatomy for [procedure]: key landmarks highlighted.”

**Metadata**  
- Alt text: “Anatomy diagram of [region], highlighting [landmarks].”  
- Keywords: anatomy, surgical landmarks, artery/vein/nerve, planes, approach.

#### Procedural step images: “how the operation is done” (non-patient illustrative pathway)

**Source options**  
- Open-access surgical technique papers that explicitly state CC licenses (often allow reuse; check ND/NC). Example: a laparoscopic appendectomy technique on PMC states CC BY-NC-ND 4.0 (reusable as-is, noncommercial; **not** adaptable). citeturn12view1  
- Open-access BMC Surgery articles can include high-res original figure files and specify a Creative Commons license on the article page. citeturn12view2turn2search2  

**Resolution & format recommendation**  
- Prefer original figure files (TIFF) when offered. citeturn12view2  
- If the figure is ND/NC and you can’t edit, design your slide layout around it (avoid cropping that changes meaning; keep it intact).

**Licensing/attribution text**  
- CC BY: “Reproduced/adapted from [Author], [Journal], [Year], licensed under CC BY 4.0.” citeturn2search1turn2search10  
- CC BY-NC-ND: “Reproduced from … under CC BY-NC-ND 4.0; no modifications made.” citeturn12view1turn4search29  

**Suggested caption**  
- “Key operative steps (illustrative): ports, dissection, division, extraction, closure.”

**Metadata**  
- Alt text: “Series of images showing procedural steps for [procedure], labeled Step 1–Step N.”  
- Keywords: surgical technique, laparoscopic ports, operative steps, intraoperative.

#### Infographics you author: indications/mechanism/dosing/contraindications/steps/risks/postop

**Source options**  
- Best practice is to **author the infographic layout** yourself and only import open-license icons/illustrations with tracked credits. citeturn3search1turn18search1  

**Resolution & format recommendation**  
- Master: vector (SVG/PDF).  
- Slide export: PNG at 2× target size (e.g., design at 3840×2160 then downscale to 1920×1080 for crispness). citeturn1search12turn1search4  

**Licensing/attribution text**  
- For CC icons: follow TASL when possible; at minimum include source + license and indicate changes if modified. citeturn18search1turn2search8turn2search0  
- For Bioicons: record the icon’s license (CC0 vs CC BY etc.) and apply required credits. citeturn3search1turn3search21  

**Suggested caption**  
- “Summary infographic: [topic]. Created by [Presenter/Institution], incorporating CC-licensed icons (see credits).”

**Metadata**  
- Alt text: short summary + structure, e.g., “Infographic summarizing indications, dosing, contraindications, and monitoring for [drug/class] in perioperative care.”  
- Keywords: infographic, patient education, clinician education, decision support, postoperative timeline.

### Rights and attribution “copy-paste” templates

**CC BY 4.0 image (generic TASL credit line)**  
Use when you reuse or adapt a CC BY 4.0 figure. citeturn18search1turn2search8turn2search0  
- “Title” by Author, Source (URL/DOI), licensed under CC BY 4.0. Changes: [list].  

**Servier Medical Art (recommended credit line)** citeturn0search0  
- “Image(s) provided by Servier Medical Art (smart.servier.com), licensed under CC BY 4.0.”

**FDA public domain credit (recommended even if not required)** citeturn7search0  
- “Source: U.S. Food and Drug Administration (public domain unless otherwise noted).”

**CDC PHIL credit (when photographer named)** citeturn1search1turn1search5  
- “Credit: CDC / [Photographer Name], via PHIL.”

**Publisher permission credit (example pattern)** citeturn9search0turn9search1  
- “Reproduced with permission of [Publisher], from: [Full citation]. License dated [date].”

### Minimal metadata schema for each visual asset (recommended)

Store this alongside the image file (e.g., in a DAM, spreadsheet, or JSON sidecar):

```json
{
  "asset_id": "DRUG_CEFAZOLIN_CARTON_001",
  "title": "Cefazolin carton label (example)",
  "source_name": "DailyMed",
  "source_url": "https://dailymed.nlm.nih.gov/...",
  "license_type": "unknown/verify",
  "license_url": null,
  "permission_status": "pending/cleared/not_required",
  "required_attribution": "TBD",
  "creation_date": "2026-03-25",
  "format_master": "PNG",
  "pixel_dimensions": "3000x1500",
  "color_space": "sRGB",
  "slide_crop_safe": true,
  "caption": "Example carton label for cefazolin for injection (illustrative).",
  "alt_text": "Package label layout for cefazolin injection showing strength and NDC.",
  "keywords": ["cefazolin", "antibiotic", "vial", "carton", "labeling", "perioperative prophylaxis"],
  "phi_risk": "none"
}
```

This aligns with the broader principle that **you—not the hosting platform—are responsible** for ensuring copyright/usage compliance when material is not clearly public domain or clearly open-licensed. citeturn7search23turn6search3turn18search13