/**
 * Tracked flights: users get timeline + browser alerts when tracking is on.
 * Separate from saved/bookmark list.
 */

import { normalizeFlightNumberKey } from "./flightDetail";

export const TRACKED_FLIGHTS_KEY = "trackedFlightNumbers";
export const FLIGHT_TRACKING_META_KEY = "flightTrackingMeta";

export const FLIGHT_TRACKING_UPDATED_EVENT = "flightTrackingUpdated";

export type FlightTrackingMeta = {
  snoozeUntil?: number;
  notificationsDisabled?: boolean;
};

type MetaStore = Record<string, FlightTrackingMeta>;

function notify(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FLIGHT_TRACKING_UPDATED_EVENT));
}

export function loadTrackedFlightNumbers(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TRACKED_FLIGHTS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => normalizeFlightNumberKey(x));
  } catch {
    return [];
  }
}

export function saveTrackedFlightNumbers(list: string[]): void {
  if (typeof window === "undefined") return;
  const uniq = [...new Set(list.map((x) => normalizeFlightNumberKey(x)))];
  localStorage.setItem(TRACKED_FLIGHTS_KEY, JSON.stringify(uniq));
  notify();
}

export function isFlightTracked(flightNumber: string): boolean {
  const key = normalizeFlightNumberKey(flightNumber);
  return loadTrackedFlightNumbers().includes(key);
}

export function setFlightTracked(flightNumber: string, on: boolean): void {
  const key = normalizeFlightNumberKey(flightNumber);
  if (!key) return;
  const cur = loadTrackedFlightNumbers();
  if (on) {
    if (!cur.includes(key)) saveTrackedFlightNumbers([...cur, key]);
  } else {
    saveTrackedFlightNumbers(cur.filter((x) => x !== key));
    const meta = loadTrackingMetaAll();
    delete meta[key];
    saveTrackingMetaAll(meta);
  }
}

function loadTrackingMetaAll(): MetaStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FLIGHT_TRACKING_META_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    if (p == null || typeof p !== "object") return {};
    return p as MetaStore;
  } catch {
    return {};
  }
}

function saveTrackingMetaAll(m: MetaStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FLIGHT_TRACKING_META_KEY, JSON.stringify(m));
  notify();
}

export function getTrackingMeta(flightNumber: string): FlightTrackingMeta {
  const key = normalizeFlightNumberKey(flightNumber);
  return loadTrackingMetaAll()[key] ?? {};
}

export function setSnoozeUntil(flightNumber: string, untilMs: number): void {
  const key = normalizeFlightNumberKey(flightNumber);
  const all = loadTrackingMetaAll();
  all[key] = { ...all[key], snoozeUntil: untilMs };
  saveTrackingMetaAll(all);
}

export function clearSnooze(flightNumber: string): void {
  const key = normalizeFlightNumberKey(flightNumber);
  const all = loadTrackingMetaAll();
  if (!all[key]) return;
  const next = { ...all[key] };
  delete next.snoozeUntil;
  if (Object.keys(next).length === 0) delete all[key];
  else all[key] = next;
  saveTrackingMetaAll(all);
}

export function setNotificationsDisabledForFlight(
  flightNumber: string,
  disabled: boolean
): void {
  const key = normalizeFlightNumberKey(flightNumber);
  const all = loadTrackingMetaAll();
  all[key] = { ...all[key], notificationsDisabled: disabled };
  saveTrackingMetaAll(all);
  notify();
}
