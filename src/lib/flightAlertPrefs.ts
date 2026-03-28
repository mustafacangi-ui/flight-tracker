/**
 * Client-side flight alert preferences (localStorage).
 * Future: compare status snapshots and fire notifications when events match.
 */

export type FlightAlertEventKey =
  | "boarding"
  | "gate_changed"
  | "delayed"
  | "departure_30"
  | "landed"
  | "baggage";

export type FlightAlertChannelKey =
  | "browser"
  | "email"
  | "whatsapp"
  | "telegram";

export type FlightAlertPreferences = {
  events: Record<FlightAlertEventKey, boolean>;
  channels: Record<FlightAlertChannelKey, boolean>;
};

export const FLIGHT_ALERT_EVENT_LABELS: Record<
  FlightAlertEventKey,
  string
> = {
  boarding: "Boarding Started",
  gate_changed: "Gate Changed",
  delayed: "Delayed",
  departure_30: "Departure in 30 min",
  landed: "Landed",
  baggage: "Baggage claim available",
};

export const FLIGHT_ALERT_CHANNEL_LABELS: Record<
  FlightAlertChannelKey,
  { label: string; placeholder?: boolean }
> = {
  browser: { label: "Browser notification" },
  email: { label: "Email", placeholder: true },
  whatsapp: { label: "WhatsApp", placeholder: true },
  telegram: { label: "Telegram", placeholder: true },
};

export const DEFAULT_FLIGHT_ALERT_PREFS: FlightAlertPreferences = {
  events: {
    boarding: true,
    gate_changed: true,
    delayed: true,
    departure_30: true,
    landed: true,
    baggage: false,
  },
  channels: {
    browser: true,
    email: false,
    whatsapp: false,
    telegram: false,
  },
};

function normalizeFlightKey(flightNumber: string): string {
  return flightNumber.replace(/\s+/g, "").toUpperCase();
}

export function flightAlertStorageKey(flightNumber: string): string {
  return `flightAlerts:${normalizeFlightKey(flightNumber)}`;
}

export function loadFlightAlertPrefs(
  flightNumber: string
): FlightAlertPreferences {
  if (typeof window === "undefined") return DEFAULT_FLIGHT_ALERT_PREFS;
  try {
    const raw = localStorage.getItem(flightAlertStorageKey(flightNumber));
    if (!raw) return DEFAULT_FLIGHT_ALERT_PREFS;
    const parsed = JSON.parse(raw) as Partial<FlightAlertPreferences>;
    const merged = {
      events: { ...DEFAULT_FLIGHT_ALERT_PREFS.events, ...parsed.events },
      channels: {
        ...DEFAULT_FLIGHT_ALERT_PREFS.channels,
        ...parsed.channels,
      },
    };
    merged.channels.email = false;
    merged.channels.whatsapp = false;
    merged.channels.telegram = false;
    return merged;
  } catch {
    return DEFAULT_FLIGHT_ALERT_PREFS;
  }
}

export function saveFlightAlertPrefs(
  flightNumber: string,
  prefs: FlightAlertPreferences
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      flightAlertStorageKey(flightNumber),
      JSON.stringify(prefs)
    );
  } catch {
    /* quota */
  }
}
