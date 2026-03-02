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

<div align="center">
  <img src="./frontend/public/favicon.ico" width="100" alt="MemoraMind Logo" />
  <h1>MemoraMind</h1>
  <p><strong>Voice-First dementia companion powered by Mistral AI</strong></p>
  <p><i>Built for the Mistral Worldwide Hackathon 2026</i></p>
</div>

---

## 🏆 The Problem & Our Solution
Dementia isolates individuals by stealing their context. Loving someone with dementia often means constant worry and overwhelming caregiver burnout. 

**MemoraMind** restores context by weaving highly personal memories into natural, emotionally resonant conversations. It gives older adults a warm, patient companion that *remembers who they are*, while giving family members peace of mind through a live **Cognitive Health Dashboard**.

## 🧠 Deep Mistral Integration (Architecture)

We went beyond basic chat to showcase the full power of Mistral's API capabilities:

### 1. Mistral Function Calling ➔ Cognitive Journal
We implemented a novel **Cognitive Health Journal**. Mistral analyzes the raw transcripts of the elder's daily conversations and autonomously extracts structured clinical data: `emotional_summary`, `flagged_moments`, `positive_anchors`, and an overall `cognitive_score`. This transforms raw chat logs into actionable healthcare insights.

### 2. Autonomous Tool Execution ➔ Distress Interceptor
The LLM evaluates every single utterance in real-time. If the elder expresses severe physical or emotional distress ("I fell down", "I'm scared"), Mistral autonomously executes a `trigger_emergency_alert` tool, immediately pushing a pulsing red alert overlay to the Family Dashboard for rapid intervention.

### 3. Dynamic Prompt Engineering ➔ Memory Injection
We utilize a RAG-style approach to prompt construction. The system prompt is dynamically assembled with the elder's name, core life memories, daily routines, and family relationships, grounding the AI in the elder's specific reality and preventing standard AI hallucinations.

## 🎵 Best Voice UX (ElevenLabs)
Voice is the only interface that works naturally for dementia care. 
- **Premium TTS:** We integrated ElevenLabs for hyper-realistic, warm, human-like voice synthesis.
- **Visual Feedback:** The companion UI features an animated audio waveform that pulses synchronously while ElevenLabs audio is playing, giving the elder clear visual feedback that *"MemoraMind is speaking."*

## 🚀 Product Walkthrough

1. **Family Setup (Zero Friction):** Family inputs memories, routines, and relationships. Stored entirely locally (no accounts needed).
2. **The Companion:** A massive, accessible "Speak" circular button. The elder speaks naturally; MemoraMind responds with kindness, validates feelings, and grounds them in personal facts.
3. **The Family Dashboard:** A rich daily digest providing:
    - The Mistral-generated **Cognitive Journal**
    - A visual Mood Timeline
    - Real-time Distress Alerts
    - Full conversation logs

## ⚙️ Tech Stack

* **LLM Engine**: Mistral Models API (function calling & chat completions)
* **Text-to-Speech**: ElevenLabs (with Edge-TTS fallback)
* **Frontend**: Next.js 15, React, Tailwind CSS, Framer Motion (Brutalist accessible design)
* **Backend**: FastAPI (Python)
* **Storage**: Client-side LocalStorage (Privacy-first)

## 🏃‍♂️ Run it Locally

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- A Mistral API Key

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --port 7860
```

### Frontend Setup
```bash
cd frontend
npm install

# Start the Next.js development server
npm run dev
```

Visit `http://localhost:3000`. Provide your API keys in the app via the **Settings** or when prompted.
Click **"Try Demo"** on the home page to instantly load a realistic preset profile and see the family dashboard in action.

---
<div align="center">
  <i>Every memory matters. Built with care by <a href="https://github.com/manasdutta04">Manas Dutta</a>.</i>
</div>
