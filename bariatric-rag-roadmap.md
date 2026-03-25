# BariatricAI — Multimodal RAG Surgical Consultant

## Project Roadmap & Implementation Specification

> **Purpose**: This document is a complete implementation roadmap for Claude Code (or any agentic coding system). Each module is self-contained with clear inputs, outputs, dependencies, and acceptance criteria.

---

## 1. Architecture Overview

### 1.1 System Summary

A multimodal RAG-powered web application that acts as a bariatric and metabolic surgery consultant. The system:

1. Conducts structured patient intake via a hybrid guided-chat interface (text + voice, English/Spanish)
2. Uses a decision-tree + LLM hybrid to recommend lifestyle changes, pharmacotherapy (e.g., tirzepatide/semaglutide), or bariatric surgery
3. Grounds all medical reasoning in admin-uploaded surgical guidelines and auto-updated PubMed literature
4. Stores multimodal embeddings (text, images, tables, video frames) in ChromaDB using Google Gemini multimodal embedding
5. Uses dual Gemini models: Flash for conversational chat, Pro for complex clinical reasoning
6. Produces patient summary reports (in-app + downloadable PDF) with inline source citations
7. Directs patients to admin-configured clinic(s) when a visit is recommended

### 1.2 High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        VERCEL (Frontend)                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Next.js 14 + Tailwind CSS + TypeScript                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────────────┐  │  │
│  │  │ Patient  │ │  Admin   │ │   Chat    │ │   Voice    │  │  │
│  │  │  Auth    │ │  Panel   │ │ Interface │ │  (WebSpeech│  │  │
│  │  │  Login   │ │  Upload/ │ │ + Inline  │ │   API)     │  │  │
│  │  │         │ │  Manage  │ │ Citations │ │            │  │  │
│  │  └──────────┘ └──────────┘ └───────────┘ └────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTPS REST / WebSocket
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                  UBUNTU SERVER (Backend)                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              Python FastAPI Application                   │     │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐ │     │
│  │  │  Auth    │ │ Patient  │ │    RAG    │ │  PubMed   │ │     │
│  │  │ Module   │ │ Intake   │ │  Engine   │ │ Ingestion │ │     │
│  │  │ (JWT)    │ │ + History│ │ + Decision│ │ Pipeline  │ │     │
│  │  │         │ │ Manager  │ │   Tree    │ │           │ │     │
│  │  └──────────┘ └──────────┘ └───────────┘ └───────────┘ │     │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐ │     │
│  │  │ Document │ │ Gemini   │ │  Report   │ │  Admin    │ │     │
│  │  │ Ingest   │ │ LLM      │ │ Generator │ │  Config   │ │     │
│  │  │ Pipeline │ │ Service  │ │ (PDF)     │ │  Service  │ │     │
│  │  └──────────┘ └──────────┘ └───────────┘ └───────────┘ │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐     │
│  │ PostgreSQL  │  │  ChromaDB   │  │  File Storage        │     │
│  │ (patients,  │  │ (multimodal │  │  /data/guidelines/   │     │
│  │  sessions,  │  │  embeddings)│  │  /data/pubmed/       │     │
│  │  admin cfg) │  │             │  │  /data/uploads/      │     │
│  └─────────────┘  └─────────────┘  └──────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼ External APIs
              ┌────────────────────────┐
              │  Google Gemini API     │
              │  - embedding-001       │
              │  - gemini-2.0-flash    │
              │  - gemini-2.5-pro      │
              │                        │
              │  NCBI PubMed / PMC API │
              │  - E-utilities         │
              │  - PMC OA FTP          │
              └────────────────────────┘
```

### 1.3 Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS | Chat UI, admin panel, patient auth |
| Voice I/O | Web Speech API (SpeechRecognition + SpeechSynthesis) | Browser-based STT/TTS, English + Spanish |
| Backend API | Python 3.11+, FastAPI, Uvicorn | REST API, WebSocket for chat streaming |
| LLM (chat) | Gemini 2.0 Flash | Fast conversational responses |
| LLM (reasoning) | Gemini 2.5 Pro | Complex clinical decision-making |
| Embeddings | Gemini text-embedding-004 + multimodal embedding | Text + image embeddings |
| Vector DB | ChromaDB (persistent, local) | Multimodal embedding storage + retrieval |
| Relational DB | PostgreSQL 16 | Patient records, sessions, admin config |
| Document Processing | PyMuPDF, python-pptx, OpenCV, Tesseract | PDF/PPT/video/image ingestion |
| PubMed | NCBI E-utilities + PMC OA API | Literature search and full-text retrieval |
| PDF Reports | ReportLab or WeasyPrint | Patient summary PDF generation |
| Deployment | Ubuntu server (backend), Vercel (frontend) | Split deployment |

---

## 2. Module Breakdown

Each module below is an independent implementation unit. Build them in the order listed — each module's dependencies are explicitly stated.

---

### MODULE 1: Project Scaffolding & Infrastructure

**Priority**: 🔴 Critical — build first
**Dependencies**: None

#### 1A: Backend Scaffolding (FastAPI)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app, CORS, lifespan
│   ├── config.py                  # Settings via pydantic-settings
│   ├── database.py                # SQLAlchemy async engine + session
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── patient_intake.py
│   │   ├── chat_session.py
│   │   └── admin_config.py
│   ├── schemas/                   # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── patient.py
│   │   ├── chat.py
│   │   └── admin.py
│   ├── routers/                   # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── patient.py
│   │   ├── chat.py
│   │   ├── admin.py
│   │   └── reports.py
│   ├── services/                  # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── patient_service.py
│   │   ├── chat_service.py
│   │   ├── rag_service.py
│   │   ├── gemini_service.py
│   │   ├── decision_tree.py
│   │   ├── intake_extractor.py
│   │   ├── pubmed_service.py
│   │   ├── document_ingest.py
│   │   ├── report_service.py
│   │   └── admin_service.py
│   └── utils/
│       ├── __init__.py
│       ├── embeddings.py          # Gemini embedding helpers
│       ├── chunking.py            # Document chunking strategies
│       └── prompts.py             # All LLM prompt templates
├── alembic/                       # Database migrations
├── data/                          # Local file storage
│   ├── guidelines/
│   ├── pubmed/
│   └── chroma_db/
├── tests/
├── requirements.txt
├── alembic.ini
├── .env.example
└── Dockerfile (optional)
```

#### 1B: Frontend Scaffolding (Next.js)

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Landing / login
│   │   ├── chat/
│   │   │   └── page.tsx           # Main patient chat interface
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # Admin dashboard
│   │   │   ├── knowledge-base/
│   │   │   │   └── page.tsx       # Upload guidelines, view KB stats
│   │   │   ├── pubmed/
│   │   │   │   └── page.tsx       # Configure PubMed queries, trigger updates
│   │   │   ├── patients/
│   │   │   │   └── page.tsx       # View/search patient records
│   │   │   └── settings/
│   │   │       └── page.tsx       # Clinic info, system config
│   │   └── api/                   # Next.js BFF proxy routes (optional)
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── CitationPopover.tsx
│   │   │   ├── VoiceButton.tsx
│   │   │   └── IntakeProgress.tsx
│   │   ├── admin/
│   │   │   ├── FileUploader.tsx
│   │   │   ├── PubMedConfig.tsx
│   │   │   ├── PatientTable.tsx
│   │   │   └── KBStats.tsx
│   │   ├── ui/                    # Shared UI primitives
│   │   └── auth/
│   │       └── LoginForm.tsx
│   ├── lib/
│   │   ├── api.ts                 # Axios/fetch wrapper to FastAPI
│   │   ├── auth.ts                # JWT storage, refresh
│   │   ├── voice.ts               # Web Speech API wrapper
│   │   └── types.ts               # TypeScript interfaces
│   └── hooks/
│       ├── useChat.ts
│       ├── useVoice.ts
│       └── useAuth.ts
├── public/
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

#### 1C: Database Schema (PostgreSQL via Alembic)

```sql
-- Users table (admin + patient roles)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'patient')),
    full_name VARCHAR(255),
    language_preference VARCHAR(10) DEFAULT 'en', -- 'en' or 'es'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Structured patient intake data (uniform across all patients)
CREATE TABLE patient_intakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Demographics & Anthropometrics
    age INTEGER,
    sex VARCHAR(20),
    height_cm FLOAT,
    weight_kg FLOAT,
    bmi FLOAT,             -- computed: weight / (height/100)^2
    waist_circumference_cm FLOAT,
    
    -- Comorbidities (stored as JSONB for flexibility)
    comorbidities JSONB DEFAULT '{}',
    -- Example: {"t2dm": true, "htn": true, "osa": false, "gerd": true,
    --           "dyslipidemia": true, "pcos": false, "nafld": false,
    --           "depression": false, "other": ["hypothyroidism"]}
    
    -- Previous weight loss attempts
    previous_diets JSONB DEFAULT '[]',
    -- Example: [{"type": "keto", "duration_months": 6, "max_weight_loss_kg": 8, "regained": true}]
    previous_medications JSONB DEFAULT '[]',
    -- Example: [{"name": "semaglutide", "dose": "2.4mg", "duration_months": 12, "outcome": "lost 15kg"}]
    previous_surgeries JSONB DEFAULT '[]',
    -- Example: [{"type": "lap_band", "year": 2018, "outcome": "removed_2020", "complications": ["slippage"]}]
    
    -- Psychological / Eating Behavior
    binge_eating_screen BOOLEAN,
    emotional_eating BOOLEAN,
    eating_disorder_history TEXT,
    mental_health_conditions JSONB DEFAULT '[]',
    -- Example: ["depression", "anxiety"]
    current_psych_medications JSONB DEFAULT '[]',
    
    -- Family History
    family_obesity_history BOOLEAN,
    family_diabetes_history BOOLEAN,
    family_surgical_history TEXT,
    
    -- Social History
    smoking_status VARCHAR(50),       -- never, former, current
    alcohol_use VARCHAR(100),
    exercise_frequency VARCHAR(100),  -- sedentary, 1-2x/week, 3-5x/week, daily
    occupation VARCHAR(255),
    support_system TEXT,
    
    -- Surgical History (general)
    previous_abdominal_surgeries JSONB DEFAULT '[]',
    anesthesia_complications TEXT,
    
    -- Intake metadata
    intake_status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, complete
    intake_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    intake_id UUID REFERENCES patient_intakes(id),
    session_type VARCHAR(30) NOT NULL, -- 'intake', 'consultation', 'follow_up'
    status VARCHAR(20) DEFAULT 'active', -- active, completed, abandoned
    decision_path VARCHAR(50),  -- 'lifestyle', 'pharmacotherapy', 'surgery', NULL
    recommendation_summary TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- Individual chat messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,  -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]',
    -- Example: [{"source": "ASMBS 2022 Guidelines", "chunk_id": "abc123", "page": 14}]
    extracted_fields JSONB DEFAULT '{}',
    -- Fields extracted from this message for the intake form
    model_used VARCHAR(50),  -- 'flash' or 'pro'
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Admin configuration
CREATE TABLE admin_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- Seeded rows:
-- key='clinic_info', value={"name": "...", "address": "...", "phone": "...", "hours": "...", "booking_url": "..."}
-- key='pubmed_queries', value={"queries": ["bariatric surgery outcomes", "sleeve gastrectomy vs RYGB", ...], "max_results_per_query": 50}
-- key='system_prompts', value={"intake": "...", "consultation": "...", "surgery_discussion": "..."}

-- Knowledge base source tracking
CREATE TABLE kb_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(30) NOT NULL, -- 'guideline_pdf', 'guideline_pptx', 'guideline_video', 'guideline_text', 'pubmed'
    filename VARCHAR(500),
    title VARCHAR(500),
    pubmed_id VARCHAR(20),            -- PMID if from PubMed
    pmc_id VARCHAR(20),               -- PMC ID if full text
    authors TEXT,
    publication_date DATE,
    total_chunks INTEGER,
    ingested_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' -- active, archived, failed
);
```

#### Acceptance Criteria (Module 1):
- [ ] `uvicorn app.main:app` starts without errors
- [ ] `alembic upgrade head` creates all tables
- [ ] `npm run dev` starts Next.js frontend
- [ ] Frontend can reach backend via CORS-enabled API
- [ ] `.env.example` documents all required env vars (GEMINI_API_KEY, DATABASE_URL, JWT_SECRET, etc.)

---

### MODULE 2: Authentication System

**Priority**: 🔴 Critical
**Dependencies**: Module 1

#### Backend (FastAPI)
- `POST /api/auth/register` — create user (admin or patient)
- `POST /api/auth/login` — returns JWT access + refresh tokens
- `POST /api/auth/refresh` — refresh token rotation
- `GET /api/auth/me` — returns current user profile
- Password hashing: `bcrypt` via `passlib`
- JWT: `python-jose` with HS256, 15min access / 7d refresh
- Role-based middleware: `require_role("admin")` decorator

#### Frontend (Next.js)
- `/` — login page with username/password form
- Role-based routing: admin → `/admin`, patient → `/chat`
- JWT stored in httpOnly cookie (set by Next.js API route proxy) or localStorage for simplicity in research prototype
- `useAuth` hook: login, logout, token refresh, role check
- Language selector on login page (English / Spanish)

#### Acceptance Criteria (Module 2):
- [ ] Admin can register and login
- [ ] Patient can register and login
- [ ] Unauthorized requests return 401
- [ ] Admin routes reject patient tokens
- [ ] Language preference saved to user profile

---

### MODULE 3: Document Ingestion Pipeline (Multimodal Knowledge Base)

**Priority**: 🔴 Critical
**Dependencies**: Module 1

This is the core of the RAG system. It handles all four input formats and produces multimodal embeddings stored in ChromaDB.

#### 3A: Chunking & Embedding Strategy

```python
# Embedding models to use:
# - Text: "models/text-embedding-004" (768 dims) via Gemini API
# - Multimodal: "models/embedding-001" with task_type for images+text

# Chunking strategy per format:
# PDF:   semantic chunking by section headers, ~500-800 tokens per chunk
#        + extract figures/tables as separate image chunks
# PPTX:  one chunk per slide (text + slide image screenshot)
# Video: extract keyframes at 1fps, cluster similar frames,
#        keep representative frames as image chunks with timestamp metadata
# Text/MD: recursive character splitting, ~500-800 tokens, 100 token overlap
```

#### 3B: PDF Ingestion (`services/document_ingest.py`)

```
Input:  PDF file path
Steps:
  1. Extract text per page using PyMuPDF (fitz)
  2. Detect section headers (font size heuristics or regex)
  3. Split into semantic chunks (by section, capped at ~800 tokens)
  4. Extract embedded images + tables (render table regions as images)
  5. For each text chunk:
     - Call Gemini text-embedding-004 → 768-dim vector
     - Store in ChromaDB collection "guidelines_text"
     - Metadata: {source_id, page_num, section_title, source_type: "pdf"}
  6. For each image/table chunk:
     - Call Gemini multimodal embedding with image + caption
     - Store in ChromaDB collection "guidelines_multimodal"
     - Metadata: {source_id, page_num, image_type: "figure"|"table", caption}
  7. Record in kb_sources table
```

#### 3C: PowerPoint Ingestion

```
Input:  PPTX file path
Steps:
  1. Extract text from each slide using python-pptx
  2. Render each slide as an image (via LibreOffice headless convert to PDF → image)
  3. For each slide:
     - Text chunk → Gemini text embedding → ChromaDB "guidelines_text"
     - Slide image → Gemini multimodal embedding → ChromaDB "guidelines_multimodal"
     - Metadata: {source_id, slide_number, slide_title}
  4. Record in kb_sources table
```

#### 3D: Video Frame Ingestion

```
Input:  Video file path (MP4, AVI, etc.)
Steps:
  1. Extract frames at 1 FPS using OpenCV
  2. Compute perceptual hash (pHash) for each frame
  3. Cluster similar frames (hamming distance < threshold)
  4. Keep cluster centroids as representative frames
  5. Optionally run OCR (Tesseract) on frames with text overlays
  6. For each representative frame:
     - Gemini multimodal embedding → ChromaDB "guidelines_multimodal"
     - Metadata: {source_id, timestamp_sec, ocr_text, frame_index}
  7. Record in kb_sources table
```

#### 3E: Plain Text / Markdown Ingestion

```
Input:  .txt or .md file path
Steps:
  1. Read file content
  2. Split by headers (markdown) or recursive character split
  3. Each chunk → Gemini text embedding → ChromaDB "guidelines_text"
  4. Metadata: {source_id, section_title, chunk_index}
  5. Record in kb_sources table
```

#### 3F: ChromaDB Collection Schema

```python
# Two collections for separation of modalities:

# Collection 1: "guidelines_text"
# - id: unique chunk ID (uuid)
# - embedding: 768-dim float vector (text-embedding-004)
# - document: raw text content of the chunk
# - metadata: {source_id, source_type, page_num, section_title, chunk_index, ingested_at}

# Collection 2: "guidelines_multimodal"
# - id: unique chunk ID (uuid)
# - embedding: multimodal embedding vector
# - document: caption or OCR text (for search fallback)
# - metadata: {source_id, source_type, page_num, slide_number, timestamp_sec,
#              image_type, image_path (local path to stored image), ingested_at}

# Collection 3: "pubmed_text"
# - Same schema as guidelines_text but source_type="pubmed"
# - Additional metadata: {pmid, pmc_id, title, authors, pub_date, journal}
```

#### Acceptance Criteria (Module 3):
- [ ] PDF with figures → text chunks + image chunks in ChromaDB
- [ ] PPTX → per-slide text + image embeddings
- [ ] Video → representative frame embeddings with timestamps
- [ ] Markdown/text files → text chunks with section metadata
- [ ] All sources tracked in `kb_sources` table
- [ ] ChromaDB persisted to `data/chroma_db/` (survives restart)
- [ ] Duplicate detection: re-uploading same file skips or replaces

---

### MODULE 4: PubMed Ingestion Pipeline

**Priority**: 🟡 High
**Dependencies**: Module 1, Module 3 (shares embedding logic)

#### 4A: PubMed Search & Fetch

```python
# Service: pubmed_service.py
# Uses NCBI E-utilities: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/

# Step 1: Search PubMed using admin-configured queries
#   POST esearch.fcgi?db=pubmed&term={query}&retmax={max}&sort=date
#   → returns list of PMIDs

# Step 2: Fetch abstracts for all PMIDs
#   POST efetch.fcgi?db=pubmed&id={pmid_list}&rettype=xml
#   → parse XML for title, abstract, authors, journal, date

# Step 3: Check PMC Open Access for full text
#   GET https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi?id=PMC{id}
#   → if available, download full text XML or PDF

# Step 4: For full-text papers:
#   - Parse sections (intro, methods, results, discussion)
#   - Chunk each section (~500-800 tokens)
#   - Extract figures/tables if PDF
#   For abstract-only papers:
#   - Treat entire abstract as one chunk

# Step 5: Embed and store in ChromaDB "pubmed_text" collection
# Step 6: Record in kb_sources table with PMID, PMC ID
```

#### 4B: Admin-Triggered Update Flow

```
API: POST /api/admin/pubmed/update
Auth: admin only
Body: (optional) { "queries": ["override query list"] }

Flow:
  1. Read PubMed queries from admin_config table (or request body override)
  2. For each query:
     a. Search PubMed, get PMIDs
     b. Filter out already-ingested PMIDs (check kb_sources.pubmed_id)
     c. Fetch & parse new papers
     d. Chunk, embed, store in ChromaDB
     e. Record in kb_sources
  3. Return summary: {new_papers: N, total_chunks: M, errors: [...]}
```

#### 4C: Rate Limiting & Error Handling
- NCBI allows 3 requests/sec without API key, 10/sec with
- Store NCBI API key in `.env` (free registration at NCBI)
- Implement exponential backoff on 429 responses
- Log all failed fetches for admin review

#### Acceptance Criteria (Module 4):
- [ ] Admin can configure PubMed search queries via API/panel
- [ ] `POST /api/admin/pubmed/update` fetches, deduplicates, chunks, embeds new papers
- [ ] Full-text papers from PMC OA are sectionally chunked
- [ ] Abstract-only papers stored as single chunks
- [ ] Already-ingested papers are skipped (by PMID)
- [ ] Rate limiting respects NCBI guidelines

---

### MODULE 5: RAG Retrieval Engine

**Priority**: 🔴 Critical
**Dependencies**: Module 3

#### 5A: Query Pipeline (`services/rag_service.py`)

```python
async def retrieve(query: str, top_k: int = 10, filters: dict = None) -> list[RetrievedChunk]:
    """
    Multi-collection retrieval with reranking.
    
    Steps:
    1. Embed the query using Gemini text-embedding-004
    2. Search ChromaDB collections in parallel:
       - "guidelines_text"   → top_k text chunks
       - "guidelines_multimodal" → top_k multimodal chunks
       - "pubmed_text"       → top_k pubmed chunks
    3. Merge results, deduplicate by source
    4. Rerank using Gemini Flash (lightweight relevance scoring)
    5. Return top_k chunks with metadata + relevance scores
    """

class RetrievedChunk:
    chunk_id: str
    content: str          # text content
    image_path: str|None  # path to image if multimodal
    source_title: str
    source_type: str      # "pdf", "pptx", "video", "pubmed"
    metadata: dict        # page_num, pmid, section, etc.
    relevance_score: float
```

#### 5B: Citation Formatting

Each retrieved chunk used in a response gets a citation object:

```python
class Citation:
    source_title: str
    source_type: str
    page_or_section: str
    pubmed_id: str | None
    chunk_id: str

# Returned in chat_messages.citations JSONB field
# Frontend renders as inline superscript numbers with hover popover
```

#### Acceptance Criteria (Module 5):
- [ ] Query returns relevant chunks from all three collections
- [ ] Results are ranked by relevance
- [ ] Citations include enough metadata for frontend rendering
- [ ] Retrieval latency < 2s for typical queries

---

### MODULE 6: Gemini LLM Service (Dual Model)

**Priority**: 🔴 Critical
**Dependencies**: Module 5

#### 6A: Service Design (`services/gemini_service.py`)

```python
import google.generativeai as genai

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.flash = genai.GenerativeModel("gemini-2.0-flash")
        self.pro = genai.GenerativeModel("gemini-2.5-pro")
    
    async def chat_response(self, messages: list, context_chunks: list[RetrievedChunk],
                            patient_intake: dict, use_pro: bool = False) -> str:
        """
        Build prompt with:
        1. System prompt (role: bariatric surgery consultant)
        2. Retrieved context chunks (with source attribution instructions)
        3. Patient intake data (structured)
        4. Conversation history
        5. Current user message
        
        use_pro=True when:
        - Decision tree reaches a clinical recommendation point
        - Patient asks complex comparative questions (surgery types, risk/benefit)
        - Generating final recommendation summary
        """
        model = self.pro if use_pro else self.flash
        # ... build prompt, call model, parse response with citations
```

#### 6B: Model Routing Logic

```python
# Automatic model selection rules:
USE_PRO_TRIGGERS = [
    "decision_point",           # Decision tree reached a recommendation
    "surgery_comparison",       # Comparing surgical procedures
    "risk_assessment",          # Evaluating patient-specific risks
    "contraindication_check",   # Checking surgical contraindications
    "final_recommendation",     # Generating session summary
    "complex_medical_question", # Detected by Flash as needing escalation
]

# Flash handles:
# - Intake questions (guided conversation)
# - Simple factual Q&A
# - Lifestyle/diet discussion
# - General pros/cons overview
# - Conversation flow management
```

#### 6C: System Prompts (stored in `utils/prompts.py`)

```python
INTAKE_SYSTEM_PROMPT = """
You are an expert bariatric and metabolic surgeon conducting a patient intake interview.
Your role is to gather a comprehensive medical history through natural, empathetic conversation.

REQUIRED FIELDS TO COLLECT (extract from patient responses):
- Demographics: age, sex, height, weight
- Comorbidities: T2DM, HTN, OSA, GERD, dyslipidemia, PCOS, NAFLD, depression, others
- Previous weight loss: diets tried, medications (esp. GLP-1 agonists), duration, outcomes
- Psychological: binge eating, emotional eating, eating disorder history, mental health
- Family history: obesity, diabetes, surgical history
- Social: smoking, alcohol, exercise, occupation, support system
- Surgical history: previous abdominal surgeries, anesthesia complications

CONVERSATION RULES:
1. Ask ONE question at a time. Never overwhelm with multiple questions.
2. Use empathetic, non-judgmental language.
3. If the patient mentions a comorbidity, ask relevant follow-up questions.
4. After each response, extract structured data and note what's still missing.
5. Transition naturally between topics.
6. When all fields are collected, summarize and confirm with the patient.
7. Respond in the patient's preferred language ({language}).

OUTPUT FORMAT:
Always return JSON with:
{
  "response_text": "Your conversational message to the patient",
  "extracted_fields": {"field_name": value, ...},  // Only newly extracted fields
  "missing_fields": ["field1", "field2", ...],     // Still needs to be collected
  "intake_complete": false                          // true when all essential fields collected
}
"""

CONSULTATION_SYSTEM_PROMPT = """
You are an expert bariatric and metabolic surgery consultant. Based on the patient's 
complete medical history and clinical guidelines, help them understand their options.

DECISION FRAMEWORK:
You must follow the clinical decision tree (provided separately) to determine the 
appropriate recommendation pathway:
- Lifestyle modification
- Pharmacotherapy (GLP-1 agonists: semaglutide, tirzepatide)
- Bariatric surgery (sleeve gastrectomy, RYGB, OAGB, duodenal switch, etc.)

RULES:
1. Always ground your statements in the provided guidelines and literature.
2. Cite sources inline using [Source: title, page/section].
3. Present pros AND cons for every option discussed.
4. Never make a definitive medical decision — present options and recommend clinic visit.
5. Be sensitive to psychological aspects of obesity.
6. For surgery candidates: discuss procedure options, expected outcomes, risks, 
   lifestyle changes required, and recovery timeline.
7. Respond in the patient's preferred language ({language}).
8. When appropriate, recommend scheduling a clinic visit.
"""
```

#### Acceptance Criteria (Module 6):
- [ ] Flash handles intake and simple chat
- [ ] Pro activates for clinical decision points
- [ ] System prompts produce structured JSON output for intake
- [ ] Citations are properly attributed in responses
- [ ] Language switching works (English / Spanish)
- [ ] Conversation history maintained across messages

---

### MODULE 7: Clinical Decision Tree

**Priority**: 🔴 Critical
**Dependencies**: Module 6

#### 7A: Decision Tree Logic (`services/decision_tree.py`)

```python
from enum import Enum

class RecommendationPath(Enum):
    LIFESTYLE = "lifestyle"
    PHARMACOTHERAPY = "pharmacotherapy"
    SURGERY_CANDIDATE = "surgery_candidate"
    SURGERY_URGENT = "surgery_urgent"
    NEEDS_PSYCH_EVAL = "needs_psych_eval"
    CONTRAINDICATED = "contraindicated"

def evaluate_patient(intake: PatientIntake) -> DecisionResult:
    """
    Based on ASMBS/IFSO guidelines:
    
    GATE 1 — BMI Thresholds:
      BMI < 30:                → LIFESTYLE (with pharmacotherapy discussion if BMI 27-30 + comorbidities)
      BMI 30-34.9:             → PHARMACOTHERAPY primary, SURGERY if T2DM + failed meds
      BMI 35-39.9:             → SURGERY_CANDIDATE (especially with comorbidities)
      BMI ≥ 40:                → SURGERY_CANDIDATE (strong recommendation)
      BMI ≥ 50:                → SURGERY_URGENT (super-obese, higher risk)
    
    GATE 2 — Comorbidity Modifiers:
      T2DM + BMI 30-35:        → Elevate to SURGERY_CANDIDATE (metabolic surgery indication)
      Uncontrolled HTN/OSA:    → Strengthen surgery recommendation
      Active eating disorder:  → NEEDS_PSYCH_EVAL before surgery
      Active substance abuse:  → NEEDS_PSYCH_EVAL / CONTRAINDICATED
    
    GATE 3 — Prior Attempts:
      No prior lifestyle attempts:    → Must attempt lifestyle first (unless BMI ≥ 50)
      Failed medications (GLP-1):     → Strengthens surgery candidacy
      Failed prior bariatric surgery: → Revisional surgery discussion
    
    GATE 4 — Surgical Fitness:
      Age considerations (< 18 or > 70): → Special protocols
      Anesthesia contraindications:       → CONTRAINDICATED for surgery
      Psychological readiness:            → NEEDS_PSYCH_EVAL
    """
    # Returns DecisionResult with:
    #   path: RecommendationPath
    #   reasoning: str (explains which gates triggered)
    #   confidence: float
    #   surgery_types_to_discuss: list[str]  (if surgery path)
    #   flags: list[str]  (warnings, special considerations)
```

#### 7B: Surgery Type Discussion Framework

When the decision tree leads to surgery, the LLM discusses these procedures with RAG-grounded information:

```python
SURGERY_TYPES = {
    "sleeve_gastrectomy": {
        "full_name": "Laparoscopic Sleeve Gastrectomy (LSG)",
        "discussion_points": [
            "mechanism_of_action", "expected_weight_loss", "comorbidity_resolution",
            "surgical_risks", "nutritional_deficiencies", "lifestyle_changes",
            "recovery_timeline", "long_term_outcomes", "revision_options"
        ]
    },
    "rygb": {
        "full_name": "Roux-en-Y Gastric Bypass (RYGB)",
        "discussion_points": [...]
    },
    "oagb": {
        "full_name": "One Anastomosis Gastric Bypass (OAGB/MGB)",
        "discussion_points": [...]
    },
    "duodenal_switch": {
        "full_name": "Biliopancreatic Diversion with Duodenal Switch (BPD/DS)",
        "discussion_points": [...]
    },
    "sadi_s": {
        "full_name": "Single Anastomosis Duodeno-Ileal Bypass (SADI-S)",
        "discussion_points": [...]
    },
    "gastric_band": {
        "full_name": "Laparoscopic Adjustable Gastric Band (LAGB)",
        "discussion_points": [...]
    },
    "endoscopic": {
        "full_name": "Endoscopic Bariatric Procedures (ESG, IGB)",
        "discussion_points": [...]
    }
}
```

#### Acceptance Criteria (Module 7):
- [ ] Decision tree correctly classifies sample patient profiles
- [ ] BMI + comorbidity gates work per ASMBS guidelines
- [ ] Prior attempt history influences recommendations
- [ ] Psychological flags trigger appropriate pathway
- [ ] Surgery type discussion framework integrated with RAG retrieval

---

### MODULE 8: Patient Chat Interface (Hybrid Intake + Consultation)

**Priority**: 🔴 Critical
**Dependencies**: Modules 2, 5, 6, 7

#### 8A: Chat Flow State Machine

```
┌───────────┐    Intake      ┌───────────────┐   All fields   ┌──────────────┐
│   LOGIN   │───complete────▶│  INTAKE CHAT  │──collected───▶│   DECISION   │
│           │    session     │ (guided Q&A)  │   + confirmed │    TREE      │
└───────────┘    starts      └───────────────┘               └──────┬───────┘
                                                                     │
                    ┌────────────────────────────────────────────────┤
                    │                    │                           │
                    ▼                    ▼                           ▼
           ┌──────────────┐   ┌──────────────────┐   ┌───────────────────┐
           │  LIFESTYLE   │   │ PHARMACOTHERAPY  │   │ SURGERY CONSULT  │
           │  Discussion  │   │   Discussion     │   │  (Pro model)     │
           │  (Flash)     │   │   (Flash/Pro)    │   │  Pros/cons/types │
           └──────┬───────┘   └────────┬─────────┘   └────────┬──────────┘
                  │                    │                        │
                  └────────────────────┴────────────────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ SESSION SUMMARY  │
                              │ + PDF Report     │
                              │ + Clinic Referral│
                              └──────────────────┘
```

#### 8B: WebSocket Chat Endpoint

```python
# POST /api/chat/message (REST, simpler) or WebSocket /api/chat/ws/{session_id}
# 
# For MVP: REST with streaming response (SSE)
# 
# Request:
# {
#   "session_id": "uuid",
#   "content": "patient message text",
#   "language": "en"
# }
#
# Response (streamed):
# {
#   "content": "assistant response text",
#   "citations": [...],
#   "extracted_fields": {...},   // if intake phase
#   "intake_progress": 0.75,    // % of required fields collected
#   "phase": "intake" | "decision" | "consultation" | "summary",
#   "model_used": "flash" | "pro"
# }
```

#### 8C: Frontend Chat Component

```
ChatWindow.tsx:
├── Header: patient name, session phase indicator, language toggle
├── Messages area:
│   ├── MessageBubble (user): text + voice indicator
│   ├── MessageBubble (assistant): text + inline citations [1][2]
│   │   └── CitationPopover: on click, shows source details
│   └── IntakeProgress: progress bar showing fields collected
├── Input area:
│   ├── Text input with send button
│   ├── VoiceButton: hold-to-talk or toggle, visual feedback
│   └── Language toggle (EN/ES)
└── Sidebar (collapsible):
    ├── Intake summary (fields collected so far)
    └── Session info
```

#### 8D: Voice Integration

```typescript
// lib/voice.ts — Web Speech API wrapper

export class VoiceService {
  private recognition: SpeechRecognition;
  private synthesis: SpeechSynthesis;
  
  constructor(language: 'en-US' | 'es-ES') {
    this.recognition = new webkitSpeechRecognition();
    this.recognition.lang = language;
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.synthesis = window.speechSynthesis;
  }
  
  startListening(onResult: (text: string) => void, onInterim: (text: string) => void): void
  stopListening(): void
  speak(text: string, language: 'en-US' | 'es-ES'): Promise<void>
  // Strip citations/markdown before speaking
  // Select appropriate voice for language
}
```

#### Acceptance Criteria (Module 8):
- [ ] Patient can complete full intake via guided chat
- [ ] Intake progress bar updates as fields are extracted
- [ ] Decision tree fires after intake completion
- [ ] Consultation phase uses RAG-grounded responses
- [ ] Voice input transcribes and sends as text message
- [ ] Voice output reads assistant responses aloud
- [ ] Language switching works mid-conversation
- [ ] Citations render as clickable inline references

---

### MODULE 9: Admin Panel

**Priority**: 🟡 High
**Dependencies**: Modules 2, 3, 4

#### 9A: Admin Dashboard Pages

**`/admin` — Dashboard Overview**
- Total patients, active sessions, KB stats summary
- Recent PubMed updates

**`/admin/knowledge-base` — Knowledge Base Management**
- File upload zone (drag & drop): PDF, PPTX, video, text/md
- Upload triggers backend ingestion pipeline
- Table of all ingested sources: filename, type, chunks count, date, status
- Delete/archive source (removes from ChromaDB too)
- KB stats: total chunks, collection sizes, storage used

**`/admin/pubmed` — PubMed Configuration**
- Editable list of search queries
- "Update Now" button → triggers `POST /api/admin/pubmed/update`
- Progress indicator during update
- Log of past updates: date, papers found, papers ingested, errors
- Table of ingested PubMed papers: title, PMID, journal, date, chunks

**`/admin/patients` — Patient Records**
- Searchable, sortable table of all patients
- Click patient → view their intake data (structured fields)
- View chat session history for each patient
- Export patient data as JSON
- View/download patient summary PDF

**`/admin/settings` — System Configuration**
- Clinic information form: name, address, phone, hours, booking URL
- System prompt editor (intake, consultation, surgery discussion)
- Manage admin accounts

#### 9B: Admin API Endpoints

```
GET    /api/admin/dashboard/stats
POST   /api/admin/knowledge-base/upload     (multipart file upload)
GET    /api/admin/knowledge-base/sources     (list all sources)
DELETE /api/admin/knowledge-base/sources/{id}
GET    /api/admin/knowledge-base/stats
POST   /api/admin/pubmed/update
GET    /api/admin/pubmed/queries
PUT    /api/admin/pubmed/queries
GET    /api/admin/pubmed/history
GET    /api/admin/patients                   (paginated, searchable)
GET    /api/admin/patients/{id}
GET    /api/admin/patients/{id}/sessions
GET    /api/admin/patients/{id}/sessions/{sid}/messages
GET    /api/admin/patients/{id}/report/pdf
GET    /api/admin/config/{key}
PUT    /api/admin/config/{key}
```

#### Acceptance Criteria (Module 9):
- [ ] Admin can upload PDF/PPTX/video/text → ingestion pipeline runs
- [ ] Admin can configure PubMed queries and trigger updates
- [ ] Admin can view all patient records and chat histories
- [ ] Admin can edit clinic information
- [ ] KB stats accurately reflect ChromaDB contents
- [ ] File upload shows progress and completion status

---

### MODULE 10: Patient Summary Report Generation

**Priority**: 🟡 High
**Dependencies**: Modules 6, 7, 8

#### 10A: Report Contents

```
Patient Summary Report
══════════════════════

1. Patient Demographics
   - Name, age, sex, BMI, weight, height

2. Medical History Summary
   - Comorbidities (table format)
   - Previous weight loss attempts
   - Medications
   - Surgical history
   - Psychological screening results
   - Family & social history

3. Clinical Assessment
   - Decision tree pathway (lifestyle / pharmacotherapy / surgery)
   - Key factors influencing recommendation
   - BMI classification and risk stratification

4. Discussion Summary
   - Options discussed with patient
   - Patient questions and concerns addressed
   - Pros and cons presented

5. Recommendation
   - Primary recommendation with rationale
   - Alternative options noted
   - Next steps

6. Clinic Referral (if applicable)
   - Clinic name, address, phone
   - Recommended appointment type
   - What to bring to appointment

7. Sources Cited
   - List of all guidelines and papers cited in consultation

8. Disclaimer
   - "This is an AI-generated consultation summary for informational purposes..."
```

#### 10B: Implementation

- **In-app view**: Rendered as a styled React component at `/chat/summary/{session_id}`
- **PDF download**: Generated server-side via ReportLab or WeasyPrint
- **API**: `GET /api/reports/{session_id}` (JSON) and `GET /api/reports/{session_id}/pdf`
- **Clinic referral**: Pulled from `admin_config` table, key='clinic_info'

#### Acceptance Criteria (Module 10):
- [ ] Summary generated automatically when session ends
- [ ] In-app summary view renders all sections
- [ ] PDF downloads correctly with formatting
- [ ] Clinic referral info pulled from admin-configured settings
- [ ] All cited sources listed with proper attribution

---

## 3. Implementation Order & Sprint Plan

### Sprint 1 (Week 1-2): Foundation
- [ ] Module 1: Project scaffolding (backend + frontend + DB)
- [ ] Module 2: Authentication system

### Sprint 2 (Week 3-4): Knowledge Base Core
- [ ] Module 3: Document ingestion pipeline (all 4 formats)
- [ ] Module 5: RAG retrieval engine

### Sprint 3 (Week 5-6): Intelligence Layer
- [ ] Module 6: Gemini LLM service (dual model)
- [ ] Module 7: Clinical decision tree

### Sprint 4 (Week 7-8): Patient Experience
- [ ] Module 8: Patient chat interface (intake + consultation + voice)

### Sprint 5 (Week 9-10): Administration & Reports
- [ ] Module 4: PubMed ingestion pipeline
- [ ] Module 9: Admin panel
- [ ] Module 10: Report generation

### Sprint 6 (Week 11-12): Polish & Deploy
- [ ] End-to-end testing with sample patient scenarios
- [ ] Spanish language testing
- [ ] Voice I/O testing across browsers
- [ ] Vercel deployment for frontend
- [ ] Backend deployment with PM2 on Ubuntu
- [ ] Load testing with concurrent sessions

---

## 4. Environment Variables

```env
# .env.example

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# PostgreSQL
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/bariatric_ai

# ChromaDB
CHROMA_PERSIST_DIR=./data/chroma_db

# Auth
JWT_SECRET=your_jwt_secret_here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# NCBI/PubMed
NCBI_API_KEY=your_ncbi_api_key
NCBI_EMAIL=your_email@example.com

# File Storage
UPLOAD_DIR=./data/guidelines
PUBMED_DIR=./data/pubmed

# Frontend URL (for CORS)
FRONTEND_URL=https://your-app.vercel.app

# App Settings
DEFAULT_LANGUAGE=en
MAX_UPLOAD_SIZE_MB=500
```

---

## 5. Key Python Dependencies

```txt
# requirements.txt
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
sqlalchemy[asyncio]>=2.0
asyncpg>=0.29.0
alembic>=1.13.0
pydantic-settings>=2.1.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6

# Gemini
google-generativeai>=0.8.0

# RAG & Embeddings
chromadb>=0.4.22

# Document Processing
PyMuPDF>=1.23.0        # PDF text + image extraction
python-pptx>=0.6.23    # PowerPoint parsing
opencv-python>=4.9.0   # Video frame extraction
Pillow>=10.0.0         # Image processing
pytesseract>=0.3.10    # OCR for video frames

# PubMed
biopython>=1.83        # NCBI E-utilities wrapper

# PDF Report Generation
reportlab>=4.0.0       # or weasyprint

# Utilities
httpx>=0.26.0          # Async HTTP client
pydantic>=2.5.0
python-dotenv>=1.0.0
```

---

## 6. Key Frontend Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0",
    "axios": "^1.6.0",
    "react-markdown": "^9.0.0",
    "react-dropzone": "^14.2.0",
    "zustand": "^4.4.0",
    "lucide-react": "^0.300.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

---

## 7. Critical Design Decisions & Rationale

1. **Dual Gemini models (Flash + Pro)**: Flash handles 80%+ of interactions at lower cost/latency. Pro only activates at clinical decision points where reasoning quality matters most.

2. **Hybrid intake (guided chat + structured extraction)**: More natural than a form, but every response is parsed for structured fields. Ensures uniform data across patients while feeling conversational.

3. **Separate ChromaDB collections**: Text and multimodal embeddings have different dimensionalities and query patterns. Separate collections allow independent optimization.

4. **Decision tree gates BEFORE LLM reasoning**: Clinical safety — the tree enforces evidence-based thresholds (BMI, comorbidities) so the LLM can't hallucinate inappropriate recommendations.

5. **Admin-configurable PubMed queries**: Lets the clinical team focus the literature on relevant topics without code changes. Deduplication prevents re-ingesting known papers.

6. **Web Speech API for voice**: Zero cost, no external dependencies, works in Chrome (primary target for research demo). Limitation: accuracy varies by accent — acceptable for prototype.

7. **FastAPI + Next.js split**: Python backend is natural for ML/RAG/ChromaDB ecosystem. Next.js on Vercel gives free hosting with good DX. They communicate via REST API.

---

## 8. Testing Strategy

### Unit Tests
- Decision tree classification with known patient profiles
- Intake field extraction from sample conversations
- PubMed query parsing and deduplication
- Embedding + retrieval round-trip in ChromaDB

### Integration Tests
- Full intake conversation → structured data stored in Postgres
- Document upload → chunks in ChromaDB → retrievable by query
- PubMed update → new papers ingested → retrievable
- Chat session → decision tree → recommendation with citations

### Sample Patient Scenarios

```python
TEST_PATIENTS = [
    {
        "name": "Case 1: Clear surgery candidate",
        "bmi": 45, "age": 38, "sex": "F",
        "comorbidities": {"t2dm": True, "htn": True, "osa": True},
        "previous_attempts": ["keto", "WW", "semaglutide_failed"],
        "expected_path": "surgery_candidate"
    },
    {
        "name": "Case 2: Lifestyle first",
        "bmi": 31, "age": 28, "sex": "M",
        "comorbidities": {},
        "previous_attempts": [],
        "expected_path": "lifestyle"
    },
    {
        "name": "Case 3: Pharmacotherapy candidate",
        "bmi": 33, "age": 45, "sex": "F",
        "comorbidities": {"t2dm": True, "dyslipidemia": True},
        "previous_attempts": ["calorie_restriction"],
        "expected_path": "pharmacotherapy"
    },
    {
        "name": "Case 4: Needs psych eval",
        "bmi": 42, "age": 32, "sex": "F",
        "comorbidities": {"depression": True},
        "previous_attempts": ["multiple_diets"],
        "psych_flags": {"binge_eating": True, "active_ed": True},
        "expected_path": "needs_psych_eval"
    },
    {
        "name": "Case 5: Spanish-speaking patient",
        "language": "es",
        "bmi": 48, "age": 52, "sex": "M",
        "comorbidities": {"t2dm": True, "htn": True, "nafld": True},
        "expected_path": "surgery_candidate"
    }
]
```

---

*End of Roadmap — ready for Claude Code implementation*
