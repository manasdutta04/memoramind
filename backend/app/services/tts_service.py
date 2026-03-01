from __future__ import annotations

import base64
import io
import logging

import edge_tts

from app.config import get_settings

logger = logging.getLogger(__name__)

# Warm, natural female voices for elderly companion
VOICE_MAP = {
    "en": "en-US-JennyNeural",       # Warm, friendly US English
    "hi": "hi-IN-SwaraNeural",       # Hindi female
}
FALLBACK_VOICE = "en-US-JennyNeural"


class TTSService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def synthesize(
        self,
        text: str,
        api_key_override: str | None = None,
    ) -> tuple[str | None, str | None, bool]:
        """
        Returns (audio_base64, mime_type, tts_fallback).
        Uses Microsoft Edge TTS — free, no API key, works everywhere.
        """
        if not text or not text.strip():
            return None, None, True

        # Pick voice based on configured language or default to English
        voice = VOICE_MAP.get("en", FALLBACK_VOICE)

        try:
            communicate = edge_tts.Communicate(text, voice, rate="-10%", pitch="+0Hz")
            audio_buffer = io.BytesIO()

            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_buffer.write(chunk["data"])

            audio_data = audio_buffer.getvalue()
            if len(audio_data) < 100:
                logger.warning("Edge TTS returned very small audio (%d bytes)", len(audio_data))
                return None, None, True

            return base64.b64encode(audio_data).decode("utf-8"), "audio/mpeg", False

        except Exception as exc:
            logger.warning("Edge TTS failed: %s", exc)
            return None, None, True
