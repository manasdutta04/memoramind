from __future__ import annotations

import tempfile
from pathlib import Path

from app.config import get_settings


class STTService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._model = None

    def _load_model(self) -> None:
        if self._model is not None:
            return
        import whisper

        self._model = whisper.load_model(self.settings.whisper_model_size)

    def transcribe(self, audio_bytes: bytes, suffix: str = ".webm") -> str:
        self._load_model()
        if self._model is None:
            raise RuntimeError("Whisper model unavailable")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = Path(temp_file.name)
            temp_file.write(audio_bytes)

        try:
            result = self._model.transcribe(str(temp_path), fp16=False)
            text = str(result.get("text", "")).strip()
            if not text:
                raise RuntimeError("No speech detected")
            return text
        finally:
            if temp_path.exists():
                temp_path.unlink(missing_ok=True)
