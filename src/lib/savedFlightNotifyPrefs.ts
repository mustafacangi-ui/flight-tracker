/**
 * Per-flight notification toggles (localStorage). Used when flight is tracked.
 */

export type NotifyPrefKey =
  | "boardingStarts"
  | "gateChanged"
  | "delayed"
  | "departed"
  | "landed"
  | "arrivedAtGate"
  | "baggageClaim"
  | "beforeDeparture1h"
  | "beforeDeparture30m"
  | "cancelled";

export type FlightNotifyPrefs = Record<NotifyPrefKey, boolean>;

export const NOTIFY_PREF_LABELS: Record<NotifyPrefKey, string> = {
  boardingStarts: "Boarding soon",
  gateChanged: "Gate changed",
  delayed: "Delayed",
  departed: "Departed",
  landed: "Landed",
  arrivedAtGate: "Arrived at gate",
  baggageClaim: "Baggage claim ready",
  beforeDeparture1h: "1 hour before departure",
  beforeDeparture30m: "30 minutes before departure",
  cancelled: "Flight cancelled",
};

export const DEFAULT_FLIGHT_NOTIFY_PREFS: FlightNotifyPrefs = {
  boardingStarts: true,
  gateChanged: true,
  delayed: true,
  departed: true,
  landed: true,
  arrivedAtGate: true,
  baggageClaim: true,
  beforeDeparture1h: true,
  beforeDeparture30m: true,
  cancelled: true,
};

/** Grouped sections for notification preferences UI */
export const NOTIFY_PREF_SECTIONS: { title: string; keys: NotifyPrefKey[] }[] = [
  {
    title: "Flight updates",
    keys: [
      "boardingStarts",
      "gateChanged",
      "delayed",
      "departed",
      "landed",
      "arrivedAtGate",
      "baggageClaim",
      "cancelled",
    ],
  },
  {
    title: "Departure reminders",
    keys: ["beforeDeparture1h", "beforeDeparture30m"],
  },
];

const STORAGE_KEY = "savedFlightNotifyPrefs";

export const NOTIFY_PREFS_UPDATED_EVENT = "savedFlightNotifyPrefsUpdated";

function notify(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFY_PREFS_UPDATED_EVENT));
}

type Store = Record<string, FlightNotifyPrefs>;

function loadAll(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    if (p == null || typeof p !== "object") return {};
    return p as Store;
  } catch {
    return {};
  }
}

function saveAll(s: Store): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  notify();
}

/** Migrate legacy keys (boardingSoon, etc.) */
function normalizeFromRaw(
  partial: Partial<FlightNotifyPrefs> & Record<string, boolean | undefined>
): FlightNotifyPrefs {
  const boardingStarts =
    partial.boardingStarts ??
    (partial as { boardingSoon?: boolean }).boardingSoon ??
    DEFAULT_FLIGHT_NOTIFY_PREFS.boardingStarts;
  return {
    boardingStarts,
    gateChanged:
      partial.gateChanged ?? DEFAULT_FLIGHT_NOTIFY_PREFS.gateChanged,
    delayed: partial.delayed ?? DEFAULT_FLIGHT_NOTIFY_PREFS.delayed,
    departed: partial.departed ?? DEFAULT_FLIGHT_NOTIFY_PREFS.departed,
    landed: partial.landed ?? DEFAULT_FLIGHT_NOTIFY_PREFS.landed,
    arrivedAtGate:
      partial.arrivedAtGate ?? DEFAULT_FLIGHT_NOTIFY_PREFS.arrivedAtGate,
    baggageClaim:
      partial.baggageClaim ?? DEFAULT_FLIGHT_NOTIFY_PREFS.baggageClaim,
    beforeDeparture1h:
      partial.beforeDeparture1h ??
      DEFAULT_FLIGHT_NOTIFY_PREFS.beforeDeparture1h,
    beforeDeparture30m:
      partial.beforeDeparture30m ??
      DEFAULT_FLIGHT_NOTIFY_PREFS.beforeDeparture30m,
    cancelled: partial.cancelled ?? DEFAULT_FLIGHT_NOTIFY_PREFS.cancelled,
  };
}

export function loadPrefsForFlight(flightNumber: string): FlightNotifyPrefs {
  const key = flightNumber.trim().toUpperCase();
  const all = loadAll();
  const hit = all[key];
  return hit ? normalizeFromRaw(hit as Record<string, boolean | undefined>) : { ...DEFAULT_FLIGHT_NOTIFY_PREFS };
}

export function savePrefsForFlight(
  flightNumber: string,
  prefs: FlightNotifyPrefs
): void {
  const key = flightNumber.trim().toUpperCase();
  if (!key) return;
  const all = loadAll();
  all[key] = normalizeFromRaw(prefs);
  saveAll(all);
}

export function removePrefsForFlight(flightNumber: string): void {
  const key = flightNumber.trim().toUpperCase();
  const all = loadAll();
  delete all[key];
  saveAll(all);
}

export function isNotifyEnabled(
  flightNumber: string,
  key: NotifyPrefKey
): boolean {
  return loadPrefsForFlight(flightNumber)[key];
}

export const NOTIFY_PREF_KEYS = Object.keys(
  NOTIFY_PREF_LABELS
) as NotifyPrefKey[];
