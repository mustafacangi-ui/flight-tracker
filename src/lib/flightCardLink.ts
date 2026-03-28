import { DISPLAY_DASH } from "./displayConstants";
import type { DisplayFlight } from "./formatFlights";
import type { SavedFlight } from "./quickAccessStorage";

/** Path + query for the premium static flight card (served from /public). */
export function flightCardHref(
  flightNumber: string,
  airportCode: string,
  dateISO: string
): string {
  const q = new URLSearchParams();
  q.set("flight", flightNumber.replace(/\s+/g, "").trim());
  q.set("airport", airportCode.trim().toUpperCase());
  q.set("date", dateISO.trim());
  return `/flight-card.html?${q.toString()}`;
}

/** YYYY-MM-DD in a given IANA timezone (for consistent deep links). */
export function localDateInIanaTz(timeZone: string): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = fmt.formatToParts(new Date());
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    /* fall through */
  }
  return new Date().toISOString().slice(0, 10);
}

export function absoluteFlightCardUrl(origin: string, hrefPath: string): string {
  const base = origin.replace(/\/$/, "");
  const path = hrefPath.startsWith("/") ? hrefPath : `/${hrefPath}`;
  return `${base}${path}`;
}

export type FlightCardSharePayload = {
  flightNumber: string;
  originLabel: string;
  destLabel: string;
  estimatedArrivalHm: string;
  cardAbsoluteUrl: string;
};

/** WhatsApp `wa.me` URL with UTF-8 encoded body (newlines preserved). */
export function familyShareWhatsAppUrl(payload: FlightCardSharePayload): string {
  const fn = payload.flightNumber.trim().toUpperCase();
  const line1 = `✈ ${fn} · ${payload.originLabel} → ${payload.destLabel}`;
  const line2 = `🕐 Tahmini varış: ${payload.estimatedArrivalHm}`;
  const line3 = "Canlı takip:";
  const line4 = payload.cardAbsoluteUrl;
  const text = [line1, line2, line3, line4].join("\n");
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function normalizeAirportCode(raw: string, fallback = "IST"): string {
  const t = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (!t) return fallback;
  if (t.length >= 3 && t.length <= 4) return t.slice(0, 4);
  if (t.length > 4) return t.slice(0, 3);
  return fallback;
}

export function displayFlightTrackContext(
  f: DisplayFlight,
  searchedAirportCode: string,
  airportTimeZone: string
): {
  trackHref: string;
  airportCode: string;
  dateISO: string;
  originLabel: string;
  destLabel: string;
  estimatedArrivalHm: string;
} {
  const tz = airportTimeZone?.trim() || "UTC";
  const dateISO = localDateInIanaTz(tz);
  const hub = normalizeAirportCode(searchedAirportCode);
  let originLabel: string;
  let destLabel: string;
  if (f.direction === "departure") {
    originLabel =
      f.departureAirportCity ||
      f.originName ||
      hub ||
      f.originCode ||
      DISPLAY_DASH;
    destLabel =
      f.arrivalAirportCity ||
      f.destinationCity ||
      f.destinationCode ||
      DISPLAY_DASH;
  } else {
    originLabel =
      f.departureAirportCity ||
      f.originName ||
      f.destinationCity ||
      f.originCode ||
      DISPLAY_DASH;
    destLabel =
      f.arrivalAirportCity || hub || f.destinationCode || DISPLAY_DASH;
  }
  const estimatedArrivalHm =
    f.estimatedArrivalLocal ||
    f.scheduledArrivalLocal ||
    (f.direction === "arrival" ? f.time : undefined) ||
    f.scheduledDepartureLocal ||
    f.time ||
    DISPLAY_DASH;
  const trackHref = flightCardHref(f.number, hub, dateISO);
  return {
    trackHref,
    airportCode: hub,
    dateISO,
    originLabel,
    destLabel,
    estimatedArrivalHm,
  };
}

export function savedFlightTrackContext(
  f: SavedFlight,
  timeZone = "Europe/Istanbul"
): {
  trackHref: string;
  airportCode: string;
  dateISO: string;
  originLabel: string;
  destLabel: string;
  estimatedArrivalHm: string;
} {
  const dateISO = localDateInIanaTz(timeZone);
  const hub = normalizeAirportCode(f.searchedAirportCode);
  const originLabel = f.departureAirport?.trim() || DISPLAY_DASH;
  const destLabel = f.arrivalAirport?.trim() || DISPLAY_DASH;
  const estimatedArrivalHm =
    f.arrivalTime?.trim() || f.scheduledTime?.trim() || DISPLAY_DASH;
  const trackHref = flightCardHref(f.flightNumber, hub, dateISO);
  return {
    trackHref,
    airportCode: hub,
    dateISO,
    originLabel,
    destLabel,
    estimatedArrivalHm,
  };
}

export function recentFlightTrackContext(
  flightNumber: string,
  route: string,
  timeZone = "Europe/Istanbul"
): {
  trackHref: string;
  airportCode: string;
  dateISO: string;
  originLabel: string;
  destLabel: string;
  estimatedArrivalHm: string;
} {
  const dateISO = localDateInIanaTz(timeZone);
  const parts = route.split("→").map((s) => s.trim());
  const left = parts[0] || "";
  const right = parts[1] || "";
  const codeGuess = /^[A-Z]{3}$/i.test(left)
    ? left.toUpperCase()
    : /^[A-Z]{3}$/i.test(right)
      ? right.toUpperCase()
      : "IST";
  const originLabel = left || DISPLAY_DASH;
  const destLabel = right || DISPLAY_DASH;
  const trackHref = flightCardHref(flightNumber, codeGuess, dateISO);
  return {
    trackHref,
    airportCode: codeGuess,
    dateISO,
    originLabel,
    destLabel,
    estimatedArrivalHm: DISPLAY_DASH,
  };
}

function pairFromAlertText(text: string | undefined): {
  originLabel: string;
  destLabel: string;
} {
  if (!text?.trim()) return { originLabel: "—", destLabel: "—" };
  const m = text.trim().match(/^(.+?)\s*(?:→|->|—>|–>)\s*(.+)$/);
  if (m) {
    return {
      originLabel: (m[1].trim() || "—").slice(0, 42),
      destLabel: (m[2].trim() || "—").slice(0, 42),
    };
  }
  return { originLabel: "—", destLabel: "—" };
}

export function alertFlightTrackContext(
  flightNumber: string,
  hintText?: string,
  timeZone = "Europe/Istanbul"
): {
  trackHref: string;
  airportCode: string;
  dateISO: string;
  originLabel: string;
  destLabel: string;
  estimatedArrivalHm: string;
} {
  const dateISO = localDateInIanaTz(timeZone);
  const hub = "IST";
  const { originLabel, destLabel } = pairFromAlertText(hintText);
  return {
    trackHref: flightCardHref(flightNumber, hub, dateISO),
    airportCode: hub,
    dateISO,
    originLabel,
    destLabel,
    estimatedArrivalHm: "—",
  };
}
