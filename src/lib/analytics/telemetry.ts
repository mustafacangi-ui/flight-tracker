/**
 * Product analytics (PostHog). Safe no-op when NEXT_PUBLIC_POSTHOG_KEY is unset.
 * Never pass raw email, tokens, or PII — use user_id only via identify().
 *
 * Server-side Stripe failures: track with PostHog server SDK or ingest later; not wired here.
 */

import posthog from "posthog-js";

/** Named events (Phase 1). */
export const AnalyticsEvents = {
  // Auth
  login_started: "login_started",
  login_success: "login_success",
  google_login_clicked: "google_login_clicked",
  apple_login_clicked: "apple_login_clicked",
  magic_link_requested: "magic_link_requested",
  // Premium
  premium_modal_opened: "premium_modal_opened",
  premium_checkout_started: "premium_checkout_started",
  premium_checkout_success: "premium_checkout_success",
  premium_page_viewed: "premium_page_viewed",
  premium_feature_blocked: "premium_feature_blocked",
  // Flights
  flight_saved: "flight_saved",
  flight_unsaved: "flight_unsaved",
  flight_tracked: "flight_tracked",
  family_share_clicked: "family_share_clicked",
  family_link_created: "family_link_created",
  live_track_clicked: "live_track_clicked",
  live_track_page_viewed: "live_track_page_viewed",
  live_radar_loaded: "live_radar_loaded",
  live_radar_fallback_used: "live_radar_fallback_used",
  push_notifications_enabled: "push_notifications_enabled",
  notification_preferences_saved: "notification_preferences_saved",
  // PWA
  pwa_install_prompt_shown: "pwa_install_prompt_shown",
  pwa_install_clicked: "pwa_install_clicked",
  pwa_install_success: "pwa_install_success",
  // Stripe (client-visible)
  stripe_checkout_started: "stripe_checkout_started",
  stripe_checkout_completed: "stripe_checkout_completed",
  stripe_payment_failed: "stripe_payment_failed",
  // Page shells
  home_page_viewed: "home_page_viewed",
  saved_flights_page_viewed: "saved_flights_page_viewed",
  family_page_viewed: "family_page_viewed",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

const EMAIL_LIKE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

let initialized = false;

function sanitizeProps(
  props: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!props) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    const keyLower = k.toLowerCase();
    if (
      keyLower.includes("password") ||
      keyLower.includes("token") ||
      keyLower === "authorization" ||
      keyLower === "email"
    ) {
      continue;
    }
    if (typeof v === "string" && EMAIL_LIKE.test(v)) {
      continue;
    }
    out[k] = v;
  }
  return out;
}

export function initTelemetry(): void {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
  if (!key) return;
  if (initialized) return;
  initialized = true;
  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: false,
    persistence: "localStorage+cookie",
  });
}

export function trackProductEvent(
  name: AnalyticsEventName,
  props?: Record<string, unknown>
): void {
  const safe = sanitizeProps(props);
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] tracked event: ${name}`, safe);
  }
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return;
  if (!initialized) initTelemetry();
  posthog.capture(name, safe);
}

export function identifyAnalyticsUser(userId: string | null | undefined): void {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return;
  if (!initialized) initTelemetry();
  if (userId) {
    posthog.identify(userId);
  } else {
    posthog.reset();
  }
}
