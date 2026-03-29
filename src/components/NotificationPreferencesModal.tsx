"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useState } from "react";

import { createBrowserSupabaseClient } from "../lib/supabase/client";

export type NotificationPrefs = {
  flight_delays: boolean;
  gate_changes: boolean;
  boarding_reminders: boolean;
  departures: boolean;
  arrivals: boolean;
  cancellations: boolean;
};

const DEFAULTS: NotificationPrefs = {
  flight_delays: true,
  gate_changes: true,
  boarding_reminders: true,
  departures: true,
  arrivals: true,
  cancellations: true,
};

const ROWS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: "flight_delays", label: "Flight delays", hint: "Schedule changes & late departures" },
  { key: "gate_changes", label: "Gate changes", hint: "Terminal and gate updates" },
  { key: "boarding_reminders", label: "Boarding", hint: "Boarding started & final call" },
  { key: "departures", label: "Departures", hint: "Push when your flight pushes back" },
  { key: "arrivals", label: "Arrivals", hint: "Landing and on-block alerts" },
  { key: "cancellations", label: "Cancellations", hint: "Flight cancelled or diverted" },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NotificationPreferencesModal({ open, onClose }: Props) {
  const titleId = useId();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Sign-in not available.");
      return;
    }
    setLoading(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setError("Sign in to manage notification preferences.");
      return;
    }
    const { data, error: qErr } = await supabase
      .from("notification_preferences")
      .select(
        "flight_delays, gate_changes, boarding_reminders, departures, arrivals, cancellations"
      )
      .eq("user_id", user.id)
      .maybeSingle();
    setLoading(false);
    if (qErr) {
      setError(qErr.message);
      return;
    }
    if (data) {
      setPrefs({
        flight_delays: Boolean(data.flight_delays),
        gate_changes: Boolean(data.gate_changes),
        boarding_reminders: Boolean(data.boarding_reminders),
        departures: Boolean(data.departures),
        arrivals: Boolean(data.arrivals),
        cancellations: Boolean(data.cancellations),
      });
    } else {
      setPrefs(DEFAULTS);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const toggle = (key: keyof NotificationPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const save = async () => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sign in to save preferences.");
      return;
    }
    setSaving(true);
    setError(null);
    const row = {
      user_id: user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    };
    const { error: upErr } = await supabase.from("notification_preferences").upsert(row, {
      onConflict: "user_id",
    });
    setSaving(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close preferences"
            className="fixed inset-0 z-[220] bg-slate-950/85 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed left-1/2 top-1/2 z-[221] w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_40px_rgba(37,99,235,0.12)] backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2
                  id={titleId}
                  className="text-lg font-bold tracking-tight text-white"
                >
                  Alert preferences
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Choose what we can notify you about for tracked flights.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
            ) : (
              <ul className="max-h-[min(50vh,22rem)] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {ROWS.map(({ key, label, hint }) => (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                        prefs[key]
                          ? "border-blue-500/40 bg-blue-600/10 shadow-[0_0_20px_rgba(37,99,235,0.15)]"
                          : "border-white/10 bg-white/[0.04] hover:border-white/18"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{label}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>
                      </div>
                      <span
                        className={`mt-0.5 h-5 w-9 shrink-0 rounded-full p-0.5 transition ${
                          prefs[key] ? "bg-blue-500" : "bg-slate-700"
                        }`}
                      >
                        <span
                          className={`block h-4 w-4 rounded-full bg-white shadow transition ${
                            prefs[key] ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {error ? (
              <p className="mt-3 text-xs text-red-400/95" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || loading}
                onClick={() => void save()}
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 py-3 text-sm font-bold text-white shadow-[0_8px_28px_rgba(37,99,235,0.4)] transition hover:from-blue-500 hover:to-sky-400 disabled:opacity-45"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
