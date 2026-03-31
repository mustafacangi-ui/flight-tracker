/**
 * AviationStack API Provider
 * Secondary fallback provider for flight data
 * Free tier available, good for basic flight lookups
 */

import type { FlightDetail, FlightSearchResult } from "../aerodatabox";
import type { AeroAirline, AeroMovement, AeroAircraft, AeroAirport } from "../flightTypes";
import { normalizeFlightNumber, getFlightCache, setFlightCache, FLIGHT_CACHE_TTL } from "../aerodatabox";

const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY;
const AVIATIONSTACK_BASE_URL = "https://api.aviationstack.com/v1";

// Types for AviationStack API responses
type AviationStackFlight = {
  flight_date?: string;
  flight_status?: string;
  departure?: {
    airport?: string;
    timezone?: string;
    iata?: string;
    icao?: string;
    terminal?: string;
    gate?: string;
    delay?: number;
    scheduled?: string;
    estimated?: string;
    actual?: string;
    estimated_runway?: string;
    actual_runway?: string;
  };
  arrival?: {
    airport?: string;
    timezone?: string;
    iata?: string;
    icao?: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
    delay?: number;
    scheduled?: string;
    estimated?: string;
    actual?: string;
    estimated_runway?: string;
    actual_runway?: string;
  };
  airline?: {
    name?: string;
    iata?: string;
    icao?: string;
  };
  flight?: {
    number?: string;
    iata?: string;
    icao?: string;
    codeshared?: string;
  };
  aircraft?: {
    registration?: string;
    type?: string;
    iata?: string;
    icao?: string;
    icao24?: string;
  };
  live?: {
    updated?: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    direction?: number;
    speed_horizontal?: number;
    speed_vertical?: number;
    is_ground?: boolean;
  };
};

/**
 * Search flights using AviationStack API
 */
export async function searchFlights(query: string): Promise<FlightSearchResult> {
  const cacheKey = `search:${normalizeFlightNumber(query)}`;
  const cached = getFlightCache<FlightSearchResult>(cacheKey);
  if (cached) {
    return { ...cached, source: "cache" as const };
  }

  if (!AVIATIONSTACK_API_KEY) {
    console.warn("[AviationStack] API key not configured");
    return {
      flights: [],
      query,
      source: "aviationstack",
      timestamp: Date.now(),
    };
  }

  try {
    // Normalize query for search
    const normalizedQuery = normalizeFlightNumber(query);
    
    // Build URL with parameters
    const params = new URLSearchParams({
      access_key: AVIATIONSTACK_API_KEY,
      flight_number: normalizedQuery,
      limit: "10",
    });

    const url = `${AVIATIONSTACK_BASE_URL}/flights?${params.toString()}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("[AviationStack] Rate limited");
      }
      throw new Error(`AviationStack API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      return {
        flights: [],
        query,
        source: "aviationstack",
        timestamp: Date.now(),
      };
    }

    // Convert AviationStack format to internal FlightSearchResult
    const flights = data.data.map((flight: AviationStackFlight) => ({
      number: flight.flight?.number ?? flight.flight?.iata ?? "",
      airline: flight.airline?.name ?? "",
      departureAirport: flight.departure?.iata ?? flight.departure?.icao ?? "",
      arrivalAirport: flight.arrival?.iata ?? flight.arrival?.icao ?? "",
      departureCity: flight.departure?.airport?.split(",")[0]?.trim(),
      arrivalCity: flight.arrival?.airport?.split(",")[0]?.trim(),
      status: mapAviationStackStatus(flight.flight_status),
      scheduledTime: flight.departure?.scheduled ?? undefined,
      score: 1.0,
    }));

    const result: FlightSearchResult = {
      flights: flights.filter((f: { number: string }) => f.number),
      query,
      source: "aviationstack",
      timestamp: Date.now(),
    };

    // Cache the result
    setFlightCache(cacheKey, result, FLIGHT_CACHE_TTL.AUTOCOMPLETE);

    return result;
  } catch (error) {
    console.error("[AviationStack] Search error:", error);
    return {
      flights: [],
      query,
      source: "aviationstack",
      timestamp: Date.now(),
    };
  }
}

/**
 * Get flight by number using AviationStack API
 */
export async function getFlightByNumber(flightNumber: string): Promise<FlightDetail | null> {
  const normalizedNumber = normalizeFlightNumber(flightNumber);
  const cacheKey = `flight:${normalizedNumber}`;
  
  // Check cache first
  const cached = getFlightCache<FlightDetail>(cacheKey);
  if (cached) {
    return cached;
  }

  if (!AVIATIONSTACK_API_KEY) {
    console.warn("[AviationStack] API key not configured");
    return null;
  }

  try {
    const params = new URLSearchParams({
      access_key: AVIATIONSTACK_API_KEY,
      flight_number: normalizedNumber.replace(/\D/g, ""),
      flight_iata: normalizedNumber,
      limit: "1",
    });

    const url = `${AVIATIONSTACK_BASE_URL}/flights?${params.toString()}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("[AviationStack] Rate limited");
      }
      throw new Error(`AviationStack API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return null;
    }

    const flight = data.data[0] as AviationStackFlight;
    const detail = convertAviationStackToDetail(flight, normalizedNumber);

    // Cache the result
    setFlightCache(cacheKey, detail, FLIGHT_CACHE_TTL.FLIGHT_DETAIL);

    return detail;
  } catch (error) {
    console.error("[AviationStack] Get flight error:", error);
    return null;
  }
}

/**
 * Get airport flights using AviationStack API
 */
export async function getAirportFlights(code: string): Promise<{
  departures: FlightDetail[];
  arrivals: FlightDetail[];
  timestamp: number;
  source: "aviationstack" | "cache";
}> {
  const cacheKey = `airport:${code.toUpperCase()}`;
  const cached = getFlightCache<{ departures: FlightDetail[]; arrivals: FlightDetail[]; timestamp: number; source: "cache" }>(cacheKey);
  if (cached) {
    return { ...cached, source: "cache" };
  }

  if (!AVIATIONSTACK_API_KEY) {
    console.warn("[AviationStack] API key not configured");
    return {
      departures: [],
      arrivals: [],
      timestamp: Date.now(),
      source: "aviationstack",
    };
  }

  try {
    // Get departures
    const depParams = new URLSearchParams({
      access_key: AVIATIONSTACK_API_KEY,
      dep_iata: code.toUpperCase(),
      limit: "100",
    });

    const depResponse = await fetch(`${AVIATIONSTACK_BASE_URL}/flights?${depParams.toString()}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    // Get arrivals
    const arrParams = new URLSearchParams({
      access_key: AVIATIONSTACK_API_KEY,
      arr_iata: code.toUpperCase(),
      limit: "100",
    });

    const arrResponse = await fetch(`${AVIATIONSTACK_BASE_URL}/flights?${arrParams.toString()}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    let departures: FlightDetail[] = [];
    let arrivals: FlightDetail[] = [];

    if (depResponse.ok) {
      const depData = await depResponse.json();
      if (depData.data && Array.isArray(depData.data)) {
        departures = depData.data.map((f: AviationStackFlight) => 
          convertAviationStackToDetail(f, f.flight?.number ?? "")
        ).filter(Boolean);
      }
    }

    if (arrResponse.ok) {
      const arrData = await arrResponse.json();
      if (arrData.data && Array.isArray(arrData.data)) {
        arrivals = arrData.data.map((f: AviationStackFlight) => 
          convertAviationStackToDetail(f, f.flight?.number ?? "")
        ).filter(Boolean);
      }
    }

    const result = {
      departures,
      arrivals,
      timestamp: Date.now(),
      source: "aviationstack" as const,
    };

    // Cache the result
    setFlightCache(cacheKey, result, FLIGHT_CACHE_TTL.AIRPORT_BOARD);

    return result;
  } catch (error) {
    console.error("[AviationStack] Airport flights error:", error);
    return {
      departures: [],
      arrivals: [],
      timestamp: Date.now(),
      source: "aviationstack",
    };
  }
}

/**
 * Map AviationStack status to internal status format
 */
function mapAviationStackStatus(status?: string): string {
  if (!status) return "Scheduled";
  
  const statusMap: Record<string, string> = {
    "scheduled": "Scheduled",
    "active": "In Air",
    "landed": "Landed",
    "cancelled": "Cancelled",
    "incident": "Incident",
    "diverted": "Diverted",
    "delayed": "Delayed",
    "departed": "Departed",
    "arrived": "Arrived",
    "boarding": "Boarding",
    "gate_open": "Gate Open",
    "gate_closed": "Gate Closed",
  };

  return statusMap[status.toLowerCase()] || status;
}

/**
 * Convert AviationStack flight format to internal FlightDetail
 */
function convertAviationStackToDetail(flight: AviationStackFlight, flightNumber: string): FlightDetail {
  const dep = flight.departure;
  const arr = flight.arrival;

  // Build departure airport info
  const departureAirport: AeroAirport | null = dep?.iata ? {
    iata: dep.iata,
    icao: dep.icao ?? undefined,
    name: dep.airport ?? undefined,
    shortName: dep.airport?.split(",")[0]?.trim() ?? undefined,
    municipalityName: undefined,
    timeZone: dep.timezone ?? undefined,
    ianaTimeZone: dep.timezone ?? undefined,
  } : null;

  // Build arrival airport info
  const arrivalAirport: AeroAirport | null = arr?.iata ? {
    iata: arr.iata,
    icao: arr.icao ?? undefined,
    name: arr.airport ?? undefined,
    shortName: arr.airport?.split(",")[0]?.trim() ?? undefined,
    municipalityName: undefined,
    timeZone: arr.timezone ?? undefined,
    ianaTimeZone: arr.timezone ?? undefined,
  } : null;

  // Calculate total delay
  const departureDelay = dep?.delay ?? 0;
  const arrivalDelay = arr?.delay ?? 0;
  const totalDelay = Math.max(departureDelay, arrivalDelay);

  // Build movement objects
  const departureMovement: AeroMovement | null = departureAirport ? {
    airport: departureAirport,
    scheduledTime: dep?.scheduled ? { utc: dep.scheduled, local: dep.scheduled } : null,
    revisedTime: dep?.estimated ? { utc: dep.estimated, local: dep.estimated } : null,
    predictedTime: null,
    actualTime: dep?.actual ? { utc: dep.actual, local: dep.actual } : null,
    terminal: dep?.terminal ?? null,
    gate: dep?.gate ?? null,
  } : null;

  const arrivalMovement: AeroMovement | null = arrivalAirport ? {
    airport: arrivalAirport,
    scheduledTime: arr?.scheduled ? { utc: arr.scheduled, local: arr.scheduled } : null,
    revisedTime: arr?.estimated ? { utc: arr.estimated, local: arr.estimated } : null,
    predictedTime: null,
    actualTime: arr?.actual ? { utc: arr.actual, local: arr.actual } : null,
    terminal: arr?.terminal ?? null,
    gate: arr?.gate ?? null,
  } : null;

  // Build aircraft info
  const aircraft: AeroAircraft | null = flight.aircraft ? {
    reg: flight.aircraft.registration ?? null,
    model: flight.aircraft.type ?? null,
    modelCode: flight.aircraft.iata ?? flight.aircraft.icao ?? null,
  } : null;

  // Build airline info
  const airline: AeroAirline = {
    name: flight.airline?.name ?? "Unknown",
    iata: flight.airline?.iata ?? null,
    icao: flight.airline?.icao ?? null,
  };

  const status = mapAviationStackStatus(flight.flight_status);

  return {
    number: flightNumber || flight.flight?.number || flight.flight?.iata || "",
    airline,
    departure: departureMovement,
    arrival: arrivalMovement,
    aircraft,
    status,
    scheduledDeparture: dep?.scheduled ?? null,
    scheduledArrival: arr?.scheduled ?? null,
    estimatedDeparture: dep?.estimated ?? null,
    estimatedArrival: arr?.estimated ?? null,
    actualDeparture: dep?.actual ?? null,
    actualArrival: arr?.actual ?? null,
    delayMinutes: totalDelay,
    gate: dep?.gate ?? null,
    terminal: dep?.terminal ?? null,
    baggageBelt: arr?.baggage ?? null,
  };
}

/**
 * Check AviationStack API health
 */
export async function getAviationStackHealth(): Promise<{ ok: boolean; latencyMs: number; remaining?: number }> {
  const startTime = Date.now();
  
  if (!AVIATIONSTACK_API_KEY) {
    return { ok: false, latencyMs: -1 };
  }

  try {
    const params = new URLSearchParams({
      access_key: AVIATIONSTACK_API_KEY,
      limit: "1",
    });

    const response = await fetch(`${AVIATIONSTACK_BASE_URL}/flights?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      return { ok: false, latencyMs };
    }

    // Check rate limit from headers if available
    const remaining = response.headers.get("X-RateLimit-Remaining");

    return {
      ok: true,
      latencyMs,
      remaining: remaining ? parseInt(remaining, 10) : undefined,
    };
  } catch {
    return { ok: false, latencyMs: Date.now() - startTime };
  }
}
