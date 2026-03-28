import { normalizeFlightNumberKey } from "./flightDetail";
import type { DisplayFlight } from "./formatFlights";
import { emitTrackedFlightAlert } from "./emitTrackedFlightAlert";
import { isFlightTracked } from "./flightTrackingStorage";
import { loadPrefsForFlight } from "./savedFlightNotifyPrefs";

const FIRED_KEY = "departureReminderFired";

function firedStore(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    return p != null && typeof p === "object" ? (p as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function setFired(key: string, v: boolean): void {
  if (typeof window === "undefined") return;
  const s = { ...firedStore(), [key]: v };
  localStorage.setItem(FIRED_KEY, JSON.stringify(s));
}

function dayKey(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** Minutes until displayed wall-clock departure time in airport TZ (same-day heuristic). */
function minutesUntilDeparture(
  timeDisplay: string,
  airportIanaTz: string
): number | null {
  const m = timeDisplay.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const depH = parseInt(m[1], 10);
  const depMin = parseInt(m[2], 10);
  if (depH > 23 || depMin > 59) return null;
  const depTotal = depH * 60 + depMin;
  const now = new Date();
  let curH = now.getHours();
  let curMin = now.getMinutes();
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: airportIanaTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const hv = parts.find((p) => p.type === "hour")?.value;
    const mv = parts.find((p) => p.type === "minute")?.value;
    if (hv != null && mv != null) {
      curH = parseInt(hv, 10);
      curMin = parseInt(mv, 10);
    }
  } catch {
    /* keep local */
  }
  const nowTotal = curH * 60 + curMin;
  let diff = depTotal - nowTotal;
  if (diff < -12 * 60) diff += 24 * 60;
  if (diff > 18 * 60) diff -= 24 * 60;
  return diff;
}

/**
 * Fire one-shot 1h / 30m reminders for tracked departures (best-effort from board time).
 */
export function runDepartureReminders(
  flights: DisplayFlight[],
  airportIanaTz: string
): void {
  if (typeof window === "undefined" || flights.length === 0) return;
  const day = dayKey(airportIanaTz);

  for (const f of flights) {
    if (f.direction !== "departure") continue;
    if (f.timeMissing) continue;
    const fn = normalizeFlightNumberKey(f.number);
    if (!isFlightTracked(fn)) continue;
    const prefs = loadPrefsForFlight(fn);
    const diff = minutesUntilDeparture(f.time, airportIanaTz);
    if (diff == null) continue;

    if (prefs.beforeDeparture1h) {
      const key = `${fn}-60-${day}`;
      if (diff >= 58 && diff <= 65 && !firedStore()[key]) {
        emitTrackedFlightAlert({
          flightNumber: f.number,
          text: `${f.number}: about 1 hour to departure (${f.time} local)`,
          kind: "reminder1h",
        });
        setFired(key, true);
      }
    }
    if (prefs.beforeDeparture30m) {
      const key = `${fn}-30-${day}`;
      if (diff >= 28 && diff <= 34 && !firedStore()[key]) {
        emitTrackedFlightAlert({
          flightNumber: f.number,
          text: `${f.number}: about 30 minutes to departure (${f.time} local)`,
          kind: "reminder30m",
        });
        setFired(key, true);
      }
    }
  }
}
