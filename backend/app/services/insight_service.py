from __future__ import annotations

import re
from collections import Counter


class InsightService:
    DISTRESS_TERMS = {
        "lost", "scared", "afraid", "panic", "crying", "cry", "alone",
        "confused", "help me", "help", "hurt", "pain", "where am i",
        "cannot remember", "don't know", "worried", "worry", "anxious",
        "terrible", "awful", "nobody", "forgotten", "dies", "died",
    }
    CALM_TERMS = {
        "okay", "fine", "good", "calm", "peaceful", "thank you", "thanks",
        "nice", "rest", "comfortable", "alright", "better now",
    }
    HAPPY_TERMS = {
        "happy", "smile", "great", "wonderful", "love", "laugh", "joy",
        "blessed", "excited", "delighted", "glad", "cheerful", "fantastic",
    }
    CONFUSED_TERMS = {
        "confused", "forgot", "forget", "don't remember", "where is", "who are",
        "what day", "what time", "which year", "who is",
    }

    # Domain keyword sets for meaningful topic tagging
    DOMAIN_TOPICS: dict[str, set[str]] = {
        "Family": {"son", "daughter", "wife", "husband", "children", "grandchildren", "family", "mother", "father", "brother", "sister"},
        "Music": {"music", "song", "sing", "piano", "radio", "melody", "bhajan", "ghazal"},
        "Religion": {"prayer", "temple", "church", "god", "worship", "mandir", "puja", "namaz", "dua"},
        "Food": {"food", "lunch", "dinner", "breakfast", "cook", "taste", "chai", "tea", "rice", "roti"},
        "Health": {"pain", "doctor", "medicine", "hospital", "health", "sick", "fever", "tablet", "nurse"},
        "Travel": {"trip", "travel", "village", "hometown", "mumbai", "delhi", "road", "station", "train"},
        "Memories": {"remember", "memory", "past", "used to", "before", "childhood", "young", "wedding", "school"},
        "Nature": {"garden", "flowers", "rain", "sun", "river", "tree", "park", "nature", "morning"},
        "Friends": {"friend", "neighbour", "colleague", "classmate", "companion"},
    }

    def detect_mood(self, user_text: str, assistant_text: str) -> tuple[str, bool]:
        text = f"{user_text} {assistant_text}".lower()
        distress = any(term in text for term in self.DISTRESS_TERMS)
        if distress:
            return "Distressed", True

        confused_hits = sum(term in text for term in self.CONFUSED_TERMS)
        happy_hits = sum(term in text for term in self.HAPPY_TERMS)
        calm_hits = sum(term in text for term in self.CALM_TERMS)

        if confused_hits >= 1 and happy_hits == 0:
            return "Confused", False
        if happy_hits >= 2:
            return "Happy", False
        if happy_hits >= 1 and calm_hits >= 1:
            return "Happy", False
        if calm_hits >= 1:
            return "Calm", False
        return "Calm", False

    def extract_topics(self, user_text: str, assistant_text: str, max_topics: int = 5) -> list[str]:
        """Extract topics using domain vocabulary for meaningful tagging."""
        text = f"{user_text} {assistant_text}".lower()
        matched: Counter[str] = Counter()

        for domain, keywords in self.DOMAIN_TOPICS.items():
            hits = sum(1 for kw in keywords if kw in text)
            if hits > 0:
                matched[domain] += hits

        if matched:
            return [domain for domain, _ in matched.most_common(max_topics)]

        # Fallback to word frequency if no domain matched
        tokens = re.findall(r"[a-zA-Z]{4,}", text)
        stopwords = {
            "that", "this", "with", "have", "your", "from", "they", "them",
            "would", "could", "there", "their", "about", "feel", "today",
            "were", "what", "when", "just", "like", "know", "want", "will",
            "also", "been", "more", "into", "than", "some", "very",
        }
        filtered = [token for token in tokens if token not in stopwords]
        counts = Counter(filtered)
        return [token.title() for token, _ in counts.most_common(max_topics)]
