from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.dependencies import (
    get_dashboard_service,
    get_data_store,
    get_memory_service,
    get_voice_service,
)
from app.main import app
from app.services.dashboard_service import DashboardService
from app.services.data_store import JsonDataStore
from app.services.insight_service import InsightService
from app.services.llm_service import LLMService
from app.services.memory_service import MemoryService
from app.services.stt_service import STTService
from app.services.tts_service import TTSService
from app.services.voice_service import VoiceService


def make_test_client(tmp_path: Path) -> TestClient:
    data_store = JsonDataStore(tmp_path / "profiles.json", tmp_path / "conversations.json")
    memory_service = MemoryService(data_store)
    llm_service = LLMService()

    voice_service = VoiceService(
        data_store=data_store,
        memory_service=memory_service,
        llm_service=llm_service,
        stt_service=STTService(),
        tts_service=TTSService(),
        insight_service=InsightService(),
    )
    dashboard_service = DashboardService(data_store=data_store, llm_service=llm_service)

    app.dependency_overrides[get_data_store] = lambda: data_store
    app.dependency_overrides[get_memory_service] = lambda: memory_service
    app.dependency_overrides[get_voice_service] = lambda: voice_service
    app.dependency_overrides[get_dashboard_service] = lambda: dashboard_service

    return TestClient(app)


def test_health(tmp_path: Path):
    client = make_test_client(tmp_path)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_demo_voice_dashboard_flow(tmp_path: Path):
    client = make_test_client(tmp_path)

    demo_response = client.post("/api/demo/load")
    assert demo_response.status_code == 200
    elder_id = demo_response.json()["elder_id"]

    chat_response = client.post(
        "/api/voice/chat",
        data={"elder_id": elder_id, "user_text": "I miss my son today"},
    )
    assert chat_response.status_code == 200
    payload = chat_response.json()
    assert payload["assistant_text"]
    assert payload["elder_id"] == elder_id

    dashboard_response = client.get(f"/api/dashboard/{elder_id}")
    assert dashboard_response.status_code == 200
    dashboard = dashboard_response.json()
    assert dashboard["elder_name"] == "Ramesh"
    assert "summary" in dashboard


def test_onboarding(tmp_path: Path):
    client = make_test_client(tmp_path)

    onboard_response = client.post(
        "/api/onboard",
        json={
            "elder_name": "Asha",
            "age": 68,
            "language": "English",
            "family_members": [{"name": "Neha", "relationship": "daughter"}],
            "key_memories": ["Loved gardening in Bengaluru"],
            "daily_routine": ["Tea at 7 am"],
            "favorite_topics": ["flowers"],
        },
    )

    assert onboard_response.status_code == 200
    elder_id = onboard_response.json()["elder_id"]
    assert elder_id.startswith("elder-")
