from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.data_store import JsonDataStore
from app.services.insight_service import InsightService
from app.services.llm_service import LLMService
from app.services.memory_service import MemoryService
from app.services.stt_service import STTService
from app.services.tts_service import TTSService


class VoiceService:
    def __init__(
        self,
        data_store: JsonDataStore,
        memory_service: MemoryService,
        llm_service: LLMService,
        stt_service: STTService,
        tts_service: TTSService,
        insight_service: InsightService,
    ) -> None:
        self.data_store = data_store
        self.memory_service = memory_service
        self.llm_service = llm_service
        self.stt_service = stt_service
        self.tts_service = tts_service
        self.insight_service = insight_service

    async def run_chat(
        self,
        elder_id: str,
        audio_bytes: bytes | None,
        audio_filename: str | None = None,
        user_text_override: str | None = None,
    ) -> dict[str, Any]:
        profile = self.data_store.get_profile(elder_id)
        if not profile:
            raise ValueError("Profile not found. Please onboard first or load demo profile.")

        if user_text_override and user_text_override.strip():
            transcript = user_text_override.strip()
        elif audio_bytes:
            suffix = ".webm"
            if audio_filename and "." in audio_filename:
                suffix = "." + audio_filename.rsplit(".", maxsplit=1)[1]
            transcript = self.stt_service.transcribe(audio_bytes=audio_bytes, suffix=suffix)
        else:
            raise ValueError("No audio or text input was provided.")

        memories = self.memory_service.retrieve_memories(elder_id=elder_id, query=transcript, limit=6)
        assistant_text = await self.llm_service.generate_companion_reply(
            language=profile.get("language", "English"),
            memories=memories,
            user_message=transcript,
            elder_name=profile.get("elder_name", "Friend"),
        )

        mood, distress = self.insight_service.detect_mood(transcript, assistant_text)
        topics = self.insight_service.extract_topics(transcript, assistant_text)
        audio_base64, audio_mime_type, tts_fallback = await self.tts_service.synthesize(assistant_text)

        self.data_store.append_conversation(
            elder_id=elder_id,
            entry={
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "user_text": transcript,
                "assistant_text": assistant_text,
                "mood": mood,
                "distress": distress,
                "topics": topics,
            },
        )

        return {
            "elder_id": elder_id,
            "transcript": transcript,
            "assistant_text": assistant_text,
            "mood": mood,
            "distress": distress,
            "topics": topics,
            "audio_base64": audio_base64,
            "audio_mime_type": audio_mime_type,
            "tts_fallback": tts_fallback,
        }
