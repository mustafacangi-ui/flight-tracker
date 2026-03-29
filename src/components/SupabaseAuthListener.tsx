"use client";

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
import { applySupabaseUserToRouteWingsSession } from "../lib/syncSupabaseRouteWingsSession";

/**
 * Restores Supabase session after refresh and keeps RouteWings header session in sync.
 * Does not clear email-only (non-Supabase) sessions when no Supabase session exists.
 */
export default function SupabaseAuthListener() {
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.log("[auth] SupabaseAuthListener: env not configured, skipping");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("[auth] getSession (mount)", {
        hasSession: Boolean(session),
        email: session?.user?.email,
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
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[auth] onAuthStateChange", event, {
        email: session?.user?.email,
      });
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

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
