---
title: MemoraMind
emoji: 🧠
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
license: mit
---

# MemoraMind — Backend API

Voice-first AI companion for elderly people with dementia or Alzheimer's.

FastAPI backend powering the MemoraMind web app. Frontend is hosted separately on Vercel.

## Environment Variables (set as HF Secrets)

| Variable | Required | Description |
|---|---|---|
| `MISTRAL_API_KEY` | Yes | Your Mistral API key |
| `ELEVENLABS_API_KEY` | No | ElevenLabs key for voice synthesis |
| `CORS_ORIGINS` | Yes | Your Vercel frontend URL (e.g. `https://memoramind.vercel.app`) |
