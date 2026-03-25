# weightwAIse — Product Requirements Document

## 1. Product Overview

**weightwAIse** is a multimodal RAG-powered web application that serves as an AI bariatric and metabolic surgery consultant. It conducts structured patient intake via conversational chat (text + voice, English/Spanish), recommends treatment pathways grounded in clinical guidelines and PubMed literature, and produces comprehensive patient summary reports with inline source citations.

## 2. Problem Statement

Patients considering bariatric surgery face:
- Long wait times for initial consultations
- Lack of accessible, evidence-based information about their options
- Language barriers (English/Spanish populations)
- Difficulty understanding complex medical recommendations

Clinicians face:
- Repetitive intake interviews
- Keeping up with evolving guidelines and literature
- Ensuring consistent, guideline-adherent recommendations

## 3. Target Users

### 3.1 Patients
- Adults considering weight management or bariatric surgery
- English and Spanish speakers
- Varying levels of health literacy
- May have prior weight loss attempts, comorbidities, or previous surgeries

### 3.2 Administrators / Clinicians
- Bariatric surgeons and their clinical staff
- Manage the knowledge base (upload guidelines, configure PubMed queries)
- Review patient intake data and chat histories
- Configure clinic referral information

## 4. Core Features

### 4.1 Patient Chat Interface
- **Hybrid guided intake**: Conversational AI gathers structured medical history
- **Clinical consultation**: After intake, discusses treatment options grounded in RAG-retrieved evidence
- **Voice I/O**: Web Speech API for speech-to-text and text-to-speech (English + Spanish)
- **Inline citations**: Every medical claim linked to source guidelines or PubMed papers
- **Intake progress bar**: Visual indicator of data collection completeness
- **Bilingual**: Full English and Spanish support

### 4.2 Clinical Decision Engine
- **Decision tree**: Rule-based gates per ASMBS/IFSO guidelines (BMI thresholds, comorbidity modifiers, prior attempts, surgical fitness)
- **Pathways**: Lifestyle modification, pharmacotherapy, surgery candidate, surgery urgent, needs psych eval, contraindicated
- **Dual LLM routing**: Gemini 2.5 Flash (chat) + Gemini 3.1 Pro (clinical reasoning)

### 4.3 Multimodal RAG Knowledge Base
- **Document ingestion**: PDF, PowerPoint, video, text/markdown
- **Multimodal embeddings**: Gemini Embedding 2 — text AND images in the same vector space
- **Vector storage**: Pinecone (single index with metadata filters for source_type, modality, etc.)
- **PubMed pipeline**: Auto-fetch and embed papers via NCBI E-utilities
- **Retrieval**: Single-index multimodal search with metadata filtering and reranking

### 4.4 Admin Panel
- Knowledge base management (upload/delete documents, view stats)
- PubMed configuration (manage queries, trigger updates)
- Patient records (search/view patients, intake data, chat histories)
- Clinic settings (name, address, phone, hours, booking URL)
- System prompt editor

### 4.5 Patient Summary Reports
- Auto-generated after consultation
- In-app view + downloadable PDF
- Sections: demographics, medical history, clinical assessment, discussion, recommendation, clinic referral, sources, disclaimer

## 5. Technical Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Voice | Web Speech API |
| Backend | Python 3.11+, FastAPI, Uvicorn |
| LLM (chat) | Gemini 2.5 Flash |
| LLM (reasoning) | Gemini 3.1 Pro |
| Embeddings | Gemini Embedding 2 (multimodal) |
| Vector DB | Pinecone (single index, metadata filters) |
| Relational DB | SQLite (dev) / PostgreSQL (prod) |
| Document Processing | PyMuPDF, python-pptx, OpenCV, Tesseract |
| PubMed | NCBI E-utilities + PMC OA API |
| PDF Reports | ReportLab |
| Deployment | Vercel (frontend), Ubuntu server (backend) |

## 6. API Endpoints

### Auth
- `POST /api/auth/register` — Create user (admin/patient)
- `POST /api/auth/login` — JWT tokens
- `POST /api/auth/refresh` — Token refresh
- `GET /api/auth/me` — Current user

### Chat
- `POST /api/chat/sessions` — New session
- `POST /api/chat/sessions/{id}/messages` — Send message (SSE streaming)
- `GET /api/chat/sessions/{id}/messages` — History

### Admin
- `GET /api/admin/dashboard/stats`
- `POST /api/admin/knowledge-base/upload`
- `GET /api/admin/knowledge-base/sources`
- `DELETE /api/admin/knowledge-base/sources/{id}`
- `POST /api/admin/pubmed/update`
- `GET/PUT /api/admin/pubmed/queries`
- `GET /api/admin/patients` (paginated)
- `GET/PUT /api/admin/config/{key}`

### Reports
- `GET /api/reports/{session_id}` — JSON
- `GET /api/reports/{session_id}/pdf` — PDF download

## 7. Security
- JWT auth with bcrypt password hashing
- Role-based access (admin vs patient)
- CORS restricted to frontend domain
- Medical disclaimer on all AI content
- "This is not a substitute for professional medical advice"

## 8. Non-Functional Requirements
- Chat response latency < 3s
- RAG retrieval < 2s
- 10+ concurrent sessions
- Chrome primary (Web Speech API), Firefox/Safari partial support
