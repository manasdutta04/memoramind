# MemoraMind

MemoraMind is a highly personalized voice companion designed specifically for memory care.

It helps older adults feel calm, recognized, and emotionally supported through natural voice conversations. Meanwhile, it gives families a powerful, zero-setup dashboard to monitor mood, detect distress, and track daily routines—all stored securely and instantly in the browser.

Built for the **Mistral 2026 Hackathon**.

![MemoraMind Demo](./frontend/public/demo-screenshot.png) *(Preview of the Family Hub & Companion)*

## ✨ What Makes MemoraMind Unique?

MemoraMind goes beyond standard chatbots by integrating proven dementia care principles directly into the LLM system prompt and application architecture:

1. **🚨 Real-Time Distress Alerts**: Analyzes every conversation for signs of anxiety or confusion, surfacing a pulsing alert on the Family Dashboard to enable rapid intervention.
2. **🎵 Prescriptive Music Therapy**: The AI is instructed to suggest listening to favorite songs or humming familiar tunes when distress is detected, a proven technique to reduce anxiety in dementia patients.
3. **💊 Proactive Gentle Reminders**: Naturally weaves routine items (like taking medicine or drinking tea) into casual conversation rather than issuing harsh, confusing commands.
4. **📊 Visual Mood Timeline**: Evaluates the emotional sentiment of every interaction, rendering a beautiful color-coded timeline to help families track emotional trends over time.
5. **👨‍👩‍👧‍👦 Multi-Elder Care Hub**: A centralized family dashboard allowing caregivers to manage profiles for multiple loved ones seamlessly in one place.

## 🚀 Product Experience

### 1. Zero-Friction Setup
Families create a profile with important context: relationship names, meaningful life memories, daily routines, and favorite topics. **No accounts required**—everything is saved instantly to local storage.

### 2. The One-Button Companion
The elder interacts with a massive, accessible "Speak" circular button. 
MemoraMind listens, responds with kindness, keeps sentences short, validates feelings, and grounds the elder in deeply personal facts.

### 3. The Caregiver Dashboard
A rich daily digest providing:
- Session summaries and conversation frequency.
- The Mood Timeline chart.
- Key recurring topics.
- Full conversation logs with distress highlights.

## ⚙️ How It Works (Tech Stack)

* **LLM Engine**: Custom-prompted **Mistral** models (via Hugging Face API or local Mistral endpoints).
* **Text-to-Speech (TTS)**: Hybrid architecture prioritizing high-quality Voice AI (like ElevenLabs when keys are provided) but falling back reliably to free, limitless Edge-TTS.
* **Frontend**: Next.js 15, React, Tailwind CSS, Framer Motion for brutalist/high-contrast accessibility.
* **Backend**: FastAPI (Python) managing prompt assembly, TTS generation, and memory injection.
* **Storage**: 100% Client-side LocalStorage for absolute privacy and frictionless onboarding.

## 🏃‍♂️ Getting Started

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

Visit `http://localhost:3000` to start using MemoraMind. Provide your Mistral API key in the **Voice Settings** page. 

## 🔗 Links

- **Repository**: [https://github.com/manasdutta04/memoramind](https://github.com/manasdutta04/memoramind)

---
*Every memory matters. Built with care.*
