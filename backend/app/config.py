"""Application configuration via pydantic-settings, reading from .env."""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Gemini ---
    GEMINI_API_KEY: str
    GEMINI_FLASH_MODEL: str = "gemini-2.5-flash"
    GEMINI_PRO_MODEL: str = "gemini-3.1-pro-preview"
    GEMINI_EMBEDDING_MODEL: str = "models/gemini-embedding-2-preview"
    GEMINI_EMBEDDING_DIMENSION: int = 3072

    # --- Pinecone ---
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str = "weightwaise"

    # --- Database ---
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/weightwaise.db"

    # --- JWT Auth ---
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- NCBI / PubMed ---
    NCBI_API_KEY: str = "replace_with_real_ncbi_key"
    NCBI_EMAIL: str = "replace_with_your_email"

    # --- File Storage ---
    UPLOAD_DIR: str = "./data/guidelines"
    PUBMED_DIR: str = "./data/pubmed"

    # --- Frontend CORS ---
    FRONTEND_URL: str = "http://localhost:3002"

    # --- App ---
    DEFAULT_LANGUAGE: str = "en"
    MAX_UPLOAD_SIZE_MB: int = 500


settings = Settings()
