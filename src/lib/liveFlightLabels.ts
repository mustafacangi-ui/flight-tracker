import type { FlightDetail } from "./flightDetailsTypes";

export function estimatedRemainingLabel(detail: FlightDetail): string {
  const cap = detail.estimatedArrivalCaption?.trim();
  if (cap) return cap;
  const sub = detail.routeSublabel?.trim();
  if (sub) return sub;
  return "—";
}
