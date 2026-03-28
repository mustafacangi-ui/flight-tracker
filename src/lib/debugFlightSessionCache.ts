/**
 * Mirrors home tab FIDS session cache for /debug QA inspector (sessionStorage).
 */

export const DEBUG_SESSION_FIDS_CACHE_KEY = "flightApp_debugSessionFidsCache";

export type DebugSessionFidsCachePayload = {
  airportKeys: string[];
  fetchedAtByAirport: Record<string, number>;
  flightCountsByAirport: Record<string, { dep: number; arr: number }>;
  approxEntryCount: number;
};

export function writeDebugSessionFidsCache(
  map: Map<
    string,
    { fetchedAt: number; departures: unknown[]; arrivals: unknown[] }
  >
): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const fetchedAtByAirport: Record<string, number> = {};
    const flightCountsByAirport: Record<string, { dep: number; arr: number }> =
      {};
    for (const [k, v] of map) {
      fetchedAtByAirport[k] = v.fetchedAt;
      flightCountsByAirport[k] = {
        dep: v.departures.length,
        arr: v.arrivals.length,
      };
    }
    const payload: DebugSessionFidsCachePayload = {
      airportKeys: [...map.keys()],
      fetchedAtByAirport,
      flightCountsByAirport,
      approxEntryCount: map.size,
    };
    sessionStorage.setItem(DEBUG_SESSION_FIDS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function readDebugSessionFidsCache(): DebugSessionFidsCachePayload | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DEBUG_SESSION_FIDS_CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== "object") return null;
    const o = p as Record<string, unknown>;
    if (!Array.isArray(o.airportKeys)) return null;
    if (!o.fetchedAtByAirport || typeof o.fetchedAtByAirport !== "object")
      return null;
    const flightCountsByAirport =
      o.flightCountsByAirport &&
      typeof o.flightCountsByAirport === "object" &&
      !Array.isArray(o.flightCountsByAirport)
        ? (o.flightCountsByAirport as Record<string, { dep: number; arr: number }>)
        : {};
    return {
      airportKeys: o.airportKeys.filter((x): x is string => typeof x === "string"),
      fetchedAtByAirport: o.fetchedAtByAirport as Record<string, number>,
      flightCountsByAirport,
      approxEntryCount:
        typeof o.approxEntryCount === "number"
          ? o.approxEntryCount
          : o.airportKeys.length,
    };
  } catch {
    return null;
  }
}
