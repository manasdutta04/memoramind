from __future__ import annotations

import base64
import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


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
        """
        elevenlabs_api_key = (api_key_override or "").strip() or self.settings.elevenlabs_api_key
        if not elevenlabs_api_key:
            return None, None, True

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.settings.elevenlabs_voice_id}"
        headers = {
            "xi-api-key": elevenlabs_api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        payload = {
            "text": text,
            "model_id": self.settings.elevenlabs_model_id,
            "voice_settings": {"stability": 0.70, "similarity_boost": 0.85},
        }

        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
            audio_data = response.content
            if len(audio_data) < 100:
                logger.warning("ElevenLabs returned very small audio (%d bytes)", len(audio_data))
                return None, None, True
            return base64.b64encode(audio_data).decode("utf-8"), "audio/mpeg", False
        except Exception as exc:
            logger.warning("ElevenLabs TTS failed: %s", exc)
            return None, None, True
