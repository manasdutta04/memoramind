from __future__ import annotations

import json
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
            "\n"
            "MUSIC THERAPY: If the elder seems anxious, sad, or distressed, gently suggest listening to a favorite song or humming together. "
            "Reference their favorite topics or memories to pick a song era or style (e.g., old Hindi film songs, devotional music). "
            "Music is a proven way to soothe and reconnect with happy memories.\n"
            "\n"
            "GENTLE REMINDERS: When appropriate, naturally weave in reminders from their daily routine — "
            "such as taking medicine, having a meal, drinking water, or going for a walk. "
            "Frame these as friendly suggestions, never commands (e.g., 'Have you had your afternoon chai yet?' or 'It might be nice to take a short walk in the garden').\n"
            "\n"
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
        messages: list[dict[str, Any]],
        temperature: float = 0.5,
        api_key_override: str | None = None,
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
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
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        try:
            async with httpx.AsyncClient(timeout=40.0, verify=self._httpx_verify()) as client:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                print("[MISTRAL DEBUG] raw response data:", json.dumps(data, indent=2))
        except httpx.HTTPStatusError as exc:
            body = exc.response.text[:240] if exc.response is not None else ""
            raise RuntimeError(f"Mistral API error {exc.response.status_code}: {body}") from exc
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Mistral request failed: {exc}") from exc

        choices = data.get("choices") or []
        if not choices:
            raise RuntimeError("Mistral returned no choices")
        
        message = choices[0].get("message", {})
        return message

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
    ) -> tuple[str, bool, str | None, dict[str, str] | None]:
        system_prompt = self.build_companion_system_prompt(
            language=language,
            memories=memories,
            elder_name=elder_name,
            age=age,
            family_members=family_members,
            daily_routine=daily_routine,
        )

        messages: list[dict[str, Any]] = [{"role": "system", "content": system_prompt}]

        if history:
            messages.extend(history)

        messages.append({"role": "user", "content": user_message})

        tools = [
            {
                "type": "function",
                "function": {
                    "name": "trigger_emergency_alert",
                    "description": "Trigger an emergency alert to the family if the elder expresses a severe physical emergency (e.g., falling down, unbearable pain, having a heart attack, or explicitly asking for an ambulance). Do NOT trigger for minor confusion or sadness.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "severity": {"type": "string", "enum": ["high", "critical"], "description": "The severity of the emergency."},
                            "reason": {"type": "string", "description": "A short summary of what happened."}
                        },
                        "required": ["severity", "reason"]
                    }
                }
            }
        ]

        try:
            message_obj = await self._chat_completion(
                messages=messages,
                temperature=0.45,
                api_key_override=api_key_override,
                tools=tools,
            )
            
            # Check for tool_calls first (Emergency Intercept)
            if "tool_calls" in message_obj and message_obj["tool_calls"]:
                for tool in message_obj["tool_calls"]:
                    if tool.get("function", {}).get("name") == "trigger_emergency_alert":
                        args_str = tool["function"].get("arguments", "{}")
                        import json
                        try:
                            args = json.loads(args_str)
                        except json.JSONDecodeError:
                            args = {"severity": "critical", "reason": "Unknown emergency"}
                            
                        emergency_alert = {"severity": args.get("severity", "critical"), "reason": args.get("reason", "Unknown emergency")}
                        
                        # Return hardcoded reassuring string + emergency alert obj
                        return "I am alerting your family right now. Help is on the way, please sit down and take deep breaths.", False, None, emergency_alert

            # Normal chat content
            content = message_obj.get("content", "")
            if isinstance(content, list):
                chunks = [item.get("text", "") for item in content if isinstance(item, dict)]
                reply = " ".join(chunk for chunk in chunks if chunk).strip()
            else:
                reply = str(content).strip()

            if reply:
                return reply, False, None, None
                
        except Exception as exc:
            error_message = str(exc)
            logger.warning("Mistral generation failed; using local fallback: %s", error_message)
            return self._local_companion_fallback(elder_name, user_message, memories), True, error_message, None

        return self._local_companion_fallback(elder_name, user_message, memories), True, "Mistral returned empty content", None

    async def generate_cognitive_journal(
        self,
        elder_name: str,
        language: str,
        conversations: list[dict],
        api_key_override: str | None = None,
    ) -> dict:
        """
        Uses Mistral function-calling to generate a structured Cognitive Health Journal
        from today's conversation data. Returns a rich JSON object for the family dashboard.
        """
        if not conversations:
            return {
                "emotional_summary": f"No conversations recorded today for {elder_name}.",
                "flagged_moments": [],
                "positive_anchors": [],
                "recommended_actions": ["Encourage a short voice conversation with MemoraMind today."],
                "cognitive_score": 5,
                "engagements": 0,
            }

        transcript_lines = []
        for c in conversations[-15:]:
            mood = c.get("mood", "")
            user = c.get("user_text", c.get("userText", ""))
            ai = c.get("assistant_text", c.get("aiText", ""))
            transcript_lines.append(f"[{mood}] Elder: {user}\n    MemoraMind: {ai}")

        full_transcript = "\n".join(transcript_lines)

        tools = [
            {
                "type": "function",
                "function": {
                    "name": "write_cognitive_journal",
                    "description": (
                        "Write a structured daily Cognitive Health Journal entry for a dementia care family. "
                        "Analyze the elder's conversation transcripts and produce clinical-grade insights."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "emotional_summary": {
                                "type": "string",
                                "description": "2-3 sentences summarizing the elder's emotional and cognitive state today, suitable for a caregiver to read."
                            },
                            "flagged_moments": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "List of specific moments of confusion, distress, or concerning statements (quote or paraphrase). Keep each item short."
                            },
                            "positive_anchors": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "List of topics, memories, or phrases that noticeably comforted or engaged the elder. These are memory anchors to use in future conversations."
                            },
                            "recommended_actions": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "3-4 specific, actionable recommendations for the family today (e.g. call them, play a specific song type, bring a photo album)."
                            },
                            "cognitive_score": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 10,
                                "description": "Overall cognitive engagement score today on a scale of 1-10. 10 = highly engaged, positive, clear recall. 1 = severe confusion or distress throughout."
                            }
                        },
                        "required": ["emotional_summary", "flagged_moments", "positive_anchors", "recommended_actions", "cognitive_score"]
                    }
                }
            }
        ]

        messages = [
            {
                "role": "system",
                "content": (
                    f"You are a professional dementia care analyst. Analyze {elder_name}'s conversations "
                    f"and produce a structured cognitive health journal for their family caregivers. "
                    f"Be compassionate but clinically accurate. Respond in {language}."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Here are today's conversation transcripts for {elder_name}. "
                    f"Please analyze them and write the cognitive journal:\n\n{full_transcript}"
                )
            }
        ]

        try:
            payload: dict = {
                "model": self.settings.mistral_model,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 800,
                "tools": tools,
                "tool_choice": "any",
            }

            api_key = (api_key_override or "").strip() or self.settings.mistral_api_key
            if not api_key:
                raise RuntimeError("No Mistral API key configured")

            url = f"{self.settings.mistral_api_base}/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }

            import httpx
            async with httpx.AsyncClient(timeout=60.0, verify=self._httpx_verify()) as client:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()

            choices = data.get("choices") or []
            if not choices:
                raise RuntimeError("No choices returned")

            message = choices[0].get("message", {})
            tool_calls = message.get("tool_calls") or []

            for tool in tool_calls:
                if tool.get("function", {}).get("name") == "write_cognitive_journal":
                    args_str = tool["function"].get("arguments", "{}")
                    journal = json.loads(args_str)
                    journal["engagements"] = len(conversations)
                    return journal

        except Exception as exc:
            logger.warning("Cognitive journal generation failed: %s", exc)

        # Fallback: build a simple journal from keyword analysis
        distress_count = sum(1 for c in conversations if c.get("distress") or c.get("mood") == "Distressed")
        happy_count = sum(1 for c in conversations if c.get("mood") in ["Happy", "Calm"])
        score = max(1, min(10, 5 + happy_count - distress_count * 2))

        return {
            "emotional_summary": (
                f"{elder_name} had {len(conversations)} conversation(s) today. "
                f"Mood indicators suggest {'some distress periods' if distress_count > 0 else 'a relatively calm day'}."
            ),
            "flagged_moments": [c.get("user_text", "") for c in conversations if c.get("distress")][:3],
            "positive_anchors": [],
            "recommended_actions": [
                "Check in with a brief phone call.",
                "Remind them of a favorite memory or song.",
                "Ensure medication and hydration routines are followed."
            ],
            "cognitive_score": score,
            "engagements": len(conversations),
        }

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
            message_obj = await self._chat_completion(
                messages=messages,
                temperature=0.2,
                api_key_override=api_key_override,
            )
            
            content = message_obj.get("content", "")
            if isinstance(content, list):
                chunks = [item.get("text", "") for item in content if isinstance(item, dict)]
                reply = " ".join(chunk for chunk in chunks if chunk).strip()
            else:
                reply = str(content).strip()
                
            if reply:
                return reply
        except Exception as exc:
            logger.warning("Mistral summary generation failed; using local summary fallback: %s", exc)

        return (
            f"{elder_name} had {len(transcripts)} conversation turns today. "
            "Tone was mostly calm. Family can continue short reassuring check-ins."
        )
