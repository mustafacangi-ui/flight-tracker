/**
 * Free vs Pro product structure (pre-Stripe). Toggle Pro locally with
 * `localStorage.setItem("flightApp_tier", "premium")` for QA.
 */

import { isFlightTracked, loadTrackedFlightNumbers } from "./flightTrackingStorage";

export const STORAGE_TIER_KEY = "flightApp_tier";

export type SubscriptionTier = "free" | "premium";

export const FREE_TIER = {
  /** Max simultaneously tracked flights (notifications / smart tracking). */
  maxTrackedFlights: 3,
  /** Copy for upgrade surfaces */
  label: "Free",
} as const;

/** Premium capabilities (marketing + future gating). */
export const PREMIUM_FEATURES = [
  "Unlimited tracked flights",
  "Unlimited notifications",
  "Aircraft tail history (deep)",
  "Delay prediction (advanced models)",
  "Weather risk intelligence",
  "Airport traffic intelligence",
  "Family live mode",
  "Premium board themes",
  "Historical flight data",
  "No ads",
] as const;

export const FREE_FEATURES = [
  "Airport search",
  "Departures & arrivals",
  "Board mode",
  "Flight detail page",
  "Family share link",
  "Saved flights",
  "Favorite airports",
  `Limited alerts (up to ${FREE_TIER.maxTrackedFlights} tracked flights)`,
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

/** Whether the user may turn tracking ON for this flight (free tier cap). */
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
