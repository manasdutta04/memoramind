---
title: MemoraMind
emoji: 🧠
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
---

# MemoraMind

MemoraMind is a voice-first AI companion for elderly people with dementia or Alzheimer's. Families onboard personal memories and routines. The elder then talks naturally with a warm AI companion that retrieves relevant memories, responds empathetically, and speaks aloud. Family members can monitor daily emotional signals from a dashboard.

## Features

- Voice conversation flow: MediaRecorder -> Whisper -> Chroma retrieval -> Mistral response -> ElevenLabs TTS
- Judge-ready demo mode (`Ramesh`, `Arjun`, `Priya`) available instantly from landing page
- Elder-friendly companion screen with large text, one giant mic button, and clear interaction states
- Family dashboard with daily summary, mood signal, topics, and distress alerts
- ElevenLabs TTS fallback to browser `speechSynthesis` when TTS API fails
- Single-container deployment: FastAPI serves both APIs and React static build on port `7860`

## Stack

- Frontend: React, Tailwind CSS, Framer Motion, React Router
- Backend: FastAPI
- LLM: Mistral API (`mistral-large-latest`)
- Memory: ChromaDB + sentence-transformers (`all-MiniLM-L6-v2`)
- STT: local Whisper
- TTS: ElevenLabs API
- Fine-tuning deliverables: `finetune.py` + `job.yaml` (TRL SFTTrainer)

## Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── models.py
│   │   ├── dependencies.py
│   │   ├── data/demo_profile.json
│   │   └── services/
│   └── tests/test_api.py
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   └── tests/demo-flow.test.tsx
├── finetune.py
├── job.yaml
├── Dockerfile
└── README.md
```

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Required for full functionality:

- `MISTRAL_API_KEY`
- `ELEVENLABS_API_KEY`

Optional:

- `MISTRAL_MODEL` (default: `mistral-large-latest`)
- `MISTRAL_API_BASE` (default: `https://api.mistral.ai/v1`)
- `MISTRAL_VERIFY_SSL` (default: `true`)
- `MISTRAL_CA_BUNDLE` (optional path to custom CA bundle for corporate TLS)
- `WHISPER_MODEL_SIZE` (default: `base`)
- `WHISPER_DOWNLOAD_ROOT` (default: `.cache/whisper`)
- `WHISPER_INSECURE_DOWNLOAD` (default: `false`, local development only)
- `CORS_ORIGINS` (default: `*`)

## Run Locally

### 1) Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 7860 --reload --app-dir backend
```

### 2) Frontend (dev mode)

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server runs on `5173`, proxied to backend `7860`.

Quick backend check before using the UI:

```bash
curl http://127.0.0.1:7860/health
```

You should get a JSON response like `{\"status\":\"ok\",\"app\":\"MemoraMind\"}`.

## Production / HuggingFace Space (Single Container)

Use Docker Space with this repository and `Dockerfile`.

Container flow:

1. Installs Python + Node + FFmpeg
2. Installs backend dependencies
3. Builds React into `frontend/dist`
4. Starts FastAPI on `7860`
5. FastAPI serves API + static React build from one process

## API Endpoints

- `GET /health`
- `POST /api/onboard`
- `POST /api/demo/load`
- `POST /api/voice/chat`
  - multipart form fields:
    - `elder_id` (required)
    - `audio` (optional file)
    - `user_text` (optional string for reliability/testing)
- `GET /api/dashboard/{elder_id}`

## Demo Mode

Landing page `Try Demo` triggers `POST /api/demo/load` and preloads:

- Elder: `Ramesh`
- Son: `Arjun`
- Daughter: `Priya`

with seeded memories/routine and initial dashboard signals.

## Tests

Backend tests:

```bash
pytest -c backend/pytest.ini backend/tests
```

Frontend test:

```bash
cd frontend
npm test
```

## Fine-Tuning (TRL)

`finetune.py` builds empathetic instruction-style training text from the HuggingFace `empathetic_dialogues` dataset and trains with LoRA using `SFTTrainer`.

Local example:

```bash
pip install -r requirements-finetune.txt
python finetune.py --model_name mistralai/Mistral-7B-Instruct-v0.3 --output_dir ./artifacts/memoramind-sft
```

HF Jobs example:

```bash
hf jobs run job.yaml
```

Artifacts are saved to the configured output path (adapter/model + tokenizer).

## Notes

- If ElevenLabs synthesis fails, frontend falls back to browser speech synthesis automatically.
- Whisper uses local model inference and requires FFmpeg.
- India dementia stat shown in UI: "~8.8 million" with source note "Alzheimer’s Disease International (India estimate), 2024".

## Troubleshooting

- `vite http proxy error ... ECONNREFUSED` means backend is not running on `127.0.0.1:7860`.
- `Request failed (500)` in frontend during local dev usually comes from Vite proxy when backend is down.
- If backend exits on startup, reinstall deps in your venv:
  - `pip install -r requirements.txt`
- `SSL: CERTIFICATE_VERIFY_FAILED` during Whisper load means model download is blocked by your network cert chain.
  - Use companion text input mode immediately (already built in UI).
  - Preferred fix: ensure system/Python trust store includes your corporate CA and retry.
  - Alternative: pre-download Whisper model files in `WHISPER_DOWNLOAD_ROOT`.
  - Last-resort local workaround: set `WHISPER_INSECURE_DOWNLOAD=true` in `.env` (do not use in production).
- `Speech transcription failed: ... ffmpeg` means ffmpeg is missing on your machine.
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt-get install -y ffmpeg`
  - Then restart backend: `python3 -m uvicorn app.main:app --host 0.0.0.0 --port 7860 --reload --app-dir backend`
- If replies keep looking like local fallback (and not Mistral-quality responses), check backend logs for:
  - `Mistral generation failed; using local fallback: ...`
  - Common causes: invalid `MISTRAL_API_KEY`, SSL interception, or blocked outbound access.
  - For SSL interception, set `MISTRAL_CA_BUNDLE=/path/to/corp-ca.pem` (preferred) or `MISTRAL_VERIFY_SSL=false` for local-only debugging.
