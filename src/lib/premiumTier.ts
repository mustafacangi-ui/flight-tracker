/**
 * Free vs Premium. Client tier: `localStorage` + Supabase metadata sync (see premiumSyncClient).
 * QA: `localStorage.setItem("flightApp_tier", "premium")` or use upgrade modal.
 */

import { isFlightTracked, loadTrackedFlightNumbers } from "./flightTrackingStorage";

export const STORAGE_TIER_KEY = "flightApp_tier";

/** Fired when tier may have changed (same-tab listeners). */
export const PREMIUM_TIER_UPDATED_EVENT = "routewings-premium-tier-changed";

export function dispatchPremiumTierUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PREMIUM_TIER_UPDATED_EVENT));
}

export type SubscriptionTier = "free" | "premium";

export const FREE_TIER = {
  /** Local smart tracking + aligned cap with push-tracked flights. */
  maxTrackedFlights: 3,
  maxSavedFlights: 3,
  label: "Free",
} as const;

export const PREMIUM_MODAL_FEATURES = [
  "Unlimited saved flights",
  "Push notifications",
  "Family tracking",
  "Live flight map",
  "Gate and terminal updates",
  "Flight history",
  "Airport operational alerts",
] as const;

/** Marketing list (broader product story). */
export const PREMIUM_FEATURES = [
  ...PREMIUM_MODAL_FEATURES,
  "Aircraft tail intelligence",
  "Delay risk insights",
  "Premium aviation themes",
] as const;

export const FREE_FEATURES = [
  "Airport search",
  "Departures & arrivals",
  "Board mode",
  "Flight detail page",
  "Public family share page",
  `Up to ${FREE_TIER.maxSavedFlights} saved flights`,
  `Up to ${FREE_TIER.maxTrackedFlights} push-tracked flights`,
  "Favorite airports",
] as const;

export function getSubscriptionTier(): SubscriptionTier {
  if (typeof window === "undefined") return "free";
  try {
    const v = localStorage.getItem(STORAGE_TIER_KEY)?.trim().toLowerCase();
    return v === "premium" || v === "pro" ? "premium" : "free";
  } catch {
    return "free";
  }
}

export function isPremiumUser(): boolean {
  return getSubscriptionTier() === "premium";
}

/** Whether the user may turn local smart tracking ON for this flight (free tier cap). */
export function canEnableTrackingForFlight(flightNumber: string): boolean {
  if (isPremiumUser()) return true;
  if (isFlightTracked(flightNumber)) return true;
  return loadTrackedFlightNumbers().length < FREE_TIER.maxTrackedFlights;
}

export function trackedFlightsRemainingFree(): number {
  if (isPremiumUser()) return Infinity;
  return Math.max(
    0,
    FREE_TIER.maxTrackedFlights - loadTrackedFlightNumbers().length
  );
}

export function canAddSavedFlight(
  savedCount: number,
  flightAlreadySaved: boolean
): boolean {
  if (isPremiumUser()) return true;
  if (flightAlreadySaved) return true;
  return savedCount < FREE_TIER.maxSavedFlights;
}

export function savedFlightsRemainingFree(savedCount: number): number {
  if (isPremiumUser()) return Infinity;
  return Math.max(0, FREE_TIER.maxSavedFlights - savedCount);
}

export function canUseLiveFlightMap(): boolean {
  return isPremiumUser();
}

export function canUseLiveTrackDeepLink(): boolean {
  return isPremiumUser();
}

export function canCreatePrivateFamilyLink(): boolean {
  return isPremiumUser();
}
