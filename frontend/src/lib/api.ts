import type {
  DashboardResponse,
  DemoResponse,
  OnboardPayload,
  OnboardResponse,
  VoiceChatResponse
} from './types';

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
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
      if (
        response.status === 500 &&
        (text.includes('ECONNREFUSED') || text.toLowerCase().includes('proxy error'))
      ) {
        detail =
          'Backend is not reachable on 127.0.0.1:7860. Start FastAPI before using the frontend.';
      }
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

export async function onboard(payload: OnboardPayload): Promise<OnboardResponse> {
  return request<OnboardResponse>('/api/onboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function loadDemo(): Promise<DemoResponse> {
  return request<DemoResponse>('/api/demo/load', { method: 'POST' });
}

export async function chatWithVoice(params: {
  elderId: string;
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

  return request<VoiceChatResponse>('/api/voice/chat', {
    method: 'POST',
    body: form
  });
}

export async function getDashboard(elderId: string): Promise<DashboardResponse> {
  return request<DashboardResponse>(`/api/dashboard/${encodeURIComponent(elderId)}`);
}
