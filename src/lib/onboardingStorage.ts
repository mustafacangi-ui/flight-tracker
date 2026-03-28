/**
 * First-run RouteWings onboarding (client-only).
 */

export const ONBOARDING_STORAGE_KEY = "flightApp_routeWingsOnboardingV1";

export type OnboardingPreferences = {
  goals: string[];
  airports: string[];
  notifications: string[];
};

export type OnboardingRecord = OnboardingPreferences & {
  version: 1;
  completed: true;
  completedAt: number;
};

export function loadOnboardingRecord(): OnboardingRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<OnboardingRecord>;
    if (p?.completed !== true || p.version !== 1) return null;
    return p as OnboardingRecord;
  } catch {
    return null;
  }
}

export function isOnboardingComplete(): boolean {
  return loadOnboardingRecord() != null;
}

export function saveOnboardingComplete(prefs: OnboardingPreferences): void {
  if (typeof window === "undefined") return;
  const record: OnboardingRecord = {
    version: 1,
    completed: true,
    completedAt: Date.now(),
    goals: [...prefs.goals],
    airports: [...prefs.airports],
    notifications: [...prefs.notifications],
  };
  localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new Event("routeWingsOnboardingComplete"));
}
