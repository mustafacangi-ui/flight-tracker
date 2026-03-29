import type { LatLng } from "./airportCoordinates";

/** Quadratic curve in lat/lng for a pleasant arc (phase 1 — not a true geodesic). */
export function buildCurvedRoutePoints(
  dep: LatLng,
  arr: LatLng,
  segments = 48
): LatLng[] {
  const mid: LatLng = [
    (dep[0] + arr[0]) / 2 + 1.8,
    (dep[1] + arr[1]) / 2 - 0.6,
  ];
  const pts: LatLng[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const omt = 1 - t;
    const lat =
      omt * omt * dep[0] + 2 * omt * t * mid[0] + t * t * arr[0];
    const lng =
      omt * omt * dep[1] + 2 * omt * t * mid[1] + t * t * arr[1];
    pts.push([lat, lng]);
  }
  return pts;
}

export function positionAlongRoute(
  points: LatLng[],
  progress01: number
): LatLng {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];
  const t = Math.min(1, Math.max(0, progress01));
  const x = t * (points.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = points[i];
  const b = points[Math.min(i + 1, points.length - 1)];
  return [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])];
}
