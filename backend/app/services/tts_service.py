from __future__ import annotations

import base64
import io
import logging

import httpx
import edge_tts

from app.config import get_settings

logger = logging.getLogger(__name__)

# Microsoft Edge TTS voices — warm, natural neural voices
EDGE_VOICE_MAP = {
    "en": "en-US-JennyNeural",
    "hi": "hi-IN-SwaraNeural",
}
EDGE_FALLBACK_VOICE = "en-US-JennyNeural"


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

        Priority:
          1. ElevenLabs — if user provides their own API key
          2. Edge TTS  — free, no key needed, works everywhere
          3. Browser   — fallback if everything fails
        """
        if not text or not text.strip():
            return None, None, True

        # Try ElevenLabs if user provided their own key
        elevenlabs_key = (api_key_override or "").strip()
        if elevenlabs_key:
            result = await self._elevenlabs(text, elevenlabs_key)
            if result:
                return result

        # Default: Edge TTS (free, no key, works from any IP)
        result = await self._edge_tts(text)
        if result:
            return result

        return None, None, True

    async def _elevenlabs(
        self, text: str, api_key: str
    ) -> tuple[str, str, bool] | None:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.settings.elevenlabs_voice_id}"
        headers = {
            "xi-api-key": api_key,
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
                return None
            logger.info("ElevenLabs TTS succeeded (%d bytes)", len(audio_data))
            return base64.b64encode(audio_data).decode("utf-8"), "audio/mpeg", False
        except Exception as exc:
            logger.warning("ElevenLabs TTS failed: %s — falling back to Edge TTS", exc)
            return None

    async def _edge_tts(self, text: str) -> tuple[str, str, bool] | None:
        voice = EDGE_VOICE_MAP.get("en", EDGE_FALLBACK_VOICE)

        try:
            communicate = edge_tts.Communicate(text, voice, rate="-10%", pitch="+0Hz")
            audio_buffer = io.BytesIO()

            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_buffer.write(chunk["data"])

            audio_data = audio_buffer.getvalue()
            if len(audio_data) < 100:
                logger.warning("Edge TTS returned very small audio (%d bytes)", len(audio_data))
                return None

            logger.info("Edge TTS succeeded (%d bytes)", len(audio_data))
            return base64.b64encode(audio_data).decode("utf-8"), "audio/mpeg", False

        except Exception as exc:
            logger.warning("Edge TTS failed: %s", exc)
            return None
