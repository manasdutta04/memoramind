from __future__ import annotations

from collections import Counter
from datetime import datetime
from typing import Any

from app.services.data_store import JsonDataStore
from app.services.llm_service import LLMService


class DashboardService:
    def __init__(self, data_store: JsonDataStore, llm_service: LLMService) -> None:
        self.data_store = data_store
        self.llm_service = llm_service

    async def get_dashboard(self, elder_id: str) -> dict[str, Any]:
        profile = self.data_store.get_profile(elder_id)
        if not profile:
            raise ValueError("Profile not found")

        now_date = datetime.utcnow().date().isoformat()
        all_conversations = self.data_store.get_conversations(elder_id)
        today_rows = [
            row
            for row in all_conversations
            if str(row.get("timestamp", "")).startswith(now_date)
        ]

        mood = "Calm"
        if today_rows:
            mood_counter = Counter(row.get("mood", "Calm") for row in today_rows)
            mood = mood_counter.most_common(1)[0][0]

        topic_counter = Counter()
        distress_alerts: list[str] = []
        transcripts: list[str] = []

        for row in today_rows:
            topic_counter.update(row.get("topics", []))
            transcripts.append(f"User: {row.get('user_text', '')}")
            transcripts.append(f"Assistant: {row.get('assistant_text', '')}")
            if row.get("distress"):
                distress_alerts.append(
                    "Distress detected at "
                    f"{row.get('timestamp', '')}: consider checking in by call."
                )

        summary = await self.llm_service.summarize_sessions(
            elder_name=profile.get("elder_name", "Your loved one"),
            language=profile.get("language", "English"),
            transcripts=transcripts,
        )

        return {
            "elder_id": elder_id,
            "elder_name": profile.get("elder_name", ""),
            "summary": summary,
            "mood": mood,
            "topics": [topic for topic, _ in topic_counter.most_common(6)],
            "distress_alerts": distress_alerts,
            "sessions_today": len(today_rows),
        }
