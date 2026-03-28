import { DISPLAY_DASH } from "./displayConstants";
import { formatAirportLocalTime } from "./formatAirportTime";
import type { StatusVisual } from "./flightStatusVisual";
import { inferStatusVisual } from "./flightStatusVisual";
import type {
  AeroAirline,
  AeroAirport,
  AeroAirportFlight,
  AeroMovement,
} from "./flightTypes";

export type StatusTone = "green" | "yellow" | "red" | "gray";

export const MISSING_FIELD_TOOLTIP = "Data not provided by airport";

export type DisplayFlight = {
  id: string;
  number: string;
  /** Airline display name from API when present. */
  airlineName?: string;
  destinationCity: string;
  time: string;
  timeMissing: boolean;
  gate: string;
  gateMissing: boolean;
  terminal: string;
  terminalMissing: boolean;
  direction: "departure" | "arrival";
  statusLabel: string;
  statusTone: StatusTone;
  /** Raw API status string when present (for countdown / alerts). */
  statusRaw?: string;
  /** Semantic color bucket for badges. */
  statusVisual: StatusVisual;
  /** For flight detail / prefetch */
  originCode?: string;
  destinationCode?: string;
  originName?: string;
  scheduledDepartureLocal?: string;
  estimatedDepartureLocal?: string;
  scheduledArrivalLocal?: string;
  estimatedArrivalLocal?: string;
  aircraftModel?: string;
  tailNumber?: string;
  departureAirportCity?: string;
  arrivalAirportCity?: string;
  /** IANA timezone for departure airport when API provides it */
  departureAirportTimeZone?: string;
  arrivalAirportTimeZone?: string;
  actualDepartureLocal?: string;
  actualArrivalLocal?: string;
};

export function mapStatus(status?: string): { label: string; tone: StatusTone } {
  const raw = status?.trim();
  if (!raw) {
    return { label: "Scheduled", tone: "gray" };
  }

  const s = raw.toLowerCase();

  if (s.includes("delayed")) {
    return { label: "Delayed", tone: "yellow" };
  }

  if (s.includes("cancel") || s.includes("divert")) {
    return { label: "Cancelled", tone: "red" };
  }

  if (s.includes("arrived")) {
    return { label: "Arrived", tone: "green" };
  }

  if (
    s.includes("departed") ||
    s.includes("enroute") ||
    s.includes("approaching")
  ) {
    return { label: "Departed", tone: "green" };
  }

  if (
    s.includes("expected") ||
    s.includes("scheduled") ||
    s.includes("boarding") ||
    s.includes("checkin") ||
    s.includes("gateclosed") ||
    s === "unknown"
  ) {
    return { label: "Scheduled", tone: "green" };
  }

  return { label: "Scheduled", tone: "green" };
}

export function formatOptionalField(value: string | null | undefined): string {
  if (value == null) return "-";
  const t = String(value).trim();
  return t.length > 0 ? t : "-";
}

function gateOrTerminal(
  value: string | null | undefined
): { display: string; missing: boolean } {
  if (value == null) return { display: DISPLAY_DASH, missing: true };
  const t = String(value).trim();
  if (!t) return { display: DISPLAY_DASH, missing: true };
  return { display: t, missing: false };
}

export const FLIGHT_TIME_MISSING = "--:--";

function toHHmm(hStr: string, mStr: string): string {
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr, 10);
  if (
    Number.isNaN(h) ||
    Number.isNaN(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    return FLIGHT_TIME_MISSING;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatFlightTime(iso?: string | null): string {
  if (iso == null || typeof iso !== "string") return FLIGHT_TIME_MISSING;
  const trimmed = iso.trim();
  if (!trimmed) return FLIGHT_TIME_MISSING;

  const hmDirect = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hmDirect) {
    return toHHmm(hmDirect[1], hmDirect[2]);
  }

  const isoHm = trimmed.match(/T(\d{1,2}):(\d{2})/);
  if (isoHm) {
    return toHHmm(isoHm[1], isoHm[2]);
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    if (!Number.isNaN(d.getTime())) {
      return toHHmm(String(d.getHours()), String(d.getMinutes()));
    }
  }

  return FLIGHT_TIME_MISSING;
}

function humanReadableCity(airport?: AeroAirport | null): string {
  if (!airport) return DISPLAY_DASH;
  const m = airport.municipalityName?.trim();
  const sh = airport.shortName?.trim();
  const n = airport.name?.trim();
  const label = m || sh || n;
  return label && label.length > 0 ? label : DISPLAY_DASH;
}

function airportTimeZoneIana(airport?: AeroAirport | null): string | undefined {
  if (!airport) return undefined;
  const a =
    airport.timeZone?.trim() ||
    airport.ianaTimeZone?.trim() ||
    undefined;
  return a && a.length > 0 ? a : undefined;
}

function airportIataOrIcao(airport?: AeroAirport | null): string | undefined {
  if (!airport) return undefined;
  const c = (airport.iata || airport.icao || "").trim().toUpperCase();
  return c || undefined;
}

function pickLocalTime(movement?: AeroMovement | null): string | undefined {
  if (!movement) return undefined;
  const raw =
    movement.revisedTime?.local ??
    movement.predictedTime?.local ??
    movement.scheduledTime?.local;
  return raw ?? undefined;
}

function airlineLabel(a?: AeroAirline | null): string | undefined {
  if (!a) return undefined;
  const n = a.name?.trim();
  return n && n.length > 0 ? n : undefined;
}

function pickAirlineName(f: AeroAirportFlight): string | undefined {
  return (
    airlineLabel(f.airline) ??
    airlineLabel(f.carrier) ??
    airlineLabel(f.operator)
  );
}

function pickUtcTime(movement?: AeroMovement | null): string | undefined {
  if (!movement) return undefined;
  const raw =
    movement.revisedTime?.utc ??
    movement.predictedTime?.utc ??
    movement.scheduledTime?.utc;
  const t = raw?.trim();
  return t || undefined;
}

function formatMovementDisplayTime(
  movement: AeroMovement | null | undefined,
  airportTimeZone?: string
): string {
  const actualUtc = movement?.actualTime?.utc?.trim();
  if (actualUtc && airportTimeZone) {
    const z = formatAirportLocalTime(actualUtc, airportTimeZone);
    if (z !== FLIGHT_TIME_MISSING) return z;
  }
  if (actualUtc) {
    const z = formatAirportLocalTime(actualUtc, "UTC");
    if (z !== FLIGHT_TIME_MISSING) return z;
  }
  const utc = pickUtcTime(movement);
  if (utc && airportTimeZone) {
    const z = formatAirportLocalTime(utc, airportTimeZone);
    if (z !== FLIGHT_TIME_MISSING) return z;
  }
  if (utc) {
    const z = formatAirportLocalTime(utc, "UTC");
    if (z !== FLIGHT_TIME_MISSING) return z;
  }
  return formatFlightTime(pickLocalTime(movement));
}

function formatSingleDeparture(
  f: AeroAirportFlight,
  index: number,
  airportTimeZone?: string
): DisplayFlight {
  const local = pickLocalTime(f.departure);
  const depTz = airportTimeZoneIana(f.departure?.airport) ?? airportTimeZone;
  const arrTz = airportTimeZoneIana(f.arrival?.airport) ?? airportTimeZone;
  const { label, tone } = mapStatus(f.status);
  const statusRaw = f.status?.trim() || undefined;
  const statusVisual = inferStatusVisual(statusRaw, label);
  const num = formatOptionalField(f.number);
  const time = formatMovementDisplayTime(f.departure, depTz);
  const gate = gateOrTerminal(f.departure?.gate);
  const terminal = gateOrTerminal(f.departure?.terminal);
  const airlineName = pickAirlineName(f);
  const originCode = airportIataOrIcao(f.departure?.airport);
  const destinationCode = airportIataOrIcao(f.arrival?.airport);
  const originName = humanReadableCity(f.departure?.airport);
  const depCity = humanReadableCity(f.departure?.airport);
  const arrCity = humanReadableCity(f.arrival?.airport);
  const schedDep = formatFlightTime(f.departure?.scheduledTime?.local);
  const estDepRaw =
    f.departure?.revisedTime?.local ?? f.departure?.predictedTime?.local;
  const estDep = formatFlightTime(estDepRaw);
  const schedArr = formatFlightTime(f.arrival?.scheduledTime?.local);
  const estArrRaw =
    f.arrival?.revisedTime?.local ?? f.arrival?.predictedTime?.local;
  const estArr = formatFlightTime(estArrRaw);
  const aircraftModel =
    f.aircraft?.model?.trim() || f.aircraft?.modelCode?.trim() || undefined;
  const tailNumber = f.aircraft?.reg?.trim() || undefined;
  const actDepL = formatFlightTime(f.departure?.actualTime?.local);
  const actArrL = formatFlightTime(f.arrival?.actualTime?.local);
  return {
    id: `dep-${index}-${num}-${local ?? ""}`,
    number: num,
    ...(airlineName ? { airlineName } : {}),
    destinationCity: humanReadableCity(f.arrival?.airport),
    time,
    timeMissing: time === FLIGHT_TIME_MISSING,
    gate: gate.display,
    gateMissing: gate.missing,
    terminal: terminal.display,
    terminalMissing: terminal.missing,
    direction: "departure",
    statusLabel: label,
    statusTone: tone,
    statusVisual,
    ...(statusRaw ? { statusRaw } : {}),
    ...(originCode ? { originCode } : {}),
    ...(destinationCode ? { destinationCode } : {}),
    ...(originName !== DISPLAY_DASH ? { originName } : {}),
    ...(depCity !== DISPLAY_DASH ? { departureAirportCity: depCity } : {}),
    ...(arrCity !== DISPLAY_DASH ? { arrivalAirportCity: arrCity } : {}),
    ...(schedDep !== FLIGHT_TIME_MISSING
      ? { scheduledDepartureLocal: schedDep }
      : {}),
    ...(estDep !== FLIGHT_TIME_MISSING && estDep !== schedDep
      ? { estimatedDepartureLocal: estDep }
      : {}),
    ...(schedArr !== FLIGHT_TIME_MISSING
      ? { scheduledArrivalLocal: schedArr }
      : {}),
    ...(estArr !== FLIGHT_TIME_MISSING && estArr !== schedArr
      ? { estimatedArrivalLocal: estArr }
      : {}),
    ...(aircraftModel ? { aircraftModel } : {}),
    ...(tailNumber ? { tailNumber } : {}),
    ...(depTz ? { departureAirportTimeZone: depTz } : {}),
    ...(arrTz ? { arrivalAirportTimeZone: arrTz } : {}),
    ...(actDepL !== FLIGHT_TIME_MISSING ? { actualDepartureLocal: actDepL } : {}),
    ...(actArrL !== FLIGHT_TIME_MISSING ? { actualArrivalLocal: actArrL } : {}),
  };
}

function formatSingleArrival(
  f: AeroAirportFlight,
  index: number,
  airportTimeZone?: string
): DisplayFlight {
  const local = pickLocalTime(f.arrival);
  const depTz = airportTimeZoneIana(f.departure?.airport) ?? airportTimeZone;
  const arrTz = airportTimeZoneIana(f.arrival?.airport) ?? airportTimeZone;
  const { label, tone } = mapStatus(f.status);
  const statusRaw = f.status?.trim() || undefined;
  const statusVisual = inferStatusVisual(statusRaw, label);
  const num = formatOptionalField(f.number);
  const time = formatMovementDisplayTime(f.arrival, arrTz);
  const gate = gateOrTerminal(f.arrival?.gate);
  const terminal = gateOrTerminal(f.arrival?.terminal);
  const airlineName = pickAirlineName(f);
  const originCode = airportIataOrIcao(f.departure?.airport);
  const destinationCode = airportIataOrIcao(f.arrival?.airport);
  const originName = humanReadableCity(f.departure?.airport);
  const depCity = humanReadableCity(f.departure?.airport);
  const arrCity = humanReadableCity(f.arrival?.airport);
  const schedDep = formatFlightTime(f.departure?.scheduledTime?.local);
  const estDepRaw =
    f.departure?.revisedTime?.local ?? f.departure?.predictedTime?.local;
  const estDep = formatFlightTime(estDepRaw);
  const schedArr = formatFlightTime(f.arrival?.scheduledTime?.local);
  const estArrRaw =
    f.arrival?.revisedTime?.local ?? f.arrival?.predictedTime?.local;
  const estArr = formatFlightTime(estArrRaw);
  const aircraftModel =
    f.aircraft?.model?.trim() || f.aircraft?.modelCode?.trim() || undefined;
  const tailNumber = f.aircraft?.reg?.trim() || undefined;
  const actDepL = formatFlightTime(f.departure?.actualTime?.local);
  const actArrL = formatFlightTime(f.arrival?.actualTime?.local);
  return {
    id: `arr-${index}-${num}-${local ?? ""}`,
    number: num,
    ...(airlineName ? { airlineName } : {}),
    destinationCity: humanReadableCity(f.departure?.airport),
    time,
    timeMissing: time === FLIGHT_TIME_MISSING,
    gate: gate.display,
    gateMissing: gate.missing,
    terminal: terminal.display,
    terminalMissing: terminal.missing,
    direction: "arrival",
    statusLabel: label,
    statusTone: tone,
    statusVisual,
    ...(statusRaw ? { statusRaw } : {}),
    ...(originCode ? { originCode } : {}),
    ...(destinationCode ? { destinationCode } : {}),
    ...(originName !== DISPLAY_DASH ? { originName } : {}),
    ...(depCity !== DISPLAY_DASH ? { departureAirportCity: depCity } : {}),
    ...(arrCity !== DISPLAY_DASH ? { arrivalAirportCity: arrCity } : {}),
    ...(schedDep !== FLIGHT_TIME_MISSING
      ? { scheduledDepartureLocal: schedDep }
      : {}),
    ...(estDep !== FLIGHT_TIME_MISSING && estDep !== schedDep
      ? { estimatedDepartureLocal: estDep }
      : {}),
    ...(schedArr !== FLIGHT_TIME_MISSING
      ? { scheduledArrivalLocal: schedArr }
      : {}),
    ...(estArr !== FLIGHT_TIME_MISSING && estArr !== schedArr
      ? { estimatedArrivalLocal: estArr }
      : {}),
    ...(aircraftModel ? { aircraftModel } : {}),
    ...(tailNumber ? { tailNumber } : {}),
    ...(depTz ? { departureAirportTimeZone: depTz } : {}),
    ...(arrTz ? { arrivalAirportTimeZone: arrTz } : {}),
    ...(actDepL !== FLIGHT_TIME_MISSING ? { actualDepartureLocal: actDepL } : {}),
    ...(actArrL !== FLIGHT_TIME_MISSING ? { actualArrivalLocal: actArrL } : {}),
  };
}

export function formatFlightsFromApi(
  departures: AeroAirportFlight[] | null | undefined,
  arrivals: AeroAirportFlight[] | null | undefined,
  options?: { airportTimeZone?: string }
): DisplayFlight[] {
  const tz = options?.airportTimeZone;
  const dep = (departures ?? []).map((f, i) =>
    formatSingleDeparture(f, i, tz)
  );
  const arr = (arrivals ?? []).map((f, i) => formatSingleArrival(f, i, tz));
  const combined = [...dep, ...arr];

  const unique = new Map<string, DisplayFlight>();
  for (const f of combined) {
    const key = `${f.number}${f.time}`;
    if (!unique.has(key)) {
      unique.set(key, f);
    }
  }
  return Array.from(unique.values());
}
