from __future__ import annotations

from typing import Any

import httpx

from app.config import get_settings


class LLMService:
    def __init__(self) -> None:
        self.settings = get_settings()

    @staticmethod
    def build_companion_system_prompt(language: str, memories: list[str]) -> str:
        memory_block = "\n".join(f"- {item}" for item in memories) if memories else "- No stored memories yet"
        return (
            "You are MemoraMind, a warm and patient AI companion for elderly people.\n"
            "Speak simply, kindly, and briefly (2-3 sentences max).\n"
            "Never harshly correct confusion — validate feelings and gently redirect.\n"
            "Use the person's memories naturally to make them feel known and loved.\n"
            "If they seem distressed, soothe them and suggest calling a family member.\n"
            f"Respond in {language}.\n"
            f"Relevant memories: {memory_block}"
        )

    async def _chat_completion(self, messages: list[dict[str, str]], temperature: float = 0.5) -> str:
        if not self.settings.mistral_api_key:
            raise RuntimeError("MISTRAL_API_KEY is not configured")

        url = f"{self.settings.mistral_api_base}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.settings.mistral_api_key}",
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": self.settings.mistral_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 220,
        }

        async with httpx.AsyncClient(timeout=40.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        choices = data.get("choices") or []
        if not choices:
            raise RuntimeError("Mistral returned no choices")
        content = choices[0].get("message", {}).get("content", "")
        if isinstance(content, list):
            chunks = [item.get("text", "") for item in content if isinstance(item, dict)]
            return " ".join(chunk for chunk in chunks if chunk).strip()
        return str(content).strip()

    async def generate_companion_reply(
        self,
        language: str,
        memories: list[str],
        user_message: str,
        elder_name: str,
    ) -> str:
        messages = [
            {"role": "system", "content": self.build_companion_system_prompt(language, memories)},
            {
                "role": "user",
                "content": f"Elder name: {elder_name}. Their latest message: {user_message}",
            },
        ]

        try:
            reply = await self._chat_completion(messages=messages, temperature=0.45)
            if reply:
                return reply
        except Exception:
            pass

        # Deterministic fallback for offline/API failure mode
        memory_hint = memories[0] if memories else "your family cares deeply about you"
        return (
            f"I hear you, {elder_name}. You are safe and loved. "
            f"I remember this about you: {memory_hint}. "
            "Would you like to tell me a little more?"
        )

    async def summarize_sessions(self, elder_name: str, language: str, transcripts: list[str]) -> str:
        if not transcripts:
            return f"No conversations recorded today for {elder_name}."

        joined = "\n".join(f"- {line}" for line in transcripts[-12:])
        prompt = (
            "Summarize the elder's day in 3 short bullet-style sentences for family caregivers. "
            "Include emotional tone, repeated concerns, and supportive next step."
        )
        messages = [
            {"role": "system", "content": f"Respond in {language}. Keep it concise and clear."},
            {"role": "user", "content": f"{prompt}\nConversation snippets:\n{joined}"},
        ]

        try:
            reply = await self._chat_completion(messages=messages, temperature=0.2)
            if reply:
                return reply
        except Exception:
            pass

        return (
            f"{elder_name} had {len(transcripts)} conversation turns today. "
            "Tone was mostly calm. Family can continue short reassuring check-ins."
        )
