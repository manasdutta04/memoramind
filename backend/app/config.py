from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "backend" / "app" / "data"
FRONTEND_DIST_DIR = ROOT_DIR / "frontend" / "dist"


class Settings(BaseSettings):
    app_name: str = "MemoraMind"
    app_env: str = "development"
    cors_origins: str = "*"

    mistral_api_key: str = ""
    mistral_model: str = "mistral-large-latest"
    mistral_api_base: str = "https://api.mistral.ai/v1"

    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "EXAVITQu4vr4xnSDxMaL"
    elevenlabs_model_id: str = "eleven_turbo_v2_5"

    whisper_model_size: str = "base"

    chroma_persist_dir: str = str(ROOT_DIR / "backend" / "chroma_db")
    memory_collection: str = "elder_memories"

    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    return Settings()
