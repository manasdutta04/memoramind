from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any


class JsonDataStore:
    def __init__(self, profiles_path: Path, conversations_path: Path) -> None:
        self.profiles_path = profiles_path
        self.conversations_path = conversations_path
        self._lock = Lock()
        self._ensure_files()

    def _ensure_files(self) -> None:
        self.profiles_path.parent.mkdir(parents=True, exist_ok=True)
        for path in (self.profiles_path, self.conversations_path):
            if not path.exists():
                path.write_text("{}", encoding="utf-8")

    def _read_json(self, path: Path) -> dict[str, Any]:
        try:
            return json.loads(path.read_text(encoding="utf-8") or "{}")
        except json.JSONDecodeError:
            return {}

    def _write_json(self, path: Path, payload: dict[str, Any]) -> None:
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def save_profile(self, elder_id: str, profile: dict[str, Any]) -> None:
        with self._lock:
            profiles = self._read_json(self.profiles_path)
            now = datetime.now(timezone.utc).isoformat()
            existing = profiles.get(elder_id, {})
            profile["created_at"] = existing.get("created_at", now)
            profile["updated_at"] = now
            profiles[elder_id] = profile
            self._write_json(self.profiles_path, profiles)

    def get_profile(self, elder_id: str) -> dict[str, Any] | None:
        with self._lock:
            return self._read_json(self.profiles_path).get(elder_id)

    def list_profiles(self) -> dict[str, Any]:
        with self._lock:
            return self._read_json(self.profiles_path)

    def append_conversation(self, elder_id: str, entry: dict[str, Any]) -> None:
        with self._lock:
            conversations = self._read_json(self.conversations_path)
            rows = conversations.get(elder_id, [])
            rows.append(entry)
            conversations[elder_id] = rows
            self._write_json(self.conversations_path, conversations)

    def get_conversations(self, elder_id: str) -> list[dict[str, Any]]:
        with self._lock:
            return self._read_json(self.conversations_path).get(elder_id, [])
