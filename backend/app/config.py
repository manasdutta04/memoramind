from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from dataclasses import dataclass

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "backend" / "app" / "data"
FRONTEND_DIST_DIR = ROOT_DIR / "frontend" / "dist"


def _load_dotenv(env_path: Path) -> None:
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        raw = line.strip()
        if not raw or raw.startswith("#") or "=" not in raw:
            continue
        key, value = raw.split("=", maxsplit=1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def _parse_bool(raw: str | None, default: bool = False) -> bool:
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_env: str
    cors_origins: str
    mistral_api_key: str
    mistral_model: str
    mistral_api_base: str
    mistral_verify_ssl: bool
    mistral_ca_bundle: str
    elevenlabs_api_key: str
    elevenlabs_voice_id: str
    elevenlabs_model_id: str
    whisper_model_size: str
    whisper_download_root: str
    whisper_insecure_download: bool
    chroma_persist_dir: str
    memory_collection: str

    @classmethod
    def from_env(cls) -> "Settings":
        _load_dotenv(ROOT_DIR / ".env")
        insecure_download = _parse_bool(os.getenv("WHISPER_INSECURE_DOWNLOAD"), default=False)
        return cls(
            app_name=os.getenv("APP_NAME", "MemoraMind"),
            app_env=os.getenv("APP_ENV", "development"),
            cors_origins=os.getenv("CORS_ORIGINS", "*"),
            mistral_api_key=os.getenv("MISTRAL_API_KEY", ""),
            mistral_model=os.getenv("MISTRAL_MODEL", "mistral-large-latest"),
            mistral_api_base=os.getenv("MISTRAL_API_BASE", "https://api.mistral.ai/v1"),
            mistral_verify_ssl=_parse_bool(os.getenv("MISTRAL_VERIFY_SSL"), default=True),
            mistral_ca_bundle=os.getenv("MISTRAL_CA_BUNDLE", ""),
            elevenlabs_api_key=os.getenv("ELEVENLABS_API_KEY", ""),
            elevenlabs_voice_id=os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL"),
            elevenlabs_model_id=os.getenv("ELEVENLABS_MODEL_ID", "eleven_turbo_v2_5"),
            whisper_model_size=os.getenv("WHISPER_MODEL_SIZE", "base"),
            whisper_download_root=os.getenv(
                "WHISPER_DOWNLOAD_ROOT", str(ROOT_DIR / ".cache" / "whisper")
            ),
            whisper_insecure_download=insecure_download,
            chroma_persist_dir=os.getenv(
                "CHROMA_PERSIST_DIR", str(ROOT_DIR / "backend" / "chroma_db")
            ),
            memory_collection=os.getenv("MEMORY_COLLECTION", "elder_memories"),
        )

    @property
    def cors_origins_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    return Settings.from_env()
