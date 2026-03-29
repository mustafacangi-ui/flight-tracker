"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useState } from "react";

import type { FlightNotifyPrefs, NotifyPrefKey } from "../lib/savedFlightNotifyPrefs";
import {
  AnalyticsEvents,
  trackProductEvent,
} from "../lib/analytics/telemetry";
import {
  loadPrefsForFlight,
  NOTIFY_PREF_LABELS,
  NOTIFY_PREF_SECTIONS,
  savePrefsForFlight,
} from "../lib/savedFlightNotifyPrefs";

type Props = {
  flightNumber: string;
  open: boolean;
  onClose: () => void;
};

/**
 * Per-flight notification toggles (localStorage). Distinct from
 * `NotificationPreferencesModal` (account-level Supabase preferences).
 */
export default function NotificationPrefsModal({
  flightNumber,
  open,
  onClose,
}: Props) {
  const titleId = useId();
  const [prefs, setPrefs] = useState<FlightNotifyPrefs>(() =>
    loadPrefsForFlight(flightNumber)
  );

  const reload = useCallback(() => {
    setPrefs(loadPrefsForFlight(flightNumber));
  }, [flightNumber]);

  useEffect(() => {
    if (open) reload();
  }, [open, reload]);

  const toggle = (key: NotifyPrefKey) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const save = () => {
    savePrefsForFlight(flightNumber, prefs);
    const enabledKeys = (
      Object.keys(prefs) as (keyof typeof prefs)[]
    ).filter((k) => prefs[k]);
    trackProductEvent(AnalyticsEvents.notification_preferences_saved, {
      scope: "flight",
      flight_number: flightNumber,
      enabled_count: enabledKeys.length,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close notification preferences"
            className="fixed inset-0 z-[218] bg-slate-950/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed left-1/2 top-1/2 z-[219] w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-6"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-tight text-white"
                >
                  Alerts for {flightNumber}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Local preferences for this flight (stored on this device).
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-xl leading-none text-slate-500 transition hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="max-h-[min(52vh,24rem)] space-y-5 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {NOTIFY_PREF_SECTIONS.map((section) => (
                <div key={section.title}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {section.title}
                  </p>
                  <ul className="space-y-2">
                    {section.keys.map((key) => (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => toggle(key)}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                            prefs[key]
                              ? "border-blue-500/40 bg-blue-600/15 text-white"
                              : "border-slate-700/90 bg-slate-900/40 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          <span>{NOTIFY_PREF_LABELS[key]}</span>
                          <span
                            className={`h-4 w-8 shrink-0 rounded-full p-0.5 ${
                              prefs[key] ? "bg-blue-500" : "bg-slate-700"
                            }`}
                          >
                            <span
                              className={`block h-3 w-3 rounded-full bg-white transition ${
                                prefs[key] ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500"
              >
                Save
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
