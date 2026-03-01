import type {
  ApiKeys,
  DashboardResponse,
  DemoResponse,
  OnboardPayload,
  OnboardResponse,
  VoiceChatResponse
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:7860';

type RequestConfig = {
  init?: RequestInit;
  keys?: ApiKeys;
};

function withApiHeaders(init: RequestInit = {}, keys?: ApiKeys): RequestInit {
  const headers = new Headers(init.headers ?? {});
  if (keys?.mistralKey?.trim()) {
    headers.set('x-mistral-api-key', keys.mistralKey.trim());
  }
  if (keys?.elevenLabsKey?.trim()) {
    headers.set('x-elevenlabs-api-key', keys.elevenLabsKey.trim());
  }
  return { ...init, headers };
}

async function request<T>(path: string, config: RequestConfig = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, withApiHeaders(config.init, config.keys));

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    const cloned = response.clone();

    try {
      const body = (await cloned.json()) as { detail?: string };
      if (body?.detail) {
        detail = body.detail;
      }
    } catch {
      const text = await cloned.text().catch(() => '');
      if (response.status === 500 && text.toLowerCase().includes('proxy error')) {
        detail = 'Backend is not reachable. Start FastAPI on port 7860.';
      }
    }

    throw new Error(detail);
  }

  return (await response.json()) as T;
}

export async function onboard(payload: OnboardPayload): Promise<OnboardResponse> {
  return request<OnboardResponse>('/api/onboard', {
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  });
}

export async function loadDemo(): Promise<DemoResponse> {
  return request<DemoResponse>('/api/demo/load', { init: { method: 'POST' } });
}

export async function chatWithVoice(params: {
  elderId: string;
  keys: ApiKeys;
  audioBlob?: Blob;
  userText?: string;
}): Promise<VoiceChatResponse> {
  const form = new FormData();
  form.append('elder_id', params.elderId);

  if (params.audioBlob) {
    form.append('audio', params.audioBlob, 'recording.webm');
  }

  if (params.userText?.trim()) {
    form.append('user_text', params.userText.trim());
  }

  // Send keys in form body (HF Spaces strips custom headers)
  if (params.keys?.mistralKey?.trim()) {
    form.append('mistral_key', params.keys.mistralKey.trim());
  }
  if (params.keys?.elevenLabsKey?.trim()) {
    form.append('elevenlabs_key', params.keys.elevenLabsKey.trim());
  }

  return request<VoiceChatResponse>('/api/voice/chat', {
    init: {
      method: 'POST',
      body: form
    },
    keys: params.keys
  });
}

export async function getDashboard(elderId: string, keys: ApiKeys): Promise<DashboardResponse> {
  const params = new URLSearchParams();
  if (keys?.mistralKey?.trim()) {
    params.set('mistral_key', keys.mistralKey.trim());
  }
  const qs = params.toString();
  const path = `/api/dashboard/${encodeURIComponent(elderId)}${qs ? `?${qs}` : ''}`;
  return request<DashboardResponse>(path, { keys });
}
