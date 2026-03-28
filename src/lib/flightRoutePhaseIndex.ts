import type { FlightDetail, FlightLivePhase } from "./flightDetailsTypes";

const ROUTE_PHASES = ["Departed", "In air", "Landing soon", "Landed"] as const;

export type RoutePhaseKey = (typeof ROUTE_PHASES)[number];

export function routePhaseLabels(): readonly RoutePhaseKey[] {
  return ROUTE_PHASES;
}

/** Which route phase is active (0–3) for pill highlighting. */
export function activeRoutePhaseIndex(
  progressPercent: number | undefined,
  livePhase: FlightLivePhase | undefined
): number {
  const pct = Math.min(100, Math.max(0, progressPercent ?? 0));
  if (livePhase === "landed" || pct >= 99.5) return 3;
  if (livePhase === "landing") return 2;
  if (livePhase === "in_air") return 1;
  if (livePhase === "boarding" || livePhase === "taxiing") return 0;
  if (pct >= 88) return 2;
  if (pct >= 12) return 1;
  if (pct > 0) return 0;
  return 0;
}

export function isPreDepartureGate(
  detail: Pick<FlightDetail, "livePhase" | "progressPercent">
): boolean {
  const p = detail.progressPercent ?? 0;
  const ph = detail.livePhase;
  return p < 8 && (ph === "boarding" || ph === undefined);
}
