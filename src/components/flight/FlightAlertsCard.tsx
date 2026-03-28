"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_FLIGHT_ALERT_PREFS,
  FLIGHT_ALERT_CHANNEL_LABELS,
  FLIGHT_ALERT_EVENT_LABELS,
  loadFlightAlertPrefs,
  saveFlightAlertPrefs,
  type FlightAlertChannelKey,
  type FlightAlertEventKey,
  type FlightAlertPreferences,
} from "../../lib/flightAlertPrefs";

function card(className = "") {
  return `rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8 ${className}`;
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-100">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        ) : null}
      </div>
      <label
        className={`rounded-full focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-500/40 ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={`relative block h-8 w-[3.25rem] shrink-0 rounded-full transition-colors ${
            checked ? "bg-emerald-600" : "bg-white/15"
          }`}
          aria-hidden
        >
          <span
            className={`absolute left-1 top-1 block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
              checked ? "translate-x-[1.25rem]" : "translate-x-0"
            }`}
          />
        </span>
      </label>
    </div>
  );
}

const EXAMPLE_EVENTS = [
  "Gate changed from A12 to B4",
  "Departure delayed by 22 min",
  "Boarding started",
  "Aircraft landed safely",
];

type Props = { flightNumber: string };

export default function FlightAlertsCard({ flightNumber }: Props) {
  const [prefs, setPrefs] = useState<FlightAlertPreferences>(
    DEFAULT_FLIGHT_ALERT_PREFS
  );
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(loadFlightAlertPrefs(flightNumber));
    setHydrated(true);
  }, [flightNumber]);

  const setEvent = useCallback(
    (key: FlightAlertEventKey, value: boolean) => {
      setPrefs((p) => ({
        ...p,
        events: { ...p.events, [key]: value },
      }));
      setSaved(false);
    },
    []
  );

  const setChannel = useCallback(
    (key: FlightAlertChannelKey, value: boolean) => {
      setPrefs((p) => ({
        ...p,
        channels: { ...p.channels, [key]: value },
      }));
      setSaved(false);
    },
    []
  );

  const handleSave = useCallback(async () => {
    saveFlightAlertPrefs(flightNumber, prefs);

    const wantsBrowser =
      prefs.channels.browser &&
      Object.values(prefs.events).some(Boolean);

    if (wantsBrowser && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }

    setSaved(true);
    window.setTimeout(() => setSaved(false), 5000);
  }, [flightNumber, prefs]);

  const eventKeys = Object.keys(FLIGHT_ALERT_EVENT_LABELS) as FlightAlertEventKey[];
  const channelKeys = Object.keys(
    FLIGHT_ALERT_CHANNEL_LABELS
  ) as FlightAlertChannelKey[];

  return (
    <section className={card()}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
        Flight Alerts
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-gray-400">
        Get notified about important changes for this flight.
      </p>

      <div className="mt-8 rounded-2xl border border-white/8 bg-black/20 p-1">
        <div className="divide-y divide-white/5 px-4">
          {eventKeys.map((key) => (
            <SwitchRow
              key={key}
              label={FLIGHT_ALERT_EVENT_LABELS[key]}
              checked={prefs.events[key]}
              onChange={(v) => setEvent(key, v)}
            />
          ))}
        </div>
      </div>

      <h3 className="mt-10 text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
        Notification methods
      </h3>
      <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-1">
        <div className="divide-y divide-white/5 px-4">
          {channelKeys.map((key) => {
            const meta = FLIGHT_ALERT_CHANNEL_LABELS[key];
            return (
              <SwitchRow
                key={key}
                label={meta.label}
                description={meta.placeholder ? "Coming soon" : undefined}
                checked={prefs.channels[key]}
                onChange={(v) => setChannel(key, v)}
                disabled={meta.placeholder === true}
              />
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleSave()}
        className="mt-8 w-full rounded-3xl border border-white/15 bg-white/[0.08] py-4 text-base font-semibold text-white transition hover:bg-white/[0.12] active:scale-[0.99]"
      >
        Save Alert Preferences
      </button>

      {saved ? (
        <p
          className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-200/95"
          role="status"
        >
          You will be notified about important updates for this flight.
        </p>
      ) : null}

      <div className="mt-10 rounded-2xl border border-white/6 bg-white/[0.02] p-5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-600">
          Example updates we may alert you about
        </h3>
        <ul className="mt-4 space-y-2.5 text-sm text-gray-500">
          {EXAMPLE_EVENTS.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-emerald-500/80" aria-hidden>
                ·
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-gray-600">
          Future: we&apos;ll compare each refresh to your last view and notify
          when something matches your choices.
        </p>
      </div>

      {!hydrated ? (
        <span className="sr-only" aria-live="polite">
          Loading preferences
        </span>
      ) : null}
    </section>
  );
}
