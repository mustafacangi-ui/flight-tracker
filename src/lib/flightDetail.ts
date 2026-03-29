import { DISPLAY_DASH } from "./displayConstants";
import {
  formatFlightTime,
  mapStatus,
  FLIGHT_TIME_MISSING,
  type DisplayFlight,
  type StatusTone,
} from "./formatFlights";
import type {
  AeroAirline,
  AeroAirport,
  AeroAirportFlight,
  AeroMovement,
} from "./flightTypes";

export type FlightEndpointDetail = {
  code: string;
  name: string;
  scheduledLocal?: string;
  estimatedLocal?: string;
  actualLocal?: string;
  scheduledUtc?: string;
  estimatedUtc?: string;
  actualUtc?: string;
  /** IANA timezone when present on nested airport */
  timeZone?: string;
};

/** Prior leg for same tail ending at this departure airport (from FIDS sweep). */
export type PreviousLegFromApi = {
  flightNumber: string;
  from: string;
  to: string;
  arrivalLocal?: string;
  turnaroundMinutes?: number;
  turnaroundLabel?: string;
};

export type FlightDetailPayload = {
  flightNumber: string;
  airlineName?: string;
  statusRaw: string;
  statusLabel: string;
  statusTone: StatusTone;
  direction: "departure" | "arrival";
  contextAirportCode: string;
  departure: FlightEndpointDetail;
  arrival: FlightEndpointDetail;
  gate: string;
  terminal: string;
  gateMissing: boolean;
  terminalMissing: boolean;
  aircraftModel?: string;
  tailNumber?: string;
  /** IANA — departure airport */
  departureTimeZone?: string;
  /** IANA — arrival airport */
  arrivalTimeZone?: string;
  previousLeg?: PreviousLegFromApi;
};

export type AircraftHistoryItem = {
  number: string;
  route: string;
  departureTime: string;
  arrivalTime: string;
  status: string;
};

export function normalizeFlightNumberKey(raw: string): string {
  try {
    return decodeURIComponent(raw).replace(/\s+/g, "").toUpperCase();
  } catch {
    return raw.replace(/\s+/g, "").toUpperCase();
  }
}

function airportMovementCode(a?: AeroAirport | null): string {
  if (!a) return "";
  const i = a.iata?.trim().toUpperCase() ?? "";
  const c = a.icao?.trim().toUpperCase() ?? "";
  return i || c;
}

function flightTouchesAirport(f: AeroAirportFlight, airportCode: string): boolean {
  const ac = airportCode.trim().toUpperCase();
  const dep = airportMovementCode(f.departure?.airport);
  const arr = airportMovementCode(f.arrival?.airport);
  return dep === ac || arr === ac;
}

export function findFlightInFids(
  departures: AeroAirportFlight[],
  arrivals: AeroAirportFlight[],
  flightNumberParam: string,
  airportCode: string
): AeroAirportFlight | null {
  const target = normalizeFlightNumberKey(flightNumberParam);
  const all = [...departures, ...arrivals];
  const matches = all.filter(
    (f) => normalizeFlightNumberKey(f.number) === target && flightTouchesAirport(f, airportCode)
  );
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  const ac = airportCode.trim().toUpperCase();
  const depAt = matches.find(
    (f) => airportMovementCode(f.departure?.airport) === ac
  );
  return depAt ?? matches[0];
}

function airlineName(f: AeroAirportFlight): string | undefined {
  const pick = (a?: AeroAirline | null) => {
    const n = a?.name?.trim();
    return n && n.length > 0 ? n : undefined;
  };
  return pick(f.airline) ?? pick(f.carrier) ?? pick(f.operator);
}

function airportDisplayName(a?: AeroAirport | null): string {
  if (!a) return DISPLAY_DASH;
  const m = a.municipalityName?.trim();
  const sh = a.shortName?.trim();
  const n = a.name?.trim();
  const label = m || sh || n;
  return label && label.length > 0 ? label : DISPLAY_DASH;
}

function airportTimeZoneFromMovement(
  movement?: AeroMovement | null
): string | undefined {
  const a = movement?.airport;
  if (!a) return undefined;
  const z = a.timeZone?.trim() || a.ianaTimeZone?.trim();
  return z && z.length > 0 ? z : undefined;
}

function movementBestUtcMs(m?: AeroMovement | null): number | null {
  if (!m) return null;
  return (
    parseUtcMs(m.actualTime?.utc) ??
    parseUtcMs(m.revisedTime?.utc) ??
    parseUtcMs(m.predictedTime?.utc) ??
    parseUtcMs(m.scheduledTime?.utc)
  );
}

export function findPreviousLegFromFids(
  f: AeroAirportFlight,
  all: AeroAirportFlight[]
): PreviousLegFromApi | null {
  const reg = f.aircraft?.reg?.trim().toUpperCase();
  if (!reg) return null;
  const depCode = airportMovementCode(f.departure?.airport);
  if (!depCode) return null;
  const currentDepMs = movementBestUtcMs(f.departure);
  if (currentDepMs == null) return null;

  let best: AeroAirportFlight | null = null;
  let bestArrMs = -1;

  for (const other of all) {
    if (other === f) continue;
    const oreg = other.aircraft?.reg?.trim().toUpperCase();
    if (!oreg || oreg !== reg) continue;
    const arrAp = airportMovementCode(other.arrival?.airport);
    if (arrAp !== depCode) continue;
    const arrMs = movementBestUtcMs(other.arrival);
    if (arrMs == null || arrMs >= currentDepMs) continue;
    if (arrMs > bestArrMs) {
      bestArrMs = arrMs;
      best = other;
    }
  }

  if (!best) return null;

  const from = airportMovementCode(best.departure?.airport) || DISPLAY_DASH;
  const to = airportMovementCode(best.arrival?.airport) || DISPLAY_DASH;
  const arrLocalRaw =
    best.arrival?.actualTime?.local?.trim() ??
    best.arrival?.revisedTime?.local?.trim() ??
    best.arrival?.predictedTime?.local?.trim() ??
    best.arrival?.scheduledTime?.local?.trim();
  const arrLocalFormatted = arrLocalRaw
    ? formatFlightTime(arrLocalRaw)
    : undefined;
  const turnaroundMin = Math.round((currentDepMs - bestArrMs) / 60_000);
  const turnaroundLabel =
    turnaroundMin >= 0 && turnaroundMin < 36 * 60
      ? `${turnaroundMin} min`
      : undefined;

  return {
    flightNumber: best.number.trim(),
    from,
    to,
    ...(arrLocalFormatted && arrLocalFormatted !== FLIGHT_TIME_MISSING
      ? { arrivalLocal: arrLocalFormatted }
      : {}),
    ...(turnaroundMin >= 0 ? { turnaroundMinutes: turnaroundMin } : {}),
    ...(turnaroundLabel ? { turnaroundLabel } : {}),
  };
}

function endpointDetail(movement?: AeroMovement | null): FlightEndpointDetail {
  const a = movement?.airport;
  const code = airportMovementCode(a) || DISPLAY_DASH;
  const name = airportDisplayName(a);
  const schedL = movement?.scheduledTime?.local?.trim();
  const revL = movement?.revisedTime?.local?.trim();
  const predL = movement?.predictedTime?.local?.trim();
  const actL = movement?.actualTime?.local?.trim();
  const schedU = movement?.scheduledTime?.utc?.trim();
  const revU = movement?.revisedTime?.utc?.trim();
  const predU = movement?.predictedTime?.utc?.trim();
  const actU = movement?.actualTime?.utc?.trim();
  const estimatedLocal = revL || predL;
  const estimatedUtc = revU || predU;
  const tz = airportTimeZoneFromMovement(movement);
  return {
    code,
    name,
    ...(schedL ? { scheduledLocal: formatFlightTime(schedL) } : {}),
    ...(estimatedLocal && estimatedLocal !== schedL
      ? { estimatedLocal: formatFlightTime(estimatedLocal) }
      : {}),
    ...(actL ? { actualLocal: formatFlightTime(actL) } : {}),
    ...(schedU ? { scheduledUtc: schedU } : {}),
    ...(estimatedUtc && estimatedUtc !== schedU
      ? { estimatedUtc: estimatedUtc }
      : {}),
    ...(actU ? { actualUtc: actU } : {}),
    ...(tz ? { timeZone: tz } : {}),
  };
}

function gateTerminal(movement?: AeroMovement | null): {
  gate: string;
  terminal: string;
  gateMissing: boolean;
  terminalMissing: boolean;
} {
  const g = movement?.gate;
  const t = movement?.terminal;
  const gateStr =
    g != null && String(g).trim() ? String(g).trim() : DISPLAY_DASH;
  const termStr =
    t != null && String(t).trim() ? String(t).trim() : DISPLAY_DASH;
  return {
    gate: gateStr,
    terminal: termStr,
    gateMissing: gateStr === DISPLAY_DASH,
    terminalMissing: termStr === DISPLAY_DASH,
  };
}

function pickAircraft(f: AeroAirportFlight): { model?: string; tail?: string } {
  const ac = f.aircraft;
  if (!ac) return {};
  const model = ac.model?.trim() || ac.modelCode?.trim() || undefined;
  const tail = ac.reg?.trim() || undefined;
  return { model, tail };
}

function inferDirection(
  f: AeroAirportFlight,
  airportCode: string
): "departure" | "arrival" {
  const ac = airportCode.trim().toUpperCase();
  const dep = airportMovementCode(f.departure?.airport);
  if (dep === ac) return "departure";
  return "arrival";
}

export function buildFlightDetailPayload(
  f: AeroAirportFlight,
  airportCode: string,
  options?: { allFlights?: AeroAirportFlight[] }
): FlightDetailPayload {
  const { label, tone } = mapStatus(f.status);
  const dir = inferDirection(f, airportCode);
  const movement = dir === "departure" ? f.departure : f.arrival;
  const gt = gateTerminal(movement);
  const ac = pickAircraft(f);
  const depTz = airportTimeZoneFromMovement(f.departure);
  const arrTz = airportTimeZoneFromMovement(f.arrival);
  const previousLeg =
    options?.allFlights && options.allFlights.length > 0
      ? findPreviousLegFromFids(f, options.allFlights)
      : undefined;
  return {
    flightNumber: f.number.trim(),
    ...(airlineName(f) ? { airlineName: airlineName(f) } : {}),
    statusRaw: f.status,
    statusLabel: label,
    statusTone: tone,
    direction: dir,
    contextAirportCode: airportCode.trim().toUpperCase(),
    departure: endpointDetail(f.departure),
    arrival: endpointDetail(f.arrival),
    gate: gt.gate,
    terminal: gt.terminal,
    gateMissing: gt.gateMissing,
    terminalMissing: gt.terminalMissing,
    ...(ac.model ? { aircraftModel: ac.model } : {}),
    ...(ac.tail ? { tailNumber: ac.tail } : {}),
    ...(depTz ? { departureTimeZone: depTz } : {}),
    ...(arrTz ? { arrivalTimeZone: arrTz } : {}),
    ...(previousLeg ? { previousLeg } : {}),
  };
}

export function parseUtcMs(iso?: string | null): number | null {
  if (!iso || typeof iso !== "string") return null;
  const t = Date.parse(iso.trim());
  return Number.isNaN(t) ? null : t;
}

export type RouteProgressState = {
  phaseLabel: string;
  progressPct: number;
  sublabel?: string;
};

export function computeRouteProgress(
  detail: FlightDetailPayload,
  nowMs: number = Date.now()
): RouteProgressState {
  const depMs =
    parseUtcMs(detail.departure.actualUtc) ??
    parseUtcMs(detail.departure.estimatedUtc) ??
    parseUtcMs(detail.departure.scheduledUtc);
  const arrMs =
    parseUtcMs(detail.arrival.actualUtc) ??
    parseUtcMs(detail.arrival.estimatedUtc) ??
    parseUtcMs(detail.arrival.scheduledUtc);

  const raw = detail.statusRaw.toLowerCase();
  if (raw.includes("board")) {
    return {
      phaseLabel: "Boarding",
      progressPct: depMs && nowMs < depMs ? 6 : 12,
      sublabel: depMs && nowMs < depMs ? departInLabel(depMs, nowMs) : undefined,
    };
  }

  const delayedMin = delayMinutesLabel(detail);

  if (detail.statusLabel === "Delayed" && delayedMin != null) {
    return {
      phaseLabel: `Delayed ${delayedMin} min`,
      progressPct: estimateProgressFromStatus(detail, depMs, arrMs, nowMs),
      sublabel: relativeEtaLabel(depMs, arrMs, nowMs),
    };
  }

  const s = detail.statusLabel.toLowerCase();
  if (s.includes("cancel")) {
    return { phaseLabel: "Cancelled", progressPct: 0 };
  }
  if (s.includes("land") || s.includes("arriv")) {
    return {
      phaseLabel: "Landed",
      progressPct: 100,
      sublabel:
        arrMs != null ? relativeArrLabel(arrMs, nowMs) : undefined,
    };
  }
  if (s.includes("depart") || s.includes("enroute") || s.includes("approach")) {
    const pct = progressFromTimes(depMs, arrMs, nowMs);
    const parts: string[] = [];
    if (
      depMs != null &&
      arrMs != null &&
      nowMs > depMs &&
      nowMs < arrMs
    ) {
      const dm = Math.round((nowMs - depMs) / 60_000);
      if (dm > 0) parts.push(`Departed ${dm} min ago`);
    }
    const eta = relativeEtaLabel(depMs, arrMs, nowMs);
    if (eta) parts.push(eta);
    return {
      phaseLabel: pct < 15 ? "Taxiing" : pct < 92 ? "In air" : "Approach",
      progressPct: pct,
      sublabel: parts.length > 0 ? parts.join(" · ") : undefined,
    };
  }

  return {
    phaseLabel: "Scheduled",
    progressPct: progressFromTimes(depMs, arrMs, nowMs),
    sublabel:
      depMs && nowMs < depMs
        ? departInLabel(depMs, nowMs)
        : relativeEtaLabel(depMs, arrMs, nowMs),
  };
}

function estimateProgressFromStatus(
  d: FlightDetailPayload,
  depMs: number | null,
  arrMs: number | null,
  nowMs: number
): number {
  const base = progressFromTimes(depMs, arrMs, nowMs);
  if (d.statusLabel === "Delayed") return Math.min(95, Math.max(base, 25));
  return base;
}

function progressFromTimes(
  depMs: number | null,
  arrMs: number | null,
  nowMs: number
): number {
  if (depMs == null || arrMs == null || arrMs <= depMs) return 0;
  if (nowMs <= depMs) return 0;
  if (nowMs >= arrMs) return 100;
  return Math.round(((nowMs - depMs) / (arrMs - depMs)) * 100);
}

function departInLabel(depMs: number, nowMs: number): string | undefined {
  const m = Math.round((depMs - nowMs) / 60_000);
  if (m <= 0) return undefined;
  return `Departs in ${m} min`;
}

function relativeEtaLabel(
  depMs: number | null,
  arrMs: number | null,
  nowMs: number
): string | undefined {
  if (arrMs == null) return undefined;
  if (nowMs >= arrMs) return relativeArrLabel(arrMs, nowMs);
  const m = Math.round((arrMs - nowMs) / 60_000);
  if (m <= 0) return undefined;
  if (depMs && nowMs < depMs) return undefined;
  return `Landing in ${m} min`;
}

function relativeArrLabel(arrMs: number, nowMs: number): string | undefined {
  const m = Math.round((nowMs - arrMs) / 60_000);
  if (m <= 0) return undefined;
  if (m > 24 * 60) return undefined;
  return `Landed ${m} min ago`;
}

export function delayMinutesLabel(d: FlightDetailPayload): number | null {
  const depS = d.departure.scheduledLocal;
  const depE = d.departure.estimatedLocal;
  if (!depS || !depE || depS === depE) return null;
  const toMin = (x: string) => {
    const p = x.match(/^(\d{1,2}):(\d{2})$/);
    if (!p) return null;
    return Number(p[1]) * 60 + Number(p[2]);
  };
  const a = toMin(depS);
  const b = toMin(depE);
  if (a == null || b == null) return null;
  const diff = b - a;
  return diff > 0 ? diff : null;
}

export type FakeEvent = { time: string; label: string };

function addMinutesToHHmm(hhmm: string, deltaMin: number): string {
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return hhmm;
  let h = Number(m[1]);
  let mi = Number(m[2]) + deltaMin;
  h += Math.floor(mi / 60);
  mi = ((mi % 60) + 60) % 60;
  h = ((h % 24) + 24) % 24;
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

export function buildPlaceholderTimeline(detail: FlightDetailPayload): FakeEvent[] {
  const dep =
    detail.departure.scheduledLocal ??
    detail.departure.estimatedLocal ??
    "12:00";
  const arr =
    detail.arrival.scheduledLocal ??
    detail.arrival.estimatedLocal ??
    "14:00";
  if (dep === "--:--" && arr === "--:--") {
    return [
      { time: "--:--", label: "Scheduled departure" },
      { time: "--:--", label: "Scheduled arrival" },
    ];
  }
  return [
    { time: addMinutesToHHmm(dep, -40), label: "Boarding started" },
    { time: addMinutesToHHmm(dep, -25), label: "Gate opened" },
    { time: addMinutesToHHmm(dep, -3), label: "Pushback" },
    { time: addMinutesToHHmm(dep, 3), label: "Takeoff" },
    { time: addMinutesToHHmm(arr, -4), label: "Landing" },
    { time: addMinutesToHHmm(arr, 7), label: "Arrived at gate" },
  ];
}

export type DelayRiskLevel = "low" | "medium" | "high";

export function computeDelayRisk(args: {
  detail: FlightDetailPayload;
  previousLegDelayed?: boolean;
  turnaroundMinutes?: number | null;
  landedRecently?: boolean;
}): DelayRiskLevel {
  const { detail, previousLegDelayed, turnaroundMinutes, landedRecently } = args;
  let score = 0;
  if (detail.statusLabel === "Delayed") score += 2;
  if (previousLegDelayed) score += 2;
  if (landedRecently) score += 1;
  if (turnaroundMinutes != null && turnaroundMinutes < 45) score += 2;
  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  return "low";
}

/** Merge session DisplayFlight snapshot with API detail for instant paint. */
export function displayFlightToPrefetchPayload(
  f: DisplayFlight,
  airportCode: string
): FlightDetailPayload {
  const depCode = f.originCode?.trim() || DISPLAY_DASH;
  const arrCode = f.destinationCode?.trim() || DISPLAY_DASH;
  return {
    flightNumber: f.number,
    ...(f.airlineName ? { airlineName: f.airlineName } : {}),
    statusRaw: f.statusRaw ?? f.statusLabel,
    statusLabel: f.statusLabel,
    statusTone: f.statusTone,
    direction: f.direction,
    contextAirportCode: airportCode.trim().toUpperCase(),
    departure: {
      code: depCode,
      name: f.departureAirportCity ?? f.originName ?? DISPLAY_DASH,
      ...(f.scheduledDepartureLocal
        ? { scheduledLocal: f.scheduledDepartureLocal }
        : {}),
      ...(f.estimatedDepartureLocal
        ? { estimatedLocal: f.estimatedDepartureLocal }
        : {}),
      ...(f.actualDepartureLocal
        ? { actualLocal: f.actualDepartureLocal }
        : {}),
      ...(f.departureAirportTimeZone
        ? { timeZone: f.departureAirportTimeZone }
        : {}),
    },
    arrival: {
      code: arrCode,
      name: f.arrivalAirportCity ?? f.destinationCity ?? DISPLAY_DASH,
      ...(f.scheduledArrivalLocal
        ? { scheduledLocal: f.scheduledArrivalLocal }
        : {}),
      ...(f.estimatedArrivalLocal
        ? { estimatedLocal: f.estimatedArrivalLocal }
        : {}),
      ...(f.actualArrivalLocal ? { actualLocal: f.actualArrivalLocal } : {}),
      ...(f.arrivalAirportTimeZone
        ? { timeZone: f.arrivalAirportTimeZone }
        : {}),
    },
    gate: f.gate,
    terminal: f.terminal,
    gateMissing: f.gateMissing,
    terminalMissing: f.terminalMissing,
    ...(f.aircraftModel ? { aircraftModel: f.aircraftModel } : {}),
    ...(f.tailNumber ? { tailNumber: f.tailNumber } : {}),
    ...(f.departureAirportTimeZone
      ? { departureTimeZone: f.departureAirportTimeZone }
      : {}),
    ...(f.arrivalAirportTimeZone
      ? { arrivalTimeZone: f.arrivalAirportTimeZone }
      : {}),
  };
}

const SESSION_PREFIX = "flightDetail:";

export function sessionStorageKey(flightId: string, airport: string): string {
  return `${SESSION_PREFIX}${normalizeFlightNumberKey(flightId)}:${airport.trim().toUpperCase()}`;
}

export function readFlightDetailFromSession(
  flightId: string,
  airport: string
): FlightDetailPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(sessionStorageKey(flightId, airport));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as FlightDetailPayload;
  } catch {
    return null;
  }
}

export function writeFlightDetailToSession(
  flightId: string,
  airport: string,
  payload: FlightDetailPayload
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      sessionStorageKey(flightId, airport),
      JSON.stringify(payload)
    );
  } catch {
    /* quota */
  }
}
