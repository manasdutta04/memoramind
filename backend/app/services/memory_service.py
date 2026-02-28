from __future__ import annotations

import math
import re
from collections import Counter
from typing import Any

from app.config import get_settings
from app.services.data_store import JsonDataStore


class MemoryService:
    def __init__(self, data_store: JsonDataStore) -> None:
        self.settings = get_settings()
        self.data_store = data_store

        self._fallback_memory_index: dict[str, list[str]] = {}
        self._chroma_enabled = False
        self._collection = None
        self._embed_model = None

        self._bootstrap_vector_store()

    def _bootstrap_vector_store(self) -> None:
        try:
            import chromadb
            from sentence_transformers import SentenceTransformer

            client = chromadb.PersistentClient(path=self.settings.chroma_persist_dir)
            self._collection = client.get_or_create_collection(
                name=self.settings.memory_collection,
                metadata={"hnsw:space": "cosine"},
            )
            self._embed_model = SentenceTransformer("all-MiniLM-L6-v2")
            self._chroma_enabled = True
        except Exception:
            self._chroma_enabled = False

    def _build_memory_docs(self, profile: dict[str, Any]) -> list[str]:
        docs: list[str] = []
        elder_name = profile.get("elder_name", "You")

        for memory in profile.get("key_memories", []):
            if memory.strip():
                docs.append(f"{elder_name} memory: {memory.strip()}")

        for step in profile.get("daily_routine", []):
            if step.strip():
                docs.append(f"Daily routine: {step.strip()}")

        for topic in profile.get("favorite_topics", []):
            if topic.strip():
                docs.append(f"Favorite topic: {topic.strip()}")

        for family in profile.get("family_members", []):
            name = family.get("name", "")
            relation = family.get("relationship", "")
            if name.strip() and relation.strip():
                docs.append(f"Family detail: {name.strip()} is {elder_name}'s {relation.strip()}.")

        if not docs:
            docs.append(f"{elder_name} enjoys kind conversation and emotional reassurance.")
        return docs

    def upsert_profile(self, elder_id: str, profile: dict[str, Any]) -> None:
        docs = self._build_memory_docs(profile)
        self._fallback_memory_index[elder_id] = docs

        if self._chroma_enabled and self._collection is not None and self._embed_model is not None:
            ids = [f"{elder_id}-{idx}" for idx in range(len(docs))]
            metadatas = [{"elder_id": elder_id, "kind": "memory"} for _ in docs]
            embeddings = self._embed_model.encode(docs).tolist()
            try:
                self._collection.delete(where={"elder_id": elder_id})
            except Exception:
                pass
            self._collection.upsert(
                ids=ids,
                documents=docs,
                metadatas=metadatas,
                embeddings=embeddings,
            )

    def get_profile(self, elder_id: str) -> dict[str, Any] | None:
        return self.data_store.get_profile(elder_id)

    def _score(self, query: str, candidate: str) -> float:
        query_tokens = [t for t in re.findall(r"[a-zA-Z]+", query.lower()) if len(t) > 2]
        cand_tokens = [t for t in re.findall(r"[a-zA-Z]+", candidate.lower()) if len(t) > 2]
        if not query_tokens or not cand_tokens:
            return 0.0
        q_count = Counter(query_tokens)
        c_count = Counter(cand_tokens)
        common = set(q_count).intersection(c_count)
        dot = sum(q_count[t] * c_count[t] for t in common)
        q_norm = math.sqrt(sum(v * v for v in q_count.values()))
        c_norm = math.sqrt(sum(v * v for v in c_count.values()))
        if q_norm == 0 or c_norm == 0:
            return 0.0
        return dot / (q_norm * c_norm)

    def _fallback_retrieve(self, elder_id: str, query: str, limit: int) -> list[str]:
        docs = self._fallback_memory_index.get(elder_id)
        if not docs:
            profile = self.data_store.get_profile(elder_id)
            if profile:
                docs = self._build_memory_docs(profile)
                self._fallback_memory_index[elder_id] = docs
            else:
                docs = []
        ranked = sorted(docs, key=lambda doc: self._score(query, doc), reverse=True)
        selected = [doc for doc in ranked[:limit] if doc]
        return selected or docs[:limit]

    def retrieve_memories(self, elder_id: str, query: str, limit: int = 6) -> list[str]:
        if self._chroma_enabled and self._collection is not None and self._embed_model is not None:
            try:
                query_embedding = self._embed_model.encode([query]).tolist()
                result = self._collection.query(
                    query_embeddings=query_embedding,
                    n_results=limit,
                    where={"elder_id": elder_id},
                )
                docs = (result.get("documents") or [[]])[0]
                if docs:
                    return docs
            except Exception:
                pass
        return self._fallback_retrieve(elder_id, query, limit)
