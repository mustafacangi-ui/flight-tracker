import type { AeroAirportFlight, AeroMovement } from "./flightTypes";

/**
 * Lower = higher on the board. Matches product priority:
 * Boarding → Final Call → Gate Open → active movement → Delayed → Scheduled → finished/terminal.
 */
export function fidsStatusPriority(
  rawStatus: string | undefined,
  board: "departure" | "arrival"
): number {
  const s = (rawStatus ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!s) return 50;

  if (s.includes("cancel")) return 80;
  if (s.includes("divert")) return 81;

  if (board === "departure") {
    if (s.includes("boarding")) return 0;
    if (s.includes("final call") || s.includes("finalcall")) return 1;
    if (s.includes("gate open") || s.includes("gateopen")) return 2;
    if (
      s.includes("departing") ||
      s.includes("taxi") ||
      /take\s*off|takeoff/.test(s)
    ) {
      return 3;
    }
    if (s.includes("delayed") || s.includes("delay")) return 4;
    if (
      s.includes("departed") ||
      s.includes("enroute") ||
      s.includes("en route")
    ) {
      return 60;
    }
    if (s.includes("arrived") || s.includes("landed")) return 62;
  } else {
    if (s.includes("approaching") || s.includes("landing")) return 3;
    if (s.includes("boarding")) return 0;
    if (s.includes("final call") || s.includes("finalcall")) return 1;
    if (s.includes("gate open") || s.includes("gateopen")) return 2;
    if (s.includes("delayed") || s.includes("delay")) return 4;
    if (s.includes("arrived") || s.includes("landed")) return 61;
    if (
      s.includes("departed") ||
      s.includes("enroute") ||
      s.includes("en route")
    ) {
      return 60;
    }
  }

  return 50;
}

/** Best-effort epoch ms for ordering by closest scheduled / estimated movement time. */
export function movementEpochMs(movement: AeroMovement | null | undefined): number {
  if (!movement) return Number.MAX_SAFE_INTEGER;
  const candidates = [
    movement.revisedTime?.utc,
    movement.predictedTime?.utc,
    movement.scheduledTime?.utc,
    movement.actualTime?.utc,
    movement.revisedTime?.local,
    movement.predictedTime?.local,
    movement.scheduledTime?.local,
    movement.actualTime?.local,
  ];
  for (const c of candidates) {
    if (!c?.trim()) continue;
    const ms = Date.parse(c);
    if (!Number.isNaN(ms)) return ms;
  }
  return Number.MAX_SAFE_INTEGER;
}

export function compareFidsFlights(
  a: AeroAirportFlight,
  b: AeroAirportFlight,
  board: "departure" | "arrival"
): number {
  const pa = fidsStatusPriority(a.status, board);
  const pb = fidsStatusPriority(b.status, board);
  if (pa !== pb) return pa - pb;

  const ta =
    board === "departure"
      ? movementEpochMs(a.departure)
      : movementEpochMs(a.arrival);
  const tb =
    board === "departure"
      ? movementEpochMs(b.departure)
      : movementEpochMs(b.arrival);
  if (ta !== tb) return ta - tb;

  return (a.number ?? "").localeCompare(b.number ?? "", undefined, {
    numeric: true,
  });
}

export function sortDepartureBoardFlights(
  flights: AeroAirportFlight[]
): AeroAirportFlight[] {
  return [...flights].sort((a, b) => compareFidsFlights(a, b, "departure"));
}

export function sortArrivalBoardFlights(
  flights: AeroAirportFlight[]
): AeroAirportFlight[] {
  return [...flights].sort((a, b) => compareFidsFlights(a, b, "arrival"));
}

/** Hide flights that are done at this airport on the departures board (upcoming-only view). */
export function isTerminalDepartureBoardStatus(status: string | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  if (s.includes("cancel") || s.includes("divert")) return true;
  if (s.includes("departed") || s.includes("enroute") || s.includes("en route")) {
    return true;
  }
  return false;
}

/** Hide flights that have completed arrival (upcoming-only view). */
export function isTerminalArrivalBoardStatus(status: string | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  if (s.includes("cancel") || s.includes("divert")) return true;
  if (s.includes("arrived") || s.includes("landed")) return true;
  return false;
}

export function filterUpcomingDepartures(
  flights: AeroAirportFlight[]
): AeroAirportFlight[] {
  return flights.filter((f) => !isTerminalDepartureBoardStatus(f.status));
}

export function filterUpcomingArrivals(
  flights: AeroAirportFlight[]
): AeroAirportFlight[] {
  return flights.filter((f) => !isTerminalArrivalBoardStatus(f.status));
}
