"""Auth request/response schemas."""

from datetime import datetime
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field(default="patient", pattern="^(admin|patient)$")
    full_name: str | None = None
    language_preference: str = Field(default="en", pattern="^(en|es)$")


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    full_name: str | None
    language_preference: str
    created_at: datetime

    model_config = {"from_attributes": True}
