from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class FamilyMember(BaseModel):
    name: str
    relationship: str


class OnboardRequest(BaseModel):
    elder_name: str = Field(..., min_length=1)
    age: int = Field(..., ge=40, le=120)
    language: str = Field(default="English")
    family_members: list[FamilyMember] = Field(default_factory=list)
    key_memories: list[str] = Field(default_factory=list)
    daily_routine: list[str] = Field(default_factory=list)
    favorite_topics: list[str] = Field(default_factory=list)
    elder_id: str | None = None


class OnboardResponse(BaseModel):
    elder_id: str
    message: str


class DemoLoadResponse(BaseModel):
    elder_id: str
    profile: dict[str, Any]


class VoiceChatResponse(BaseModel):
    elder_id: str
    transcript: str
    assistant_text: str
    mood: str
    distress: bool
    topics: list[str]
    tts_fallback: bool
    llm_fallback: bool = False
    llm_error: str | None = None
    audio_base64: str | None = None
    audio_mime_type: str | None = None
    emergency_alert: dict[str, str] | None = None


class ConversationEntry(BaseModel):
    elder_id: str
    timestamp: datetime
    user_text: str
    assistant_text: str
    mood: str
    distress: bool
    topics: list[str] = Field(default_factory=list)


class DashboardResponse(BaseModel):
    elder_id: str
    elder_name: str
    summary: str
    mood: str
    topics: list[str]
    distress_alerts: list[str]
    sessions_today: int


class ErrorResponse(BaseModel):
    detail: str


class CognitiveJournalResponse(BaseModel):
    elder_id: str
    elder_name: str
    date: str
    emotional_summary: str
    flagged_moments: list[str]
    positive_anchors: list[str]
    recommended_actions: list[str]
    cognitive_score: int
    engagements: int

