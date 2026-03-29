import type { AeroAirportFlight } from "../flightTypes";
import { getRapidApiHost, rapidApiHeaders } from "./rapidApiConfig";

const CACHE_TTL_MS = 5 * 60 * 1000;

type CachedFlightsData = {
  departures: AeroAirportFlight[];
  arrivals: AeroAirportFlight[];
};

type FlightCacheEntry = {
  data: CachedFlightsData;
  timestamp: number;
};

const globalForFlightCache = globalThis as typeof globalThis & {
  flightFidsCache?: Map<string, FlightCacheEntry>;
};

const flightCache =
  globalForFlightCache.flightFidsCache ?? new Map<string, FlightCacheEntry>();
globalForFlightCache.flightFidsCache = flightCache;

export type AirportFidsResult =
  | { ok: true; data: CachedFlightsData }
  | { ok: false; status: number; error: string; fallback?: boolean };

function normalizeAirportCode(param: string): string {
  const t = param.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(t) || /^[A-Z]{4}$/.test(t)) return t;
  return "IST";
}

/**
 * Cached AeroDataBox airport departures + arrivals (same payload as /api/flights).
 */
export async function getAirportFids(
  airportParam: string,
  apiKey: string
): Promise<AirportFidsResult> {
  const code = normalizeAirportCode(airportParam);
  const cacheKey = `${code}_full`;

  const hit = flightCache.get(cacheKey);
  if (hit && Date.now() - hit.timestamp < CACHE_TTL_MS) {
    return { ok: true, data: hit.data };
  }

  const codeType = code.length === 4 ? "icao" : "iata";
  const host = getRapidApiHost();
  const url = new URL(`https://${host}/flights/airports/${codeType}/${code}`);
  url.searchParams.set("offsetMinutes", "-120");
  url.searchParams.set("durationMinutes", "720");
  url.searchParams.set("withLeg", "true");

  let res: Response;
  try {
    res = await fetch(url, {
      headers: rapidApiHeaders(apiKey),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 502,
      error: "Failed to reach AeroDataBox.",
    };
  }

  if (!res.ok) {
    if (res.status === 429) {
      if (flightCache.has(cacheKey)) {
        const stale = flightCache.get(cacheKey)!;
        return { ok: true, data: stale.data };
      }
      return {
        ok: false,
        status: 429,
        error: "Rate limit exceeded",
        fallback: true,
      };
    }

    let message = res.statusText;
    const text = await res.text();
    try {
      const errJson = JSON.parse(text) as { message?: string };
      if (typeof errJson.message === "string") message = errJson.message;
    } catch {
      if (text) message = text.slice(0, 200);
    }
    return {
      ok: false,
      status: res.status >= 400 ? res.status : 502,
      error: message,
    };
  }

  let data: { departures?: AeroAirportFlight[] | null; arrivals?: AeroAirportFlight[] | null };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return {
      ok: false,
      status: 502,
      error: "Invalid JSON from AeroDataBox.",
    };
  }

  const payload: CachedFlightsData = {
    departures: data.departures ?? [],
    arrivals: data.arrivals ?? [],
  };

  const ts = Date.now();
  const entry: FlightCacheEntry = { data: payload, timestamp: ts };
  flightCache.set(`${code}_full`, entry);
  flightCache.set(`${code}_departure`, entry);
  flightCache.set(`${code}_arrival`, entry);

  return { ok: true, data: payload };
}
