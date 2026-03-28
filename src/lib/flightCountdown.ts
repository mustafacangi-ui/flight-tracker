import {
  FLIGHT_TIME_MISSING,
  type DisplayFlight,
} from "./formatFlights";

function ymdInTimeZone(isoNow: number, iana: string): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: iana,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(isoNow));
  const y = p.find((x) => x.type === "year")?.value;
  const m = p.find((x) => x.type === "month")?.value;
  const d = p.find((x) => x.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

function partsInZone(ms: number, iana: string): { h: number; m: number } {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: iana,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = f.formatToParts(new Date(ms));
  const h = parseInt(parts.find((x) => x.type === "hour")?.value ?? "0", 10);
  const m = parseInt(parts.find((x) => x.type === "minute")?.value ?? "0", 10);
  return { h, m };
}

/** Approximate UTC instant when local clock shows `hm` in `iana` on the given calendar day in that zone. */
function utcForHmOnAirportDay(
  iana: string,
  hm: string,
  dayMs: number
): number | null {
  const t = hm.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!t) return null;
  const targetH = parseInt(t[1], 10);
  const targetM = parseInt(t[2], 10);
  if (
    Number.isNaN(targetH) ||
    Number.isNaN(targetM) ||
    targetH > 23 ||
    targetM > 59
  ) {
    return null;
  }

  let utc = dayMs;
  for (let i = 0; i < 16; i++) {
    const { h, m } = partsInZone(utc, iana);
    const deltaMin = targetH * 60 + targetM - (h * 60 + m);
    if (deltaMin === 0) return utc;
    utc += deltaMin * 60 * 1000;
  }
  return utc;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "Now";
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) {
    return `${totalMin} min`;
  }
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${h}h`;
}

/**
 * Small label for pill under status: boarding / departure / landing countdown.
 */
export function flightCountdownPillText(
  f: DisplayFlight,
  airportIanaTz: string
): string | null {
  if (!airportIanaTz?.trim()) return null;

  const hm =
    f.direction === "departure"
      ? f.scheduledDepartureLocal &&
          f.scheduledDepartureLocal !== FLIGHT_TIME_MISSING
        ? f.scheduledDepartureLocal
        : !f.timeMissing && f.time !== FLIGHT_TIME_MISSING
          ? f.time
          : null
      : f.scheduledArrivalLocal &&
          f.scheduledArrivalLocal !== FLIGHT_TIME_MISSING
        ? f.scheduledArrivalLocal
        : !f.timeMissing && f.time !== FLIGHT_TIME_MISSING
          ? f.time
          : null;

  if (!hm) return null;

  const now = Date.now();
  const ymd = ymdInTimeZone(now, airportIanaTz);
  const dayStart = Date.parse(`${ymd}T12:00:00.000Z`);
  const target = utcForHmOnAirportDay(airportIanaTz, hm, dayStart);
  if (target == null) return null;

  let useTarget = target;
  if (target < now - 120_000) {
    const nextDay = dayStart + 24 * 60 * 60 * 1000;
    const t2 = utcForHmOnAirportDay(airportIanaTz, hm, nextDay);
    if (t2 != null && t2 > now - 120_000) useTarget = t2;
  }

  const diff = useTarget - now;
  const raw = (f.statusRaw ?? f.statusLabel ?? "").toLowerCase();
  const isBoarding =
    raw.includes("board") || (f.statusLabel ?? "").toLowerCase().includes("board");
  const isDep = f.direction === "departure";

  if (isBoarding && isDep) {
    return diff > 0 ? `Boarding in ${formatDuration(diff)}` : "Boarding";
  }
  if (isDep) {
    return diff > 0 ? `Departure in ${formatDuration(diff)}` : "Departing";
  }
  return diff > 0 ? `Landing in ${formatDuration(diff)}` : "Arriving";
}
