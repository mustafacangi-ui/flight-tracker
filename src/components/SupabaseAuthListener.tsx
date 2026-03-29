"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "../lib/supabase/client";
import { clearRouteWingsSession } from "../lib/routeWingsSessionStorage";
import {
  dispatchPremiumTierUpdated,
  PREMIUM_TIER_UPDATED_EVENT,
  STORAGE_TIER_KEY,
} from "../lib/premiumTier";
import { userHasPremiumSubscription } from "../lib/premiumUserMeta";
import {
  AnalyticsEvents,
  trackProductEvent,
} from "../lib/analytics/telemetry";
import { applySupabaseUserToRouteWingsSession } from "../lib/syncSupabaseRouteWingsSession";

/**
 * Restores Supabase session after refresh and keeps RouteWings header session in sync.
 * Does not clear email-only (non-Supabase) sessions when no Supabase session exists.
 */
export default function SupabaseAuthListener() {
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.log("[auth] SupabaseAuthListener: env not configured, skipping");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const syncFromSession = () => {
      void supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log("[auth] getSession (sync)", {
          hasSession: Boolean(session),
          err: error?.message,
        });
        if (session?.user) {
          applySupabaseUserToRouteWingsSession(session.user);
          if (userHasPremiumSubscription(session.user)) {
            try {
              localStorage.setItem(STORAGE_TIER_KEY, "premium");
              dispatchPremiumTierUpdated();
            } catch {
              /* ignore */
            }
          }
        }
        router.refresh();
      });
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      console.log("[auth] visibilitychange → refresh session + router");
      syncFromSession();
    };
    document.addEventListener("visibilitychange", onVisible);

    syncFromSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[auth] onAuthStateChange", event, {
        email: session?.user?.email,
      });
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        router.refresh();
      }
      if (event === "SIGNED_IN" && session?.user) {
        const identities = session.user.identities ?? [];
        const provider =
          (identities[0]?.provider as string | undefined) ??
          (session.user.app_metadata?.provider as string | undefined) ??
          "unknown";
        trackProductEvent(AnalyticsEvents.login_success, {
          auth_provider: provider,
          user_id: session.user.id,
        });
      }
      if (session?.user) {
        applySupabaseUserToRouteWingsSession(session.user);
        if (userHasPremiumSubscription(session.user)) {
          try {
            localStorage.setItem(STORAGE_TIER_KEY, "premium");
            window.dispatchEvent(new Event(PREMIUM_TIER_UPDATED_EVENT));
          } catch {
            /* ignore */
          }
        }
        return;
      }
      if (event === "SIGNED_OUT") {
        clearRouteWingsSession();
      }
    });

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
