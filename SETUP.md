# Setup

## Prerequisites

- Python 3.11+
- Node.js 20+
- npm 10+
- ffmpeg (required for voice transcription)

Install ffmpeg:

```bash
# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt-get update && sudo apt-get install -y ffmpeg
```

## 1) Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 7860 --reload --app-dir backend
```

## 2) Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

## Frontend Environment Variables

Set these values in `frontend/.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
NEXT_PUBLIC_API_BASE=http://127.0.0.1:7860
```

## Launch

Open:

- `http://localhost:3000` (frontend)
- `http://127.0.0.1:7860/health` (backend health check)

## Notes

- Users enter their own provider API keys from the app Settings page.
- If voice input fails, text mode remains available in Companion mode.
