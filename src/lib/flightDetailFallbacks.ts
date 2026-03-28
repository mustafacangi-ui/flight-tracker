import type {
  FlightDetail,
  FlightTimelineEvent,
} from "./flightDetailsTypes";

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pick<T>(seed: string, arr: T[]): T {
  return arr[hashSeed(seed) % arr.length];
}

export function parseHmToMinutes(t?: string | null): number | null {
  if (!t?.trim()) return null;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function formatMinutesAsHm(total: number): string {
  const t = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function airlineFromFlightNumber(fn: string): string {
  const code = fn.trim().toUpperCase().match(/^([A-Z]{1,3})/)?.[1] ?? "";
  const map: Record<string, string> = {
    TK: "Turkish Airlines",
    LH: "Lufthansa",
    PC: "Pegasus Airlines",
    BA: "British Airways",
    AF: "Air France",
    EK: "Emirates",
    QR: "Qatar Airways",
  };
  return map[code] ?? `${code || "Flight"} Operator`;
}

function defaultAirports(seed: string): {
  depCode: string;
  arrCode: string;
  depName: string;
  arrName: string;
  depCity: string;
  arrCity: string;
} {
  const hubs = [
    ["IST", "Istanbul Airport", "Istanbul", "SAW", "Sabiha Gökçen", "Istanbul"],
    ["DUS", "Düsseldorf", "Düsseldorf", "MUC", "Munich", "Munich"],
    ["LHR", "Heathrow", "London", "JFK", "JFK", "New York"],
    ["DXB", "Dubai International", "Dubai", "SIN", "Changi", "Singapore"],
  ] as const;
  const row = pick(seed, [...hubs]);
  return {
    depCode: row[0],
    depName: row[1],
    depCity: row[2],
    arrCode: row[3],
    arrName: row[4],
    arrCity: row[5],
  };
}

const GATES = [
  "A4",
  "A12",
  "B12",
  "B22",
  "C7",
  "C15",
  "D3",
  "D9",
  "E21",
  "F8",
] as const;
const TERMINALS = ["1", "2", "A", "B", "T1", "T2"] as const;
const TAILS = [
  "TC-LGR",
  "TC-JSH",
  "D-AINA",
  "G-EUPT",
  "A6-EDF",
  "TC-RBA",
] as const;
const TYPES = [
  "Airbus A321neo",
  "Airbus A320neo",
  "Boeing 737-800",
  "Boeing 787-9",
  "Airbus A330-300",
] as const;

const TIMELINE_LABELS = [
  "Boarding",
  "Gate assigned",
  "Pushback",
  "Taxi",
  "Takeoff",
  "Cruising",
  "Descending",
  "Landed",
  "At gate",
] as const;

function syntheticTimeline(
  seed: string,
  schedDep: string,
  schedArr: string,
  progressPct: number
): FlightTimelineEvent[] {
  const depM = parseHmToMinutes(schedDep) ?? 10 * 60;
  let arrM = parseHmToMinutes(schedArr) ?? depM + 120;
  if (arrM <= depM) arrM += 24 * 60;
  const span = Math.max(30, arrM - depM);
  const offsets = [-40, -28, -18, -10, 0, span * 0.35, span * 0.72, span * 0.92, span + 6];
  const n = TIMELINE_LABELS.length;
  return TIMELINE_LABELS.map((label, i) => {
    const t = formatMinutesAsHm(depM + offsets[i]);
    let state: FlightTimelineEvent["state"] = "upcoming";
    const step = (i + 0.5) / n;
    const p = progressPct / 100;
    if (p >= step) state = "completed";
    else if (p >= i / n) state = "active";
    return { time: t, label, state };
  });
}

/** Progress 0–100 from schedule vs current local clock (same-day heuristic). */
export function scheduleProgressPercent(detail: FlightDetail, now = new Date()): number {
  const dep =
    parseHmToMinutes(detail.actualDepartureTime) ??
    parseHmToMinutes(detail.estimatedDepartureTime) ??
    parseHmToMinutes(detail.departureTime);
  const arr =
    parseHmToMinutes(detail.actualArrivalTime) ??
    parseHmToMinutes(detail.estimatedArrivalTime) ??
    parseHmToMinutes(detail.arrivalTime);
  if (dep == null || arr == null) return 0;
  let arrT = arr;
  if (arrT <= dep) arrT += 24 * 60;
  const n = now.getHours() * 60 + now.getMinutes();
  let nt = n;
  if (nt < dep - 3 * 60) nt += 24 * 60;
  const raw = ((nt - dep) / (arrT - dep)) * 100;
  return Math.max(0, Math.min(100, raw));
}

/**
 * Fills missing flight detail fields so the UI never looks empty.
 * Preserves any defined API/mock values.
 */
export function mergeFlightDetailWithFallbacks(detail: FlightDetail): FlightDetail {
  const seed = detail.flightNumber || "UNK";
  const ap = defaultAirports(seed);

  const depCode = detail.departureAirportCode?.trim() || ap.depCode;
  const arrCode = detail.arrivalAirportCode?.trim() || ap.arrCode;
  const depName =
    detail.departureAirportName?.trim() || `${ap.depName} (${depCode})`;
  const arrName =
    detail.arrivalAirportName?.trim() || `${ap.arrName} (${arrCode})`;
  const depCity = detail.departureCity?.trim() || ap.depCity;
  const arrCity = detail.arrivalCity?.trim() || ap.arrCity;

  let departureTime = detail.departureTime?.trim();
  let arrivalTime = detail.arrivalTime?.trim();
  if (!departureTime) departureTime = pick(seed, ["08:15", "10:40", "14:20", "18:45"]);
  if (!arrivalTime) {
    const dm = parseHmToMinutes(departureTime) ?? 600;
    arrivalTime = formatMinutesAsHm(dm + 120 + (hashSeed(seed) % 180));
  }

  const gate = detail.gate?.trim() || pick(seed, [...GATES]);
  const terminal =
    (detail.departureTerminal ?? detail.terminal)?.trim() ||
    pick(seed, [...TERMINALS]);
  const arrivalGate = detail.arrivalGate?.trim() || pick(`${seed}-arr`, [...GATES]);
  const arrivalTerminal =
    detail.arrivalTerminal?.trim() || pick(`${seed}-at`, [...TERMINALS]);

  const aircraftType = detail.aircraftType?.trim() || pick(seed, [...TYPES]);
  const tailNumber = detail.tailNumber?.trim() || pick(seed, [...TAILS]);
  const airlineName = detail.airlineName?.trim() || airlineFromFlightNumber(seed);
  const status = detail.status?.trim() || "Scheduled";
  const statusTone = detail.statusTone ?? "gray";

  const schedProg = scheduleProgressPercent(
    {
      ...detail,
      departureTime,
      arrivalTime,
      estimatedDepartureTime: detail.estimatedDepartureTime ?? departureTime,
      estimatedArrivalTime: detail.estimatedArrivalTime ?? arrivalTime,
    },
    new Date()
  );
  const progressPercent =
    detail.progressPercent != null
      ? Math.min(100, Math.max(0, detail.progressPercent))
      : schedProg;

  let timelineEvents = detail.timelineEvents;
  if (!timelineEvents?.length) {
    timelineEvents = syntheticTimeline(
      seed,
      departureTime,
      arrivalTime,
      progressPercent
    );
  }

  const durationFallback =
    detail.stats?.duration?.trim() ||
    (() => {
      const a = parseHmToMinutes(arrivalTime);
      const d = parseHmToMinutes(departureTime);
      if (a == null || d == null) return "2h 15m";
      let diff = a - d;
      if (diff < 0) diff += 24 * 60;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return m ? `${h}h ${m}m` : `${h}h`;
    })();

  const stats = {
    ...detail.stats,
    duration: detail.stats?.duration || durationFallback,
    distance: detail.stats?.distance || pick(seed, ["892 nm", "1,247 nm", "412 nm"]),
  };

  return {
    ...detail,
    airlineName,
    status,
    statusTone,
    departureAirportCode: depCode,
    arrivalAirportCode: arrCode,
    departureAirportName: depName,
    arrivalAirportName: arrName,
    departureCity: depCity,
    arrivalCity: arrCity,
    departureTime,
    arrivalTime,
    estimatedDepartureTime:
      detail.estimatedDepartureTime?.trim() || departureTime,
    estimatedArrivalTime: detail.estimatedArrivalTime?.trim() || arrivalTime,
    gate,
    terminal: detail.terminal?.trim() || terminal,
    departureTerminal: detail.departureTerminal?.trim() || terminal,
    arrivalTerminal,
    arrivalGate,
    aircraftType,
    tailNumber,
    aircraftAgeYears:
      detail.aircraftAgeYears != null
        ? detail.aircraftAgeYears
        : 3 + (hashSeed(seed) % 12) * 0.3,
    seatCount: detail.seatCount ?? [180, 186, 212, 294][hashSeed(seed) % 4],
    seatLayout: detail.seatLayout?.trim() || "3-3",
    registrationCountry:
      detail.registrationCountry?.trim() ||
      pick(seed, ["Türkiye", "Germany", "United Kingdom", "UAE"]),
    progressPercent,
    timelineEvents,
    stats,
  };
}
