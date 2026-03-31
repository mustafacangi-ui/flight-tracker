"use client";

import { useEffect } from "react";

import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "../lib/supabase/client";
import {
  QUICK_ACCESS_UPDATED_EVENT,
  SAVED_FLIGHTS_KEY,
  saveSavedFlights,
} from "../lib/quickAccessStorage";
import type { SavedFlight } from "../lib/quickAccessStorage";

async function pullCloudSaved(): Promise<void> {
  try {
    const res = await fetch("/api/saved-flights", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as { flights?: SavedFlight[] };
    if (!Array.isArray(data.flights)) return;
    saveSavedFlights(data.flights);
    console.log("[saved-flights] cloud pull applied", { count: data.flights.length });
  } catch {
    /* ignore */
  }
}

/**
 * Loads server-backed saved flights when signed in; clears local list on sign-out
 * so another account on the same device does not see the previous user’s saves.
 */
export default function SavedFlightsCloudSync() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) void pullCloudSaved();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        void pullCloudSaved();
      }
      if (event === "SIGNED_OUT") {
        if (typeof window !== "undefined") {
          localStorage.removeItem(SAVED_FLIGHTS_KEY);
          window.dispatchEvent(new Event(QUICK_ACCESS_UPDATED_EVENT));
          console.log("[saved-flights] cleared on sign-out");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
