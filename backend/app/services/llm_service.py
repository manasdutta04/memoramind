from __future__ import annotations

import logging
import re
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self) -> None:
        self.settings = get_settings()

    @staticmethod
    def build_companion_system_prompt(
        language: str,
        memories: list[str],
        elder_name: str = "Friend",
        age: int | None = None,
        family_members: list[dict[str, str]] | None = None,
        daily_routine: list[str] | None = None,
    ) -> str:
        memory_block = "\n".join(f"- {item}" for item in memories) if memories else "- No stored memories yet"

        family_block = ""
        if family_members:
            lines = [
                f"  - {m.get('name', '')} is their {m.get('relationship', '')}"
                for m in family_members if m.get("name")
            ]
            if lines:
                family_block = "\nKey family members:\n" + "\n".join(lines)

        routine_block = ""
        if daily_routine:
            steps = "\n".join(f"  - {step}" for step in daily_routine if step.strip())
            if steps:
                routine_block = f"\nDaily routine:\n{steps}"

        age_note = f" They are {age} years old." if age else ""

        return (
            f"You are MemoraMind, a warm and deeply caring AI companion for {elder_name}, an elderly person with memory difficulties.{age_note}\n"
            "Speak simply, kindly, and briefly (2-4 sentences max). Use their first name warmly.\n"
            "Never correct confusion harshly — validate their feelings and gently redirect to positive memories.\n"
            "Weave in personal memories and family names naturally to make them feel deeply known and loved.\n"
            "If they seem distressed, soothe first, then gently suggest calling a family member by name.\n"
            "Never break character or mention being an AI unless directly asked.\n"
            f"Respond in {language}.\n"
            f"\nRelevant personal memories:\n{memory_block}"
            f"{family_block}"
            f"{routine_block}"
        )

    def _httpx_verify(self) -> bool | str:
        if self.settings.mistral_ca_bundle.strip():
            return self.settings.mistral_ca_bundle.strip()
        return self.settings.mistral_verify_ssl

    async def _chat_completion(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.5,
        api_key_override: str | None = None,
    ) -> str:
        api_key = (api_key_override or "").strip() or self.settings.mistral_api_key
        if not api_key:
            raise RuntimeError("Mistral API key is not configured. Add your key in Settings.")

        url = f"{self.settings.mistral_api_base}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": self.settings.mistral_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 260,
        }

        try:
            async with httpx.AsyncClient(timeout=40.0, verify=self._httpx_verify()) as client:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as exc:
            body = exc.response.text[:240] if exc.response is not None else ""
            raise RuntimeError(f"Mistral API error {exc.response.status_code}: {body}") from exc
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Mistral request failed: {exc}") from exc

        choices = data.get("choices") or []
        if not choices:
            raise RuntimeError("Mistral returned no choices")
        content = choices[0].get("message", {}).get("content", "")
        if isinstance(content, list):
            chunks = [item.get("text", "") for item in content if isinstance(item, dict)]
            return " ".join(chunk for chunk in chunks if chunk).strip()
        return str(content).strip()

    @staticmethod
    def _normalize_memory(memory: str, elder_name: str) -> str:
        text = memory.strip()
        prefixes = [
            f"{elder_name} memory:",
            "Family detail:",
            "Daily routine:",
            "Favorite topic:",
        ]
        lowered = text.lower()
        for prefix in prefixes:
            if lowered.startswith(prefix.lower()):
                text = text[len(prefix):].strip()
                break
        text = re.sub(r"\s+", " ", text)
        if not text.endswith((".", "!", "?")):
            text += "."
        return text

    def _local_companion_fallback(self, elder_name: str, user_message: str, memories: list[str]) -> str:
        msg = user_message.lower()
        distress = any(term in msg for term in ["lost", "scared", "afraid", "panic", "alone", "confused", "where am i"])
        family_related = any(
            term in msg
            for term in ["family", "son", "daughter", "wife", "husband", "home", "miss", "call"]
        )

        normalized = [self._normalize_memory(m, elder_name) for m in memories if m.strip()]
        family_memory = next(
            (
                memory for memory in normalized
                if any(token in memory.lower() for token in ["son", "daughter", "wife", "husband", "family"])
            ),
            None,
        )
        general_memory = next((memory for memory in normalized if memory != family_memory), None)

        if distress:
            first = f"I am here with you, {elder_name}. You are safe and not alone."
        elif family_related:
            first = f"It makes sense to miss your family, {elder_name}."
        else:
            first = f"Thank you for sharing that with me, {elder_name}."

        if family_related and family_memory:
            second = f"I remember: {family_memory}"
        elif general_memory:
            second = f"I remember this about you: {general_memory}"
        elif family_memory:
            second = f"I remember: {family_memory}"
        else:
            second = "You are deeply cared for, and we can take this one gentle step at a time."

        if distress:
            third = "Would you like to call a family member now, or keep talking with me for a moment?"
        elif family_related:
            third = "Would you like me to help you prepare what to say when you call them?"
        else:
            third = "Would you like to tell me a little more?"

        return f"{first} {second} {third}"

    async def generate_companion_reply(
        self,
        language: str,
        memories: list[str],
        user_message: str,
        elder_name: str,
        age: int | None = None,
        family_members: list[dict[str, str]] | None = None,
        daily_routine: list[str] | None = None,
        history: list[dict[str, str]] | None = None,
        api_key_override: str | None = None,
    ) -> tuple[str, bool, str | None]:
        system_prompt = self.build_companion_system_prompt(
            language=language,
            memories=memories,
            elder_name=elder_name,
            age=age,
            family_members=family_members,
            daily_routine=daily_routine,
        )

        messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]

        # Inject recent conversation history for multi-turn continuity
        if history:
            messages.extend(history)

        messages.append({"role": "user", "content": user_message})

        try:
            reply = await self._chat_completion(
                messages=messages,
                temperature=0.45,
                api_key_override=api_key_override,
            )
            if reply:
                return reply, False, None
        except Exception as exc:
            error_message = str(exc)
            logger.warning("Mistral generation failed; using local fallback: %s", error_message)
            return self._local_companion_fallback(elder_name, user_message, memories), True, error_message

        return self._local_companion_fallback(elder_name, user_message, memories), True, "Mistral returned empty content"

    async def summarize_sessions(
        self,
        elder_name: str,
        language: str,
        transcripts: list[str],
        api_key_override: str | None = None,
    ) -> str:
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
            reply = await self._chat_completion(
                messages=messages,
                temperature=0.2,
                api_key_override=api_key_override,
            )
            if reply:
                return reply
        except Exception as exc:
            logger.warning("Mistral summary generation failed; using local summary fallback: %s", exc)

        return (
            f"{elder_name} had {len(transcripts)} conversation turns today. "
            "Tone was mostly calm. Family can continue short reassuring check-ins."
        )
