import type { ApiKeys } from './types';

const ACTIVE_ELDER_KEY = 'memoramind.activeElder';
const PROFILE_KEY_PREFIX = 'memoramind.profile.';
const ELDER_REGISTRY = 'memoramind.elders';
const API_KEYS = 'memoramind.apiKeys';

export interface ElderEntry {
  elderId: string;
  name: string;
  age: number;
  language: string;
  addedAt: string; // ISO date
}

/* ---- Elder Registry ---- */

export function getAllElders(): ElderEntry[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(ELDER_REGISTRY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ElderEntry[];
  } catch {
    return [];
  }
}

export function registerElder(entry: ElderEntry): void {
  if (typeof window === 'undefined') return;
  const elders = getAllElders().filter((e) => e.elderId !== entry.elderId);
  elders.push(entry);
  localStorage.setItem(ELDER_REGISTRY, JSON.stringify(elders));
}

export function removeElder(elderId: string): void {
  if (typeof window === 'undefined') return;
  const elders = getAllElders().filter((e) => e.elderId !== elderId);
  localStorage.setItem(ELDER_REGISTRY, JSON.stringify(elders));
  localStorage.removeItem(`${PROFILE_KEY_PREFIX}${elderId}`);
  // Clear active if removed
  if (getActiveElder() === elderId) {
    localStorage.removeItem(ACTIVE_ELDER_KEY);
  }
}

/* ---- Active Elder ---- */

export function setActiveElder(elderId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_ELDER_KEY, elderId);
}

export function getActiveElder(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_ELDER_KEY);
}

/* ---- Profiles ---- */

export function saveProfile(elderId: string, profile: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${PROFILE_KEY_PREFIX}${elderId}`, JSON.stringify(profile));
}

export function loadProfile(elderId: string): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(`${PROFILE_KEY_PREFIX}${elderId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/* ---- API Keys ---- */

export function saveApiKeys(payload: ApiKeys): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(API_KEYS, JSON.stringify(payload));
}

export function loadApiKeys(): ApiKeys {
  if (typeof window === 'undefined') return { mistralKey: '', elevenLabsKey: '' };
  const raw = localStorage.getItem(API_KEYS);
  if (!raw) return { mistralKey: '', elevenLabsKey: '' };
  try {
    const parsed = JSON.parse(raw) as Partial<ApiKeys>;
    return {
      mistralKey: parsed.mistralKey?.trim() ?? '',
      elevenLabsKey: parsed.elevenLabsKey?.trim() ?? ''
    };
  } catch {
    return { mistralKey: '', elevenLabsKey: '' };
  }
}
