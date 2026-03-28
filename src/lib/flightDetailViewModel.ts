import type {
  AircraftHistoryItem as ApiAircraftHistoryItem,
  FlightDetailPayload,
} from "./flightDetail";
import {
  buildPlaceholderTimeline,
  normalizeFlightNumberKey,
  type RouteProgressState,
} from "./flightDetail";
import type {
  AircraftHistoryItem,
  DelayRiskLevel,
  FlightDetail,
  FlightLivePhase,
  FlightTimelineEvent,
  RelatedFlight,
} from "./flightDetailsTypes";
import { getMockFlightDetail } from "./mockFlightDetails";

function parseRouteArrow(route: string): { from: string; to: string } {
  const parts = route.split("→").map((s) => s.trim());
  return { from: parts[0] || "?", to: parts[1] || "?" };
}

export function apiHistoryToAircraftHistory(
  items: ApiAircraftHistoryItem[]
): AircraftHistoryItem[] {
  return items.map((h) => {
    const { from, to } = parseRouteArrow(h.route);
    const st = (h.status || "").toLowerCase();
    return {
      flightNumber: h.number,
      from,
      to,
      departureTime: h.departureTime,
      arrivalTime: h.arrivalTime,
      status: h.status,
      delayed: st.includes("delay"),
    };
  });
}

export function apiNextToRelated(
  next: ApiAircraftHistoryItem | null
): RelatedFlight | null {
  if (!next) return null;
  const { from, to } = parseRouteArrow(next.route);
  return {
    flightNumber: next.number,
    from,
    to,
    departureTime: next.departureTime,
  };
}

function phaseLabelToLivePhase(label: string): FlightLivePhase | undefined {
  const s = label.toLowerCase();
  if (s.includes("board")) return "boarding";
  if (s.includes("taxi")) return "taxiing";
  if (s.includes("approach") || s.includes("land") && !s.includes("landed"))
    return "landing";
  if (s.includes("landed") || (s.includes("land") && s.includes("min ago")))
    return "landed";
  if (s.includes("in air") || s.includes("air")) return "in_air";
  if (s.includes("delay")) return "boarding";
  return undefined;
}

function inferTimelineFromPlaceholders(
  events: { time: string; label: string }[]
): FlightTimelineEvent[] {
  if (events.length === 0) return [];
  const activeIdx = Math.min(
    Math.max(0, events.length - 3),
    Math.floor(events.length / 2)
  );
  return events.map((ev, i) => ({
    time: ev.time,
    label: ev.label,
    state:
      i < activeIdx ? "completed" : i === activeIdx ? "active" : "upcoming",
  }));
}

export function payloadToFlightDetail(
  p: FlightDetailPayload,
  progress: RouteProgressState | null,
  delayRisk: DelayRiskLevel,
  apiHistory: AircraftHistoryItem[],
  nextFlight: RelatedFlight | null
): FlightDetail {
  const placeholder = buildPlaceholderTimeline(p);
  const timelineEvents = inferTimelineFromPlaceholders(placeholder);

  const aircraftTailTracking: FlightDetail["aircraftTailTracking"] =
    p.previousLeg
      ? {
          previousFlight: {
            flightNumber: p.previousLeg.flightNumber,
            from: p.previousLeg.from,
            to: p.previousLeg.to,
            landedAgo: p.previousLeg.arrivalLocal
              ? `Arr. ${p.previousLeg.arrivalLocal} local`
              : undefined,
          },
          turnaround: p.previousLeg.turnaroundLabel
            ? {
                narrativeLine: `Previous leg ${p.previousLeg.flightNumber}: ${p.previousLeg.from} → ${p.previousLeg.to}`,
                groundTimeBeforeNextDeparture: p.previousLeg.turnaroundLabel,
              }
            : undefined,
        }
      : undefined;

  const depTz = p.departureTimeZone ?? p.departure.timeZone;
  const arrTz = p.arrivalTimeZone ?? p.arrival.timeZone;

  return {
    flightNumber: p.flightNumber,
    airlineName: p.airlineName,
    status: p.statusLabel,
    statusTone: p.statusTone,
    departureAirportCode: p.departure.code,
    departureAirportName: p.departure.name,
    departureCity: p.departure.name,
    departureTime: p.departure.scheduledLocal,
    estimatedDepartureTime:
      p.departure.estimatedLocal ?? p.departure.scheduledLocal,
    actualDepartureTime: p.departure.actualLocal,
    arrivalAirportCode: p.arrival.code,
    arrivalAirportName: p.arrival.name,
    arrivalCity: p.arrival.name,
    arrivalTime: p.arrival.scheduledLocal,
    estimatedArrivalTime: p.arrival.estimatedLocal ?? p.arrival.scheduledLocal,
    actualArrivalTime: p.arrival.actualLocal,
    ...(depTz ? { departureTimeZone: depTz } : {}),
    ...(arrTz ? { arrivalTimeZone: arrTz } : {}),
    gate: p.gate,
    terminal: p.terminal,
    aircraftType: p.aircraftModel,
    tailNumber: p.tailNumber,
    progressPercent: progress
      ? Math.min(100, Math.max(0, progress.progressPct))
      : undefined,
    livePhase: progress
      ? phaseLabelToLivePhase(progress.phaseLabel)
      : undefined,
    routePhaseLabel: progress?.phaseLabel,
    routeSublabel: progress?.sublabel,
    timelineEvents,
    history: apiHistory.length > 0 ? apiHistory : undefined,
    nextFlight: nextFlight ?? undefined,
    delayRiskLevel: delayRisk,
    aircraftTailTracking,
  };
}

export function mergeFlightDetailWithMock(
  fromApi: FlightDetail,
  flightNumberRaw: string
): FlightDetail {
  const mock = getMockFlightDetail(flightNumberRaw);
  const key = normalizeFlightNumberKey(flightNumberRaw);
  const mockIsMinimal =
    mock.flightNumber === key &&
    !mock.history?.length &&
    !mock.timelineEvents?.length &&
    !mock.tailNumber;

  if (mockIsMinimal) return fromApi;

  const hasRichMock = !mockIsMinimal;

  return {
    ...mock,
    ...fromApi,
    history:
      fromApi.history && fromApi.history.length > 0
        ? fromApi.history
        : mock.history,
    nextFlight: fromApi.nextFlight ?? mock.nextFlight,
    timelineEvents:
      hasRichMock && mock.timelineEvents && mock.timelineEvents.length > 0
        ? mock.timelineEvents
        : fromApi.timelineEvents,
    routePhaseLabel: fromApi.routePhaseLabel ?? mock.routePhaseLabel,
    routeSublabel: fromApi.routeSublabel ?? mock.routeSublabel,
    progressPercent: fromApi.progressPercent ?? mock.progressPercent,
    livePhase: fromApi.livePhase ?? mock.livePhase,
    delayRiskLevel: fromApi.delayRiskLevel ?? mock.delayRiskLevel,
    aircraftTailTracking:
      fromApi.aircraftTailTracking ?? mock.aircraftTailTracking,
  };
}

export function toneClassesFromFlightDetail(
  tone?: FlightDetail["statusTone"]
): string {
  switch (tone) {
    case "green":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/35";
    case "yellow":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/35";
    case "red":
      return "bg-red-500/15 text-red-300 ring-1 ring-red-500/35";
    case "gray":
    default:
      return "bg-gray-500/15 text-gray-300 ring-1 ring-gray-500/35";
  }
}
