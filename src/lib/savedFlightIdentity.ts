import type { SavedFlight } from "./quickAccessStorage";

/** Start of UTC calendar day for the given instant (stable “operating day” for FIDS-style saves). */
export function utcDayStartMs(fromMs: number): number {
  const d = new Date(fromMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Best-effort movement time used for DB `departure_time` and duplicate detection
 * (user_id + flight_number + departure_time).
 */
export function savedFlightToDepartureTimestamptzMs(
  f: Pick<SavedFlight, "scheduledTime" | "timestamp">
): number {
  const st = f.scheduledTime.trim();
  if (st && st !== "—") {
    const parsed = Date.parse(st);
    if (!Number.isNaN(parsed)) return parsed;
    const hm = st.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    if (hm) {
      let h = parseInt(hm[1], 10);
      const m = parseInt(hm[2], 10);
      const ampm = (hm[3] ?? "").toLowerCase();
      if (ampm === "pm" && h < 12) h += 12;
      if (ampm === "am" && h === 12) h = 0;
      const day = new Date(f.timestamp);
      return Date.UTC(
        day.getUTCFullYear(),
        day.getUTCMonth(),
        day.getUTCDate(),
        h,
        m,
        0,
        0
      );
    }
  }
  return f.timestamp;
}

export function savedFlightIdentityKey(
  f: Pick<
    SavedFlight,
    "flightNumber" | "scheduledTime" | "timestamp" | "departureTimeKeyMs"
  >
): string {
  const fn = f.flightNumber.trim().toUpperCase();
  const depMs =
    typeof f.departureTimeKeyMs === "number" && Number.isFinite(f.departureTimeKeyMs)
      ? f.departureTimeKeyMs
      : savedFlightToDepartureTimestamptzMs(f);
  return `${fn}\0${depMs}`;
}
