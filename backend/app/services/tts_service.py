from __future__ import annotations

import base64

import httpx

from app.config import get_settings


class TTSService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def synthesize(self, text: str) -> tuple[str | None, str | None, bool]:
        """
        Returns (audio_base64, mime_type, tts_fallback).
        """
        if not self.settings.elevenlabs_api_key:
            return None, None, True

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.settings.elevenlabs_voice_id}"
        headers = {
            "xi-api-key": self.settings.elevenlabs_api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        payload = {
            "text": text,
            "model_id": self.settings.elevenlabs_model_id,
            "voice_settings": {"stability": 0.45, "similarity_boost": 0.75},
        }

        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
            return base64.b64encode(response.content).decode("utf-8"), "audio/mpeg", False
        except Exception:
            return None, None, True
