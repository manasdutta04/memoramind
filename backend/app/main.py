from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
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
    voice_service: VoiceService = Depends(get_voice_service),
) -> VoiceChatResponse:
    if not audio and not (user_text and user_text.strip()):
        raise HTTPException(status_code=400, detail="Either audio file or user_text must be provided")

    try:
        audio_bytes = await audio.read() if audio else None
        result = await voice_service.run_chat(
            elder_id=elder_id,
            audio_bytes=audio_bytes,
            audio_filename=audio.filename if audio else None,
            user_text_override=user_text,
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
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> DashboardResponse:
    try:
        response = await dashboard_service.get_dashboard(elder_id)
        return DashboardResponse(**response)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


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
