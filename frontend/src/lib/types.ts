export type FamilyMember = {
  name: string;
  relationship: string;
};

export type OnboardPayload = {
  elder_name: string;
  age: number;
  language: string;
  family_members: FamilyMember[];
  key_memories: string[];
  daily_routine: string[];
  favorite_topics: string[];
};

export type OnboardResponse = {
  elder_id: string;
  message: string;
};

export type DemoResponse = {
  elder_id: string;
  profile: Record<string, unknown>;
};

export type VoiceChatResponse = {
  elder_id: string;
  transcript: string;
  assistant_text: string;
  mood: string;
  distress: boolean;
  topics: string[];
  tts_fallback: boolean;
  llm_fallback?: boolean;
  llm_error?: string | null;
  audio_base64: string | null;
  audio_mime_type: string | null;
};

export type DashboardResponse = {
  elder_id: string;
  elder_name: string;
  summary: string;
  mood: string;
  topics: string[];
  distress_alerts: string[];
  sessions_today: number;
};

export type ApiKeys = {
  mistralKey: string;
  elevenLabsKey: string;
};
