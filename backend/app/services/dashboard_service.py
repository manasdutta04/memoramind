from __future__ import annotations

from collections import Counter
from datetime import datetime
from typing import Any

from app.services.data_store import JsonDataStore
from app.services.llm_service import LLMService

_MAX_LOG_ENTRIES = 10  # Max conversation entries sent to the dashboard


class DashboardService:
    def __init__(self, data_store: JsonDataStore, llm_service: LLMService) -> None:
        self.data_store = data_store
        self.llm_service = llm_service

    async def get_dashboard(self, elder_id: str, mistral_api_key: str | None = None) -> dict[str, Any]:
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

        topic_counter: Counter[str] = Counter()
        distress_alerts: list[str] = []
        transcripts: list[str] = []

        for row in today_rows:
            topic_counter.update(row.get("topics", []))
            transcripts.append(f"User: {row.get('user_text', '')}")
            transcripts.append(f"Assistant: {row.get('assistant_text', '')}")
            if row.get("distress"):
                ts = row.get("timestamp", "")
                # Format timestamp nicely — take only the time portion
                try:
                    dt = datetime.fromisoformat(ts)
                    time_str = dt.strftime("%I:%M %p")
                except Exception:
                    time_str = ts
                distress_alerts.append(
                    f"Distress detected at {time_str}: consider a caring phone call."
                )

        summary = await self.llm_service.summarize_sessions(
            elder_name=profile.get("elder_name", "Your loved one"),
            language=profile.get("language", "English"),
            transcripts=transcripts,
            api_key_override=mistral_api_key,
        )

        # Build conversation log for the family dashboard (last N entries, most recent first)
        conversation_log = []
        for row in reversed(today_rows[-_MAX_LOG_ENTRIES:]):
            ts = row.get("timestamp", "")
            try:
                dt = datetime.fromisoformat(ts)
                time_str = dt.strftime("%I:%M %p")
            except Exception:
                time_str = ts
            conversation_log.append({
                "time": time_str,
                "user_text": row.get("user_text", ""),
                "assistant_text": row.get("assistant_text", ""),
                "mood": row.get("mood", "Calm"),
                "distress": row.get("distress", False),
                "topics": row.get("topics", []),
            })

        return {
            "elder_id": elder_id,
            "elder_name": profile.get("elder_name", ""),
            "summary": summary,
            "mood": mood,
            "topics": [topic for topic, _ in topic_counter.most_common(6)],
            "distress_alerts": distress_alerts,
            "sessions_today": len(today_rows),
            "conversation_log": conversation_log,
        }
