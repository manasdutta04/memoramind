const ACTIVE_ELDER_KEY = 'memoramind.activeElder';
const PROFILE_KEY_PREFIX = 'memoramind.profile.';

export function setActiveElder(elderId: string): void {
  localStorage.setItem(ACTIVE_ELDER_KEY, elderId);
}

export function getActiveElder(): string | null {
  return localStorage.getItem(ACTIVE_ELDER_KEY);
}

export function saveProfile(elderId: string, profile: Record<string, unknown>): void {
  localStorage.setItem(`${PROFILE_KEY_PREFIX}${elderId}`, JSON.stringify(profile));
}

export function loadProfile(elderId: string): Record<string, unknown> | null {
  const raw = localStorage.getItem(`${PROFILE_KEY_PREFIX}${elderId}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
