"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import QuietHoursCard from "./QuietHoursCard";
import SoundSettingsCard from "./SoundSettingsCard";
import { ensureNotificationPermission } from "../lib/browserFlightNotify";
import {
  clearSnooze,
  getTrackingMeta,
  setNotificationsDisabledForFlight,
  setSnoozeUntil,
} from "../lib/flightTrackingStorage";
import {
  loadGlobalNotificationSettings,
  saveGlobalNotificationSettings,
  type AlertSoundMode,
} from "../lib/notificationGlobalSettings";
import {
  DEFAULT_FLIGHT_NOTIFY_PREFS,
  NOTIFY_PREF_LABELS,
  NOTIFY_PREF_SECTIONS,
  type FlightNotifyPrefs,
  type NotifyPrefKey,
  loadPrefsForFlight,
  savePrefsForFlight,
} from "../lib/savedFlightNotifyPrefs";

type Props = {
  flightNumber: string;
  open: boolean;
  onClose: () => void;
};

export default function NotificationPreferencesModal({
  flightNumber,
  open,
  onClose,
}: Props) {
  const [prefs, setPrefs] = useState<FlightNotifyPrefs>({
    ...DEFAULT_FLIGHT_NOTIFY_PREFS,
  });
  const [permHint, setPermHint] = useState<string | null>(null);
  const [sound, setSound] = useState<AlertSoundMode>("soft");
  const [quietOn, setQuietOn] = useState(false);
  const [quietStart, setQuietStart] = useState("23:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [quietTravelOff, setQuietTravelOff] = useState(false);
  const [notifOff, setNotifOff] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPrefs(loadPrefsForFlight(flightNumber));
    setPermHint(null);
    const g = loadGlobalNotificationSettings();
    setSound(g.sound);
    setQuietOn(g.quietHoursEnabled);
    setQuietStart(g.quietStart);
    setQuietEnd(g.quietEnd);
    setQuietTravelOff(g.quietHoursDisableDuringTravel);
    setNotifOff(getTrackingMeta(flightNumber).notificationsDisabled ?? false);
  }, [open, flightNumber]);

  const toggle = (k: NotifyPrefKey) => {
    setPrefs((p) => {
      const next = { ...p, [k]: !p[k] };
      savePrefsForFlight(flightNumber, next);
      return next;
    });
  };

  const enableBrowser = async () => {
    const p = await ensureNotificationPermission();
    setPermHint(
      p === "granted"
        ? "Browser notifications enabled."
        : p === "denied"
          ? "Notifications blocked in browser settings."
          : "Permission not granted."
    );
  };

  const snooze = (ms: number) => {
    setSnoozeUntil(flightNumber, Date.now() + ms);
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="notify-overlay"
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="notify-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-gray-950 p-5 shadow-2xl"
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="notify-modal-title"
              className="text-lg font-semibold text-white"
            >
              Notification preferences · {flightNumber}
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Choose alerts for this flight. Tracking must be on to receive
              them.
            </p>

            <div className="mt-5 space-y-6">
              {NOTIFY_PREF_SECTIONS.map((section) => (
                <div key={section.title}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                    {section.title}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {section.keys.map((k) => (
                      <li key={k}>
                        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                          <span className="text-sm text-gray-200">
                            {NOTIFY_PREF_LABELS[k]}
                          </span>
                          <input
                            type="checkbox"
                            checked={prefs[k]}
                            onChange={() => toggle(k)}
                            className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-blue-600"
                          />
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Snooze
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => snooze(30 * 60 * 1000)}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white"
                >
                  30 min
                </button>
                <button
                  type="button"
                  onClick={() => snooze(60 * 60 * 1000)}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white"
                >
                  1 hour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearSnooze(flightNumber);
                  }}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300"
                >
                  Clear snooze
                </button>
              </div>
            </div>

            <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5">
              <span className="text-sm text-red-100/90">
                Disable notifications for this flight
              </span>
              <input
                type="checkbox"
                checked={notifOff}
                onChange={(e) => {
                  const v = e.target.checked;
                  setNotifOff(v);
                  setNotificationsDisabledForFlight(flightNumber, v);
                }}
                className="h-4 w-4 rounded border-gray-600"
              />
            </label>

            <SoundSettingsCard
              className="mt-5"
              value={sound}
              onChange={(v) => {
                setSound(v);
                saveGlobalNotificationSettings({ sound: v });
              }}
            />

            <QuietHoursCard
              className="mt-4"
              enabled={quietOn}
              start={quietStart}
              end={quietEnd}
              disableDuringTravel={quietTravelOff}
              onEnabledChange={(v) => {
                setQuietOn(v);
                saveGlobalNotificationSettings({
                  quietHoursEnabled: v,
                  quietStart,
                  quietEnd,
                });
              }}
              onStartChange={(v) => {
                setQuietStart(v);
                saveGlobalNotificationSettings({ quietStart: v });
              }}
              onEndChange={(v) => {
                setQuietEnd(v);
                saveGlobalNotificationSettings({ quietEnd: v });
              }}
              onDisableDuringTravelChange={(v) => {
                setQuietTravelOff(v);
                saveGlobalNotificationSettings({
                  quietHoursDisableDuringTravel: v,
                });
              }}
            />

            <button
              type="button"
              onClick={() => void enableBrowser()}
              className="mt-4 w-full rounded-xl border border-blue-500/40 bg-blue-500/10 py-2.5 text-sm font-medium text-blue-200"
            >
              Allow browser push notifications
            </button>
            {permHint ? (
              <p className="mt-2 text-center text-xs text-gray-400">
                {permHint}
              </p>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl border border-white/15 py-2.5 text-sm font-medium text-gray-200"
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
