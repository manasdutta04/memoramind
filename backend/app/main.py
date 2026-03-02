from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import FRONTEND_DIST_DIR, ROOT_DIR, get_settings
from app.dependencies import (
    get_dashboard_service,
    get_data_store,
    get_memory_service,
    get_voice_service,
)
from app.models import (
    CognitiveJournalResponse,
    DashboardResponse,
    DemoLoadResponse,
    ErrorResponse,
    OnboardRequest,
    OnboardResponse,
    VoiceChatResponse,
)
from app.services.dashboard_service import DashboardService
from app.services.data_store import JsonDataStore
from app.services.memory_service import MemoryService
from app.services.voice_service import VoiceService

settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0")

# Startup diagnostics — test ElevenLabs key
import os as _os, urllib.request, urllib.error, json as _json

_el_key = settings.elevenlabs_api_key
_raw_el = _os.getenv("ELEVENLABS_API_KEY", "")
print(f"[STARTUP] ELEVENLABS raw_len={len(_raw_el)} cleaned_len={len(_el_key)}")

if _el_key:
    try:
        _test_url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.elevenlabs_voice_id}"
        _test_data = _json.dumps({"text": "test", "model_id": settings.elevenlabs_model_id}).encode()
        _test_req = urllib.request.Request(
            _test_url,
            data=_test_data,
            headers={"xi-api-key": _el_key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
        )
        _test_resp = urllib.request.urlopen(_test_req)
        print(f"[STARTUP] ElevenLabs TEST: SUCCESS status={_test_resp.status} size={len(_test_resp.read())} bytes")
    except urllib.error.HTTPError as _e:
        _body = _e.read().decode("utf-8", errors="replace")
        print(f"[STARTUP] ElevenLabs TEST: FAILED status={_e.code} body={_body}")
    except Exception as _e:
        print(f"[STARTUP] ElevenLabs TEST: ERROR {_e}")
else:
    print("[STARTUP] ELEVENLABS_API_KEY is EMPTY — skipping test")

_mi_key = settings.mistral_api_key
print(f"[STARTUP] MISTRAL_API_KEY set: {bool(_mi_key)}, length: {len(_mi_key)}") if _mi_key else print("[STARTUP] MISTRAL_API_KEY is EMPTY")


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.cors_origins_list != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(_request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name}


@app.post(
    "/api/onboard",
    response_model=OnboardResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def onboard_profile(
    payload: OnboardRequest,
    data_store: JsonDataStore = Depends(get_data_store),
    memory_service: MemoryService = Depends(get_memory_service),
) -> OnboardResponse:
    elder_id = payload.elder_id or f"elder-{uuid4().hex[:10]}"
    profile = payload.model_dump()
    profile["elder_id"] = elder_id

    data_store.save_profile(elder_id, profile)
    memory_service.upsert_profile(elder_id, profile)

    return OnboardResponse(
        elder_id=elder_id,
        message="Profile saved and memory embeddings indexed successfully.",
    )


@app.post(
    "/api/demo/load",
    response_model=DemoLoadResponse,
    responses={500: {"model": ErrorResponse}},
)
async def load_demo(
    data_store: JsonDataStore = Depends(get_data_store),
    memory_service: MemoryService = Depends(get_memory_service),
) -> DemoLoadResponse:
    demo_path = ROOT_DIR / "backend" / "app" / "data" / "demo_profile.json"
    profile = json.loads(demo_path.read_text(encoding="utf-8"))
    elder_id = profile["elder_id"]

    data_store.save_profile(elder_id, profile)
    memory_service.upsert_profile(elder_id, profile)

    demo_conversations = data_store.get_conversations(elder_id)
    today = datetime.now(timezone.utc).date().isoformat()
    has_today_rows = any(str(row.get("timestamp", "")).startswith(today) for row in demo_conversations)
    if not has_today_rows:
        base_time = datetime.now(timezone.utc).replace(second=0, microsecond=0)
        data_store.append_conversation(
            elder_id,
            {
                "timestamp": base_time.isoformat(),
                "user_text": "I was feeling a bit lost this morning.",
                "assistant_text": "I am here with you, Ramesh. You always found calm with music and family memories. Would you like to call Arjun after tea?",
                "mood": "Distressed",
                "distress": True,
                "topics": ["Music", "Family", "Tea"],
            },
        )
        data_store.append_conversation(
            elder_id,
            {
                "timestamp": (base_time + timedelta(minutes=90)).isoformat(),
                "user_text": "Tell me about Marine Drive days.",
                "assistant_text": "Those Sunday evenings at Marine Drive with your family sound beautiful. You built so many warm traditions together.",
                "mood": "Calm",
                "distress": False,
                "topics": ["Marine", "Family", "Mumbai"],
            },
        )

    return DemoLoadResponse(elder_id=elder_id, profile=profile)


@app.post(
    "/api/voice/chat",
    response_model=VoiceChatResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def voice_chat(
    elder_id: str = Form(...),
    audio: UploadFile | None = File(default=None),
    user_text: str | None = Form(default=None),
    mistral_key: str | None = Form(default=None),
    elevenlabs_key: str | None = Form(default=None),
    mistral_api_key: str | None = Header(default=None, alias="x-mistral-api-key"),
    elevenlabs_api_key: str | None = Header(default=None, alias="x-elevenlabs-api-key"),
    voice_service: VoiceService = Depends(get_voice_service),
) -> VoiceChatResponse:
    if not audio and not (user_text and user_text.strip()):
        raise HTTPException(status_code=400, detail="Either audio file or user_text must be provided")

    # Prefer form body keys (work through HF Spaces proxy), fall back to headers
    resolved_mistral = (mistral_key or "").strip() or (mistral_api_key or "").strip() or None
    resolved_elevenlabs = (elevenlabs_key or "").strip() or (elevenlabs_api_key or "").strip() or None

    try:
        audio_bytes = await audio.read() if audio else None
        result = await voice_service.run_chat(
            elder_id=elder_id,
            audio_bytes=audio_bytes,
            audio_filename=audio.filename if audio else None,
            user_text_override=user_text,
            mistral_api_key=resolved_mistral,
            elevenlabs_api_key=resolved_elevenlabs,
        )
        return VoiceChatResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get(
    "/api/dashboard/{elder_id}",
    response_model=DashboardResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_dashboard(
    elder_id: str,
    mistral_key: str | None = Query(default=None),
    mistral_api_key: str | None = Header(default=None, alias="x-mistral-api-key"),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> DashboardResponse:
    resolved_key = (mistral_key or "").strip() or (mistral_api_key or "").strip() or None
    try:
        response = await dashboard_service.get_dashboard(
            elder_id=elder_id,
            mistral_api_key=resolved_key,
        )
        return DashboardResponse(**response)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get(
    "/api/journal/{elder_id}",
    response_model=CognitiveJournalResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_cognitive_journal(
    elder_id: str,
    mistral_key: str | None = Query(default=None),
    mistral_api_key: str | None = Header(default=None, alias="x-mistral-api-key"),
    data_store: JsonDataStore = Depends(get_data_store),
) -> CognitiveJournalResponse:
    from app.services.llm_service import LLMService

    profile = data_store.get_profile(elder_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Elder '{elder_id}' not found")

    resolved_key = (mistral_key or "").strip() or (mistral_api_key or "").strip() or None

    elder_name = profile.get("elder_name", "Friend")
    language = profile.get("language", "English")

    conversations = data_store.get_conversations(elder_id)
    today = datetime.now(timezone.utc).date().isoformat()
    today_convos = [c for c in conversations if str(c.get("timestamp", "")).startswith(today)]

    llm = LLMService()
    journal = await llm.generate_cognitive_journal(
        elder_name=elder_name,
        language=language,
        conversations=today_convos,
        api_key_override=resolved_key,
    )

    return CognitiveJournalResponse(
        elder_id=elder_id,
        elder_name=elder_name,
        date=today,
        emotional_summary=journal.get("emotional_summary", ""),
        flagged_moments=journal.get("flagged_moments", []),
        positive_anchors=journal.get("positive_anchors", []),
        recommended_actions=journal.get("recommended_actions", []),
        cognitive_score=journal.get("cognitive_score", 5),
        engagements=journal.get("engagements", len(today_convos)),
    )


def _configure_static_serving() -> None:
    dist = Path(FRONTEND_DIST_DIR)
    if not dist.exists():
        return

    assets_dir = dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path == "health":
            raise HTTPException(status_code=404, detail="Not found")
        index_path = dist / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="Frontend build not found")


_configure_static_serving()
