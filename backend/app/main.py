"""FastAPI application — weightwAIse backend.

Bariatric surgery consultant with multimodal RAG.
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_all_tables

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def _init_pinecone():
    """Initialize Pinecone index, creating it if necessary.

    Returns the Pinecone Index object, or None on failure.
    """
    try:
        from pinecone import Pinecone, ServerlessSpec

        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        index_name = settings.PINECONE_INDEX_NAME
        dimension = settings.GEMINI_EMBEDDING_DIMENSION

        # Check if index exists
        existing_indexes = [idx.name for idx in pc.list_indexes()]

        if index_name not in existing_indexes:
            logger.info("Creating Pinecone index '%s' (dim=%d)...", index_name, dimension)
            pc.create_index(
                name=index_name,
                dimension=dimension,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
            logger.info("Pinecone index '%s' created.", index_name)
        else:
            logger.info("Pinecone index '%s' already exists.", index_name)

        index = pc.Index(index_name)
        logger.info("Pinecone index stats: %s", index.describe_index_stats())
        return index

    except Exception as e:
        logger.error("Pinecone initialization failed: %s", e)
        logger.warning("Running without vector database — RAG features will be disabled.")
        return None


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Application lifespan: startup and shutdown logic."""
    logger.info("Starting weightwAIse backend...")

    # Ensure data directories exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.PUBMED_DIR, exist_ok=True)
    os.makedirs("./data", exist_ok=True)

    # Create database tables (dev mode — no Alembic)
    logger.info("Creating database tables...")
    # Import all models to ensure they're registered with Base.metadata
    import app.models  # noqa: F401
    await create_all_tables()
    logger.info("Database tables ready.")

    # Initialize Pinecone
    logger.info("Initializing Pinecone...")
    application.state.pinecone_index = _init_pinecone()

    logger.info("weightwAIse backend started successfully.")
    yield

    # Shutdown
    logger.info("Shutting down weightwAIse backend...")


# Create FastAPI app
app = FastAPI(
    title="weightwAIse API",
    description="AI-powered bariatric surgery consultant with multimodal RAG",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3002",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from app.routers.auth import router as auth_router
from app.routers.chat import router as chat_router
from app.routers.admin import router as admin_router
from app.routers.reports import router as reports_router

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(admin_router)
app.include_router(reports_router)


@app.get("/")
async def root():
    return {
        "name": "weightwAIse API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "pinecone_connected": hasattr(app.state, "pinecone_index") and app.state.pinecone_index is not None,
    }
