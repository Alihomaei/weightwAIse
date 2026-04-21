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


async def _seed_user_if_configured() -> None:
    """Create a seed user on startup if SEED_USER_* env vars are set. Idempotent."""
    if not (settings.SEED_USER_USERNAME and settings.SEED_USER_PASSWORD):
        return

    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models.user import User
    from app.services.auth_service import hash_password

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.username == settings.SEED_USER_USERNAME)
        )
        existing = result.scalar_one_or_none()
        if existing:
            logger.info("Seed user '%s' already exists — skipping.", settings.SEED_USER_USERNAME)
            return

        user = User(
            username=settings.SEED_USER_USERNAME,
            password_hash=hash_password(settings.SEED_USER_PASSWORD),
            role=settings.SEED_USER_ROLE,
            full_name=settings.SEED_USER_FULL_NAME or settings.SEED_USER_USERNAME,
        )
        db.add(user)
        await db.commit()
        logger.info("Seed user '%s' created.", settings.SEED_USER_USERNAME)


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

    # Seed a user if configured (used for first-run deploys)
    try:
        await _seed_user_if_configured()
    except Exception as e:
        logger.error("Seed user creation failed: %s", e)

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

# CORS middleware — accepts a comma-separated FRONTEND_URL for multiple origins
# and an optional CORS_ALLOW_ORIGIN_REGEX for matching Vercel preview URLs.
origins = [
    o.strip()
    for o in settings.FRONTEND_URL.split(",")
    if o.strip()
] + [
    "http://localhost:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3002",
]

cors_kwargs = {
    "allow_origins": origins,
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if settings.CORS_ALLOW_ORIGIN_REGEX:
    cors_kwargs["allow_origin_regex"] = settings.CORS_ALLOW_ORIGIN_REGEX

app.add_middleware(CORSMiddleware, **cors_kwargs)

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
