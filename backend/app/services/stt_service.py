from __future__ import annotations

import ssl
import shutil
import tempfile
import urllib.error
from pathlib import Path

from app.config import get_settings


class STTService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._model = None
        self._init_error: str | None = None

    @staticmethod
    def _ensure_ffmpeg() -> None:
        if shutil.which("ffmpeg") is not None:
            return
        raise RuntimeError(
            "Speech transcription requires ffmpeg, but it was not found in PATH. "
            "Install it (macOS: 'brew install ffmpeg', Ubuntu/Debian: "
            "'sudo apt-get install -y ffmpeg') and restart the backend. "
            "You can still use text input mode meanwhile."
        )

    def _load_model(self) -> None:
        if self._model is not None:
            return
        if self._init_error:
            raise RuntimeError(self._init_error)

        self._ensure_ffmpeg()
        import whisper

        try:
            download_root = self.settings.whisper_download_root or None
            if self.settings.whisper_insecure_download:
                original_https_context = ssl._create_default_https_context
                ssl._create_default_https_context = ssl._create_unverified_context
                try:
                    self._model = whisper.load_model(
                        self.settings.whisper_model_size,
                        download_root=download_root,
                    )
                finally:
                    ssl._create_default_https_context = original_https_context
            else:
                self._model = whisper.load_model(
                    self.settings.whisper_model_size,
                    download_root=download_root,
                )
        except Exception as exc:
            if isinstance(exc, urllib.error.URLError) or "CERTIFICATE_VERIFY_FAILED" in str(exc):
                self._init_error = (
                    "Whisper model download failed because SSL certificate verification failed. "
                    "Use text input mode for now. To fix voice: configure trusted certs or pre-download "
                    "the model into WHISPER_DOWNLOAD_ROOT. For local dev only, you may set "
                    "WHISPER_INSECURE_DOWNLOAD=true."
                )
            else:
                self._init_error = (
                    f"Whisper speech-to-text is unavailable: {exc}. "
                    "Use text input mode or fix Whisper model setup."
                )
            raise RuntimeError(self._init_error) from exc

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
        except RuntimeError:
            raise
        except Exception as exc:
            if isinstance(exc, FileNotFoundError) and "ffmpeg" in str(exc).lower():
                raise RuntimeError(
                    "Speech transcription failed because ffmpeg is missing. "
                    "Install ffmpeg and restart the backend. "
                    "You can use text input mode meanwhile."
                ) from exc
            raise RuntimeError(f"Speech transcription failed: {exc}") from exc
        finally:
            if temp_path.exists():
                temp_path.unlink(missing_ok=True)
