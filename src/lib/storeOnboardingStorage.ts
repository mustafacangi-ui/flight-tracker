/**
 * Marketing / store-style intro carousel (`/onboarding`).
 * Separate from preference onboarding in `onboardingStorage.ts`.
 */

export const STORE_ONBOARDING_KEY = "rw_store_onboarding_carousel_v1";

export function isStoreOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORE_ONBOARDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function completeStoreOnboarding(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_ONBOARDING_KEY, "1");
    window.dispatchEvent(new Event("rwStoreOnboardingComplete"));
  } catch {
    /* ignore */
  }
}
