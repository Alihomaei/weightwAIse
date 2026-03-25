# weightwAIse

AI-powered bariatric and metabolic surgery consultant using multimodal RAG.

## Overview

weightwAIse is a web application that acts as a virtual bariatric surgery consultant. It conducts structured patient intake via conversational chat (text + voice), recommends evidence-based treatment pathways, and grounds all medical reasoning in clinical guidelines and PubMed literature.

## Features

- **Conversational Patient Intake** — Guided chat collects structured medical history naturally
- **Clinical Decision Engine** — Rule-based decision tree per ASMBS/IFSO guidelines
- **Dual LLM Architecture** — Gemini 2.5 Flash (chat) + Gemini 3.1 Pro (clinical reasoning)
- **Multimodal RAG** — PDF, PowerPoint, video, text with Gemini Embedding 2 (text + images in same vector space)
- **Pinecone Vector DB** — Single index with metadata filters for unified multimodal retrieval
- **PubMed Integration** — Auto-fetch and embed bariatric surgery literature
- **Voice I/O** — Speech-to-text and text-to-speech (English + Spanish)
- **Inline Citations** — Every medical claim linked to source documents
- **Admin Panel** — Manage knowledge base, PubMed queries, patient records, clinic settings
- **Patient Reports** — Auto-generated summaries with PDF download
- **Bilingual** — Full English and Spanish support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Python 3.11+, FastAPI |
| LLM | Gemini 2.5 Flash + Gemini 3.1 Pro |
| Embeddings | Gemini Embedding 2 (multimodal) |
| Vector DB | Pinecone |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Voice | Web Speech API |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Gemini API key
- Pinecone API key

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with backend URL
npm run dev
```

Open http://localhost:3002

### Default Admin Account

After first run, register an admin:
```bash
curl -X POST http://localhost:8002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "changeme", "role": "admin", "full_name": "Admin"}'
```

## Project Structure

```
weightwAIse/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   ├── database.py          # SQLAlchemy async engine
│   │   ├── models/              # ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # API route handlers
│   │   ├── services/            # Business logic
│   │   └── utils/               # Helpers, prompts, embeddings
│   ├── data/
│   │   ├── guidelines/          # Uploaded documents
│   │   └── pubmed/              # PubMed articles
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js app router pages
│   │   ├── components/          # React components
│   │   ├── lib/                 # API client, auth, voice helpers
│   │   └── hooks/               # Custom React hooks
│   ├── package.json
│   └── .env.example
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
NEXT_PUBLIC_API_URL=http://localhost:8002
```

## Deployment

- **Frontend**: Deploy `frontend/` to Vercel
- **Backend**: Deploy to Ubuntu server, run with `uvicorn` + PM2

## License

Private — All rights reserved.
