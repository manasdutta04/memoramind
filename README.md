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
- `WHISPER_MODEL_SIZE` (default: `base`)
- `CORS_ORIGINS` (default: `*`)

## Run Locally

### 1) Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 7860 --reload --app-dir backend
```

### 2) Frontend (dev mode)

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server runs on `5173`, proxied to backend `7860`.

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
