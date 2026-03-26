# weightwAIse

<p align="center">
  <img src="logo.png" alt="WeightwAIse Logo" width="250" />
</p>

AI-powered metabolic and bariatric surgery consultant using multimodal RAG.

## Overview

WeightwAIse is a web application that acts as a virtual metabolic and bariatric surgery consultant. It conducts structured patient intake via conversational chat (text + voice), recommends evidence-based treatment pathways grounded in clinical guidelines and PubMed literature, and refers patients to configured clinics.

## Features

- **Conversational Patient Intake** — Guided chat collects structured medical history naturally, one question at a time
- **Clinical Decision Engine** — Rule-based decision tree per ASMBS/IFSO guidelines (BMI thresholds, comorbidities, prior attempts, surgical fitness)
- **Dual LLM Architecture** — Gemini 2.5 Flash (chat, low temp) + Gemini 3.1 Pro (clinical reasoning, very low temp)
- **Multimodal RAG** — PDF, PowerPoint, video, text ingested with Gemini Embedding 2 (text + images in same vector space)
- **Pinecone Vector DB** — Single index with metadata filters for unified multimodal retrieval
- **PubMed Integration** — Auto-fetch and embed bariatric surgery literature via NCBI E-utilities
- **Voice I/O** — Speech-to-text and text-to-speech (English + Spanish) via Web Speech API
- **Inline Citations** — Every clinical claim cited from guidelines and literature
- **Clinic Referrals** — Configurable clinic info, AI directs patients to visit the clinic
- **Admin Panel** — Manage knowledge base, PubMed queries, patient records, clinic settings
- **Patient Reports** — Auto-generated summaries with PDF download
- **Bilingual** — Full English and Spanish support
- **shadcn/ui** — Minimal, modern UI inspired by Apple and ChatGPT

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python 3.11+, FastAPI, Uvicorn |
| LLM (chat) | Gemini 2.5 Flash (temp 0.3) |
| LLM (reasoning) | Gemini 3.1 Pro (temp 0.2) |
| Embeddings | Gemini Embedding 2 Preview (multimodal, 3072 dims) |
| Vector DB | Pinecone (single index, metadata filters) |
| Database | SQLite with WAL mode (dev) / PostgreSQL (prod) |
| Voice | Web Speech API |
| Process Manager | PM2 |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Gemini API key
- Pinecone API key
- PM2 (`npm install -g pm2`)

### Setup

```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys

# Frontend
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:8003
```

### Run with PM2

```bash
# From project root
pm2 start ecosystem.config.js
pm2 status
```

- Backend: http://localhost:8003
- Frontend: http://localhost:3002

### Create Admin Account

```bash
curl -X POST http://localhost:8003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123", "role": "admin", "full_name": "Admin"}'
```

### Upload Guidelines

Upload PDFs (e.g., surgical textbooks) via the admin panel at `/admin/knowledge-base`, or directly:

```bash
TOKEN=$(curl -s -X POST http://localhost:8003/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | python3 -c 'import json,sys; print(json.load(sys.stdin)["tokens"]["access_token"])')

curl -X POST http://localhost:8003/api/admin/knowledge-base/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@path/to/guideline.pdf" \
  -F "title=Guideline Title"
```

Ingestion runs in the background — the server stays responsive.

## Project Structure

```
weightwAIse/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, Pinecone init
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   ├── database.py          # SQLAlchemy async + SQLite WAL mode
│   │   ├── models/              # ORM models (user, intake, chat, kb)
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # API routes (auth, chat, admin, reports)
│   │   ├── services/            # Business logic (chat, RAG, Gemini, decision tree)
│   │   └── utils/               # Prompts, embeddings, chunking
│   ├── data/guidelines/         # Uploaded documents
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js pages (chat, admin, login)
│   │   ├── components/          # shadcn/ui + custom components
│   │   ├── lib/                 # API client, auth, voice, types
│   │   └── hooks/               # useAuth, useChat, useVoice
│   ├── public/logo.png          # WeightwAIse logo
│   ├── package.json
│   └── .env.example
├── ecosystem.config.js          # PM2 config
├── PRD.md
└── README.md
```

## Environment Variables

### Backend (.env)
```
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=weightwaise
DATABASE_URL=sqlite+aiosqlite:///./data/weightwaise.db
JWT_SECRET=your_jwt_secret
NCBI_API_KEY=your_ncbi_api_key
NCBI_EMAIL=your_email@example.com
FRONTEND_URL=http://localhost:3002
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8003
```

## Deployment

- **Frontend**: Deploy `frontend/` to Vercel
- **Backend**: Ubuntu server with PM2 + Uvicorn

## License

Private — All rights reserved.
