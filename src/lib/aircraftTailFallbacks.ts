import type {
  AircraftHistoryItem,
  AircraftTailTracking,
  FlightDetail,
} from "./flightDetailsTypes";
import {
  formatMinutesAsHm,
  parseHmToMinutes,
} from "./flightDetailFallbacks";

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

const HUBS = ["IST", "SAW", "FRA", "MUC", "LHR", "AYT", "ESB", "ADB"] as const;

function inboundOrigin(dep: string, seed: string): string {
  const d = dep.toUpperCase();
  const others = HUBS.filter((x) => x !== d);
  if (others.length === 0) return "FRA";
  return pick(seed, [...others]);
}

function syntheticPrevFlightNumber(fn: string): string {
  const m = fn.trim().toUpperCase().match(/^([A-Z]{1,3})/);
  const prefix = m?.[1] ?? "XX";
  const n = 1000 + (hashSeed(fn) % 899);
  return `${prefix}${n}`;
}

function buildSyntheticHistory(d: FlightDetail): AircraftHistoryItem[] {
  const dep = d.departureAirportCode?.trim() || "DEP";
  const arr = d.arrivalAirportCode?.trim() || "ARR";
  const fn = d.flightNumber.trim();
  const seed = fn;
  const prevHub = inboundOrigin(dep, seed);
  const prevFn = syntheticPrevFlightNumber(fn);
  const depM = parseHmToMinutes(d.departureTime ?? "12:00") ?? 12 * 60;
  const prevDepM = depM - 180 + (hashSeed(seed) % 60);
  const prevArrM = depM - 55 - (hashSeed(seed + "x") % 30);
  const prevDep = formatMinutesAsHm(prevDepM);
  const prevArr = formatMinutesAsHm(prevArrM);

  const base: AircraftHistoryItem[] = [
    {
      flightNumber: prevFn,
      from: prevHub,
      to: dep,
      departureTime: prevDep,
      arrivalTime: prevArr,
      status: "Landed",
      dayGroup: "today",
      onTime: true,
      turnaroundFromPrevMinutes: 45 + (hashSeed(seed) % 40),
    },
    {
      flightNumber: fn,
      from: dep,
      to: arr,
      departureTime: d.departureTime,
      arrivalTime: d.arrivalTime,
      status: d.status?.trim() || "Scheduled",
      dayGroup: "today",
      isCurrent: true,
      delayed: d.delayRiskLevel === "high",
    },
  ];

  if (d.nextFlight) {
    base.push({
      flightNumber: d.nextFlight.flightNumber,
      from: d.nextFlight.from,
      to: d.nextFlight.to,
      departureTime: d.nextFlight.departureTime,
      status: "Scheduled",
      dayGroup: "today",
      onTime: true,
    });
  } else {
    const nextTo = pick(`${seed}-nx`, [...HUBS].filter((x) => x !== arr));
    base.push({
      flightNumber: "Next leg (TBA)",
      from: arr,
      to: nextTo,
      departureTime: "—",
      status: "Placeholder",
      dayGroup: "today",
    });
  }

  return base;
}

function ensureHistory(d: FlightDetail): AircraftHistoryItem[] {
  const arr = d.arrivalAirportCode?.trim() || "ARR";
  const fn = d.flightNumber.trim();
  const existing = [...(d.history ?? [])];
  const hasCurrent = existing.some((h) => h.isCurrent);

  if (existing.length > 0 && hasCurrent) {
    const curIdx = existing.findIndex((h) => h.isCurrent);
    const hasRowAfterCurrent =
      d.nextFlight != null || (curIdx >= 0 && curIdx < existing.length - 1);
    if (!hasRowAfterCurrent) {
      const nextTo = pick(`${fn}-next`, [...HUBS].filter((x) => x !== arr));
      existing.push({
        flightNumber: "Next leg (TBA)",
        from: arr,
        to: nextTo,
        departureTime: "—",
        status: "Placeholder",
        dayGroup: "today",
      });
    }
    return existing;
  }

  if (existing.length > 0 && !hasCurrent) {
    const merged = [...existing];
    const syn = buildSyntheticHistory(d);
    merged.push(syn[1]);
    if (!merged.some((h) => h.flightNumber === syn[2].flightNumber)) {
      merged.push(syn[2]);
    }
    return merged;
  }

  return buildSyntheticHistory(d);
}

function ensureRouteMap(d: FlightDetail, tt: AircraftTailTracking): string[] {
  if (tt.routeMapAirports && tt.routeMapAirports.length >= 2) {
    return tt.routeMapAirports;
  }
  const dep = d.departureAirportCode?.trim() || "DEP";
  const arr = d.arrivalAirportCode?.trim() || "ARR";
  const prev = inboundOrigin(dep, d.flightNumber);
  const mid = pick(d.flightNumber + "mid", [...HUBS].filter((x) => x !== dep && x !== arr));
  const next = pick(d.flightNumber + "n2", [...HUBS].filter((x) => x !== arr));
  return [prev, mid, dep, arr, next];
}

function legStartIndex(route: string[], dep: string, arr: string): number {
  for (let i = 0; i < route.length - 1; i += 1) {
    if (route[i] === dep && route[i + 1] === arr) return i;
  }
  const di = route.indexOf(dep);
  if (di >= 0 && di < route.length - 1) return di;
  return Math.max(0, route.length - 2);
}

function defaultReadiness(d: FlightDetail): AircraftTailTracking["readinessState"] {
  if (d.delayRiskLevel === "high") return "delayed_inbound";
  if (d.livePhase === "boarding") return "ready";
  const r = pick(d.flightNumber + "rd", [
    "ready",
    "cleaning",
    "refueling",
    "crew_boarding",
    "awaiting_gate",
  ] as const);
  return r;
}

const READINESS_LABEL: Record<
  NonNullable<AircraftTailTracking["readinessState"]>,
  string
> = {
  ready: "Ready for boarding",
  cleaning: "Still cleaning",
  refueling: "Refueling",
  crew_boarding: "Crew boarding",
  delayed_inbound: "Delayed inbound aircraft",
  awaiting_gate: "Awaiting gate arrival",
};

function ensureTailTracking(d: FlightDetail, history: AircraftHistoryItem[]): AircraftTailTracking {
  const tt = { ...(d.aircraftTailTracking ?? {}) };
  const dep = d.departureAirportCode?.trim() || "DEP";
  const arr = d.arrivalAirportCode?.trim() || "ARR";
  const fn = d.flightNumber;
  const prevLeg = history.find(
    (h) => h.to === dep && h.flightNumber !== fn && !h.isCurrent
  );
  const prevFn = prevLeg?.flightNumber ?? syntheticPrevFlightNumber(fn);
  const prevFrom = prevLeg?.from ?? inboundOrigin(dep, fn);

  if (!tt.previousFlight) {
    tt.previousFlight = {
      flightNumber: prevFn,
      from: prevFrom,
      to: dep,
      landedAgo: pick(fn + "ago", [
        "45 min ago",
        "1h 15m ago",
        "2h 05m ago",
        "55 min ago",
      ]),
    };
  }

  if (!tt.turnaround) {
    tt.turnaround = {
      narrativeLine: `${prevFn} ${prevFrom} → ${dep}`,
      groundTimeBeforeNextDeparture: pick(fn + "gt", [
        "1h 40m",
        "2h 05m",
        "1h 25m",
        "2h 32m",
      ]),
      lateInboundMessage:
        d.delayRiskLevel === "high"
          ? "Late inbound aircraft may compress turnaround — monitor gate."
          : undefined,
    };
  }

  const route = ensureRouteMap(d, tt);
  tt.routeMapAirports = route;
  if (tt.activeRouteLegStartIndex == null) {
    tt.activeRouteLegStartIndex = legStartIndex(route, dep, arr);
  }

  if (!tt.currentLocationLine) {
    const gate = d.gate?.trim() || "B12";
    tt.currentLocationLine = pick(fn + "loc", [
      `At ${dep} gate ${gate}`,
      "Taxiing after landing",
      "Cruising over Serbia",
      "Descending into IST",
      `On stand at ${dep}`,
    ]);
  }

  const u = tt.usageStats ?? {};
  tt.usageStats = {
    flightsToday: u.flightsToday ?? 3 + (hashSeed(fn) % 4),
    airportsVisitedToday:
      u.airportsVisitedToday ?? 2 + (hashSeed(fn + "a") % 4),
    totalFlightTimeToday:
      u.totalFlightTimeToday ??
      pick(fn + "ft", ["6h 20m", "8h 45m", "5h 10m"]),
    longestRouteToday: u.longestRouteToday ?? `${prevFrom} → ${dep}`,
    averageTurnaroundMinutes:
      u.averageTurnaroundMinutes ?? 52 + (hashSeed(fn + "ta") % 35),
    delaysToday:
      u.delaysToday ??
      (d.delayRiskLevel === "high" ? 1 + (hashSeed(fn) % 2) : 0),
  };

  if (!tt.readinessState) {
    tt.readinessState = defaultReadiness(d);
  }
  if (!tt.readinessLabel) {
    const rs = tt.readinessState ?? "awaiting_gate";
    tt.readinessLabel = READINESS_LABEL[rs];
  }

  if (!tt.inboundDelayBadge && (d.delayRiskLevel === "high" || tt.readinessState === "delayed_inbound")) {
    tt.inboundDelayBadge = {
      title: "Late inbound aircraft",
      detail: "May delay departure by 25 min",
    };
  }

  if (!tt.inboundDelayBadge && tt.turnaround?.lateInboundMessage) {
    tt.inboundDelayBadge = {
      title: "Late inbound aircraft",
      detail: "May delay departure by 25 min",
    };
  }

  return tt;
}

/**
 * Ensures tail history, route chain, inbound context, and usage stats exist
 * so aircraft sections never render empty.
 */
export function mergeAircraftTailIntelligence(detail: FlightDetail): FlightDetail {
  const history = ensureHistory(detail);
  const aircraftTailTracking = ensureTailTracking(
    { ...detail, history },
    history
  );

  return {
    ...detail,
    history,
    aircraftTailTracking,
  };
}
