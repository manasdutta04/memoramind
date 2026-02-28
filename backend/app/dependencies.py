from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from app.config import DATA_DIR
from app.services.dashboard_service import DashboardService
from app.services.data_store import JsonDataStore
from app.services.insight_service import InsightService
from app.services.llm_service import LLMService
from app.services.memory_service import MemoryService
from app.services.stt_service import STTService
from app.services.tts_service import TTSService
from app.services.voice_service import VoiceService


@lru_cache(maxsize=1)
def get_data_store() -> JsonDataStore:
    return JsonDataStore(
        profiles_path=Path(DATA_DIR) / "profiles.json",
        conversations_path=Path(DATA_DIR) / "conversations.json",
    )


@lru_cache(maxsize=1)
def get_memory_service() -> MemoryService:
    return MemoryService(data_store=get_data_store())


@lru_cache(maxsize=1)
def get_llm_service() -> LLMService:
    return LLMService()


@lru_cache(maxsize=1)
def get_tts_service() -> TTSService:
    return TTSService()


@lru_cache(maxsize=1)
def get_stt_service() -> STTService:
    return STTService()


@lru_cache(maxsize=1)
def get_voice_service() -> VoiceService:
    return VoiceService(
        data_store=get_data_store(),
        memory_service=get_memory_service(),
        llm_service=get_llm_service(),
        stt_service=get_stt_service(),
        tts_service=get_tts_service(),
        insight_service=InsightService(),
    )


@lru_cache(maxsize=1)
def get_dashboard_service() -> DashboardService:
    return DashboardService(data_store=get_data_store(), llm_service=get_llm_service())
