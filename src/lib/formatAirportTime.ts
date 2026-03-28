/** Known IATA codes → IANA zones when search API does not return `timezone`. */
export const IATA_FALLBACK_TIMEZONE: Partial<Record<string, string>> = {
  IST: "Europe/Istanbul",
  SAW: "Europe/Istanbul",
  ESB: "Europe/Istanbul",
  ADB: "Europe/Istanbul",
  CGK: "Asia/Jakarta",
  BER: "Europe/Berlin",
  FRA: "Europe/Berlin",
  MUC: "Europe/Berlin",
};

export function getEffectiveAirportTimeZone(
  airportCode: string,
  selected: { code: string; timezone?: string } | null
): string {
  const code = airportCode.trim().toUpperCase();
  if (selected?.code === code && selected.timezone?.trim()) {
    return selected.timezone.trim();
  }
  return IATA_FALLBACK_TIMEZONE[code] ?? "UTC";
}

export function formatAirportLocalTime(
  date: string | number | Date,
  timezone?: string
): string {
  if (date === null || date === undefined) return "--:--";
  if (typeof date === "string" && !date.trim()) return "--:--";

  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "--:--";
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone || "UTC",
    }).format(d);
  } catch {
    return "--:--";
  }
}

/** Wall clock + short zone name (e.g. WIB, GMT+7) for “live” airport clock. */
export function formatAirportLocalClockParts(
  date: string | number | Date,
  timezone?: string
): { time: string; zoneAbbrev: string } {
  const tz = timezone || "UTC";
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return { time: "--:--", zoneAbbrev: "" };
    const parts = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(d);
    let hour = "";
    let minute = "";
    let zoneAbbrev = "";
    for (const p of parts) {
      if (p.type === "hour") hour = p.value;
      if (p.type === "minute") minute = p.value;
      if (p.type === "timeZoneName") zoneAbbrev = p.value;
    }
    return {
      time: hour && minute ? `${hour}:${minute}` : "--:--",
      zoneAbbrev,
    };
  } catch {
    return { time: "--:--", zoneAbbrev: "" };
  }
}

/** e.g. "MONDAY, 22 JULY 2026" in the given IANA zone. */
export function formatAirportLongDateUpper(
  atMs: number,
  timezone: string
): string {
  try {
    const d = new Date(atMs);
    if (Number.isNaN(d.getTime())) return "";
    const s = new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: timezone,
    }).format(d);
    return s.toUpperCase();
  } catch {
    return "";
  }
}
