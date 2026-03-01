# HuggingFace Spaces — Backend Deployment
# ----------------------------------------
# Optimised for HF Spaces (Docker SDK, port 7860, no frontend build)

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps: ffmpeg for Whisper audio processing
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --upgrade pip \
    && pip install -r backend/requirements.txt

# Copy backend + data
COPY backend/ ./backend/
COPY .env.example ./.env.example

# Create directories
RUN mkdir -p /app/backend/chroma_db /app/backend/app/data /app/.cache/whisper

ENV PYTHONPATH=/app \
    APP_ENV=production \
    CHROMA_PERSIST_DIR=/app/backend/chroma_db \
    WHISPER_DOWNLOAD_ROOT=/app/.cache/whisper

# HuggingFace Spaces requires port 7860
EXPOSE 7860

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860", "--app-dir", "backend"]

