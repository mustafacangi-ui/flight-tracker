"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "../lib/supabase/client";
import type { SavedFlight } from "../lib/quickAccessStorage";

type Props = {
  flight: SavedFlight;
  className?: string;
};

export default function FlightNotificationToggle({ flight, className = "" }: Props) {
  const fn = flight.flightNumber.trim().toUpperCase();
  const [tracked, setTracked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hasUser, setHasUser] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setHasUser(false);
      setLoading(false);
      setTracked(false);
      return;
    }
    setHasUser(true);
    const { data } = await supabase
      .from("tracked_flights")
      .select("id")
      .eq("user_id", user.id)
      .eq("flight_number", fn)
      .maybeSingle();
    setTracked(Boolean(data));
    setLoading(false);
  }, [fn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSupabaseConfigured() || busy) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setBusy(true);
    try {
      if (tracked) {
        await supabase
          .from("tracked_flights")
          .delete()
          .eq("user_id", user.id)
          .eq("flight_number", fn);
        setTracked(false);
      } else {
        const { error } = await supabase.from("tracked_flights").insert({
          user_id: user.id,
          flight_number: fn,
          departure_airport: flight.departureAirport || null,
          arrival_airport: flight.arrivalAirport || null,
          departure_time: new Date(flight.timestamp).toISOString(),
          last_status: flight.status || null,
        });
        if (error) throw error;
        setTracked(true);
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  if (!isSupabaseConfigured() || loading || !hasUser) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={(e) => void toggle(e)}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-45 ${
        tracked
          ? "border-sky-500/45 bg-sky-500/15 text-sky-100 shadow-[0_0_16px_rgba(14,165,233,0.2)]"
          : "border-white/10 bg-white/[0.05] text-slate-300 hover:border-white/20 hover:bg-white/[0.08]"
      } ${className}`.trim()}
      aria-pressed={tracked}
      title={tracked ? "Stop flight alerts" : "Track alerts for this flight"}
    >
      <motion.span
        layout
        className="flex h-5 w-5 items-center justify-center rounded-md bg-white/10"
        aria-hidden
      >
        {tracked ? (
          <svg
            className="h-3 w-3 text-sky-300"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
        ) : (
          <svg
            className="h-3 w-3 text-slate-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
        )}
      </motion.span>
      <span className="hidden sm:inline">{tracked ? "Alerts on" : "Alerts"}</span>
    </button>
  );
}
