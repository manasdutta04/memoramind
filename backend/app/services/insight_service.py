from __future__ import annotations

import re
from collections import Counter


class InsightService:
    DISTRESS_TERMS = {
        "lost",
        "scared",
        "afraid",
        "panic",
        "cry",
        "alone",
        "confused",
        "help",
        "hurt",
        "pain",
        "where am i",
    }
    CALM_TERMS = {"okay", "fine", "good", "calm", "peaceful", "thank you"}
    HAPPY_TERMS = {"happy", "smile", "great", "wonderful", "love", "laugh"}

    def detect_mood(self, user_text: str, assistant_text: str) -> tuple[str, bool]:
        text = f"{user_text} {assistant_text}".lower()
        distress = any(term in text for term in self.DISTRESS_TERMS)
        if distress:
            return "Distressed", True

        happy_hits = sum(term in text for term in self.HAPPY_TERMS)
        calm_hits = sum(term in text for term in self.CALM_TERMS)

        if happy_hits >= 2:
            return "Happy", False
        if calm_hits >= 1:
            return "Calm", False
        if "confus" in text or "forget" in text:
            return "Confused", False
        return "Calm", False

    def extract_topics(self, user_text: str, assistant_text: str, max_topics: int = 5) -> list[str]:
        text = f"{user_text} {assistant_text}".lower()
        tokens = re.findall(r"[a-zA-Z]{4,}", text)
        stopwords = {
            "that",
            "this",
            "with",
            "have",
            "your",
            "from",
            "they",
            "them",
            "would",
            "could",
            "there",
            "their",
            "about",
            "feel",
            "today",
            "were",
            "what",
            "when",
            "just",
            "like",
            "know",
            "want",
        }
        filtered = [token for token in tokens if token not in stopwords]
        counts = Counter(filtered)
        return [token.title() for token, _ in counts.most_common(max_topics)]
