/**
 * AeroDataBox API client with caching and error handling
 * Primary flight data provider with fallback architecture
 */

import type { AeroAirport, AeroAirportFlight, AeroAircraft, AeroMovement, AeroAirline } from "./flightTypes";
import { captureError } from "./monitoring/captureError";
import { getRapidApiHost, rapidApiHeaders } from "./server/rapidApiConfig";

// Environment configuration
export const AERODATABOX_API_KEY = process.env.RAPIDAPI_KEY ?? "";
export const AERODATABOX_API_HOST = process.env.RAPIDAPI_HOST ?? getRapidApiHost();
export const FLIGHT_CACHE_TTL_SECONDS = parseInt(process.env.FLIGHT_CACHE_TTL_SECONDS ?? "300", 10);
export const AUTOCOMPLETE_CACHE_TTL_SECONDS = parseInt(process.env.AUTOCOMPLETE_CACHE_TTL_SECONDS ?? "180", 10);
export const AIRPORT_CACHE_TTL_SECONDS = parseInt(process.env.AIRPORT_CACHE_TTL_SECONDS ?? "300", 10);

// Cache TTL constants for other providers
export const FLIGHT_CACHE_TTL = {
  FLIGHT_DETAIL: FLIGHT_CACHE_TTL_SECONDS,
  AUTOCOMPLETE: AUTOCOMPLETE_CACHE_TTL_SECONDS,
  AIRPORT_BOARD: AIRPORT_CACHE_TTL_SECONDS,
};

// Shared server-side cache (works across requests)
const globalForAeroCache = globalThis as typeof globalThis & {
  aerodataboxCache?: Map<string, CacheEntry>;
};

type CacheEntry<T = unknown> = {
  data: T;
  timestamp: number;
  ttlSeconds: number;
};

export const cache = globalForAeroCache.aerodataboxCache ?? new Map<string, CacheEntry>();
globalForAeroCache.aerodataboxCache = cache;

export function getCacheKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier.toUpperCase()}`;
}

export function getFlightCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  const ttlMs = entry.ttlSeconds * 1000;
  
  if (now - entry.timestamp > ttlMs) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

export function setFlightCache<T>(key: string, data: T, ttlSeconds: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttlSeconds,
  });
}

function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    const ttlMs = entry.ttlSeconds * 1000;
    if (now - entry.timestamp > ttlMs) {
      cache.delete(key);
    }
  }
}

// Auto-cleanup every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(clearExpiredCache, 10 * 60 * 1000);
}

// Types
export type FlightDetail = {
  number: string;
  airline: AeroAirline;
  departure?: AeroMovement | null;
  arrival?: AeroMovement | null;
  aircraft?: AeroAircraft | null;
  status: string;
  scheduledDeparture: string | null;
  scheduledArrival: string | null;
  estimatedDeparture: string | null;
  estimatedArrival: string | null;
  actualDeparture: string | null;
  actualArrival: string | null;
  delayMinutes: number;
  gate: string | null;
  terminal: string | null;
  baggageBelt: string | null;
};

export type FlightSearchItem = {
  number: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureCity?: string;
  arrivalCity?: string;
  status: string;
  scheduledTime?: string;
  score: number;
};

export type FlightSearchResult = {
  flights: FlightSearchItem[];
  query: string;
  source: "api" | "cache" | "mock" | "aviationstack" | "aerodatabox";
  timestamp: number;
};

// Normalize flight number for consistent lookup
export function normalizeFlightNumber(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

// Extract airline code from flight number
export function extractAirlineCode(flightNumber: string): string {
  const normalized = normalizeFlightNumber(flightNumber);
  const match = normalized.match(/^([A-Z]{2,3})/);
  return match?.[1] ?? "";
}

// Search flights by query (airline code prefix or full number)
export async function searchFlights(query: string): Promise<FlightSearchResult> {
  const normalizedQuery = normalizeFlightNumber(query);
  const cacheKey = getCacheKey("search", normalizedQuery);
  
  // Check cache first
  const cached = getFlightCache<FlightSearchResult>(cacheKey);
  if (cached) {
    return { ...cached, source: "cache" };
  }
  
  if (!AERODATABOX_API_KEY) {
    return {
      flights: [],
      query: normalizedQuery,
      source: "mock",
      timestamp: Date.now(),
    };
  }
  
  try {
    // Search by flight number using AeroDataBox search endpoint
    const url = new URL(`https://${AERODATABOX_API_HOST}/flights/search`);
    url.searchParams.set("flightNumber", normalizedQuery);
    url.searchParams.set("limit", "10");
    
    const res = await fetch(url, {
      headers: rapidApiHeaders(AERODATABOX_API_KEY),
      cache: "no-store",
    });
    
    if (!res.ok) {
      if (res.status === 429) {
        // Rate limited - return empty but indicate
        return {
          flights: [],
          query: normalizedQuery,
          source: "api",
          timestamp: Date.now(),
        };
      }
      throw new Error(`AeroDataBox search failed: ${res.status}`);
    }
    
    const data = await res.json() as { flights?: AeroAirportFlight[] };
    const flights = data.flights ?? [];
    
    // Score and format results
    const scoredFlights = flights
      .map((f): FlightSearchItem & { score: number } => ({
        number: f.number,
        airline: f.airline?.name ?? f.airline?.iata ?? "Unknown",
        departureAirport: f.departure?.airport?.iata ?? f.departure?.airport?.icao ?? "—",
        arrivalAirport: f.arrival?.airport?.iata ?? f.arrival?.airport?.icao ?? "—",
        departureCity: f.departure?.airport?.municipalityName ?? undefined,
        arrivalCity: f.arrival?.airport?.municipalityName ?? undefined,
        status: f.status ?? "Scheduled",
        scheduledTime: f.departure?.scheduledTime?.local ?? f.departure?.scheduledTime?.utc,
        score: scoreFlightMatch(f.number, normalizedQuery),
      }))
      .sort((a, b) => b.score - a.score);
    
    const result: FlightSearchResult = {
      flights: scoredFlights,
      query: normalizedQuery,
      source: "api",
      timestamp: Date.now(),
    };
    
    // Cache the result
    setFlightCache(cacheKey, result, AUTOCOMPLETE_CACHE_TTL_SECONDS);
    
    return result;
  } catch (error) {
    captureError(error, {
      area: "aerodatabox_search",
      tags: { query: normalizedQuery },
      extras: { summary: "Flight search failed" },
      level: "warning",
    });
    
    return {
      flights: [],
      query: normalizedQuery,
      source: "api",
      timestamp: Date.now(),
    };
  }
}

// Generate multiple flight number formats to try
function generateFlightNumberFormats(raw: string): string[] {
  const normalized = normalizeFlightNumber(raw);
  const airlineCode = extractAirlineCode(normalized);
  const numericPart = normalized.replace(/^[A-Z]+/, "");
  const paddedNumber = numericPart.padStart(4, "0");
  
  const formats = new Set<string>([
    normalized,                    // TK94
    `${airlineCode} ${numericPart}`, // TK 94
    `${airlineCode}-${numericPart}`, // TK-94
    `${airlineCode}${paddedNumber}`, // TK0094
    `${airlineCode} ${paddedNumber}`, // TK 0094
  ]);
  
  return Array.from(formats);
}

// Get specific flight by number (searches current and upcoming flights)
export async function getFlightByNumber(flightNumber: string): Promise<FlightDetail | null> {
  const rawInput = flightNumber;
  const normalizedNumber = normalizeFlightNumber(flightNumber);
  const cacheKey = getCacheKey("flight", normalizedNumber);
  
  console.log(`[flight-detail] raw=${rawInput} normalized=${normalizedNumber}`);
  
  // Check cache first
  const cached = getFlightCache<FlightDetail>(cacheKey);
  if (cached) {
    console.log(`[flight-detail] cache hit for ${normalizedNumber}`);
    return cached;
  }
  
  if (!AERODATABOX_API_KEY) {
    console.log(`[flight-detail] no API key configured`);
    return null;
  }
  
  // Try multiple flight number formats
  const formatsToTry = generateFlightNumberFormats(flightNumber);
  console.log(`[flight-detail] trying formats: ${formatsToTry.join(", ")}`);
  
  for (const format of formatsToTry) {
    try {
      console.log(`[flight-detail] trying format "${format}"`);
      
      // Use the search endpoint which we know works (from autocomplete)
      const url = new URL(`https://${AERODATABOX_API_HOST}/flights/search`);
      url.searchParams.set("flightNumber", format);
      url.searchParams.set("limit", "10");
      
      console.log(`[flight-detail] request URL: ${url.toString()}`);
      
      const res = await fetch(url, {
        headers: rapidApiHeaders(AERODATABOX_API_KEY),
        cache: "no-store",
      });
      
      if (!res.ok) {
        console.log(`[flight-detail] format "${format}" failed: HTTP ${res.status}`);
        if (res.status === 429) {
          console.log(`[flight-detail] rate limited, stopping attempts`);
          return null;
        }
        continue; // Try next format
      }
      
      const data = await res.json() as { flights?: AeroAirportFlight[] };
      const flights = data.flights ?? [];
      
      console.log(`[flight-detail] format "${format}" response count=${flights.length}`);
      
      if (flights.length === 0) {
        continue; // Try next format
      }
      
      // Find best matching flight
      const match = findBestFlightMatch(flights, normalizedNumber);
      
      if (match) {
        const detail = normalizeFlightDetail(match);
        console.log(`[flight-detail] selected match=${detail.number} ${detail.departure?.airport?.iata ?? "?"}->${detail.arrival?.airport?.iata ?? "?"}`);
        
        // Cache the result
        setFlightCache(cacheKey, detail, FLIGHT_CACHE_TTL_SECONDS);
        
        return detail;
      }
    } catch (error) {
      console.log(`[flight-detail] format "${format}" error: ${error instanceof Error ? error.message : String(error)}`);
      continue; // Try next format
    }
  }
  
  console.log(`[flight-detail] no match found for ${normalizedNumber} after trying all formats`);
  return null;
}

// Find best matching flight from search results
function findBestFlightMatch(flights: AeroAirportFlight[], targetNumber: string): AeroAirportFlight | null {
  const targetNormalized = normalizeFlightNumber(targetNumber);
  const targetAirline = extractAirlineCode(targetNormalized);
  const targetNumeric = targetNormalized.replace(/^[A-Z]+/, "");
  
  console.log(`[flight-detail] matching against target=${targetNormalized} airline=${targetAirline} numeric=${targetNumeric}`);
  
  // Score each flight
  const scored = flights.map((f) => {
    const flightNormalized = normalizeFlightNumber(f.number);
    const flightAirline = extractAirlineCode(flightNormalized);
    const flightNumeric = flightNormalized.replace(/^[A-Z]+/, "");
    
    let score = 0;
    
    // Exact match (TK94 === TK94)
    if (flightNormalized === targetNormalized) {
      score = 100;
    }
    // Same airline code and numeric part (TK94 matches TK0094)
    else if (flightAirline === targetAirline && flightNumeric === targetNumeric) {
      score = 90;
    }
    // Same airline code and numeric part ignoring leading zeros
    else if (flightAirline === targetAirline && parseInt(flightNumeric, 10) === parseInt(targetNumeric, 10)) {
      score = 80;
    }
    // Same airline code only
    else if (flightAirline === targetAirline) {
      score = 50;
    }
    // Contains the target number
    else if (flightNormalized.includes(targetNumeric)) {
      score = 30;
    }
    
    return { flight: f, score, normalized: flightNormalized };
  });
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  console.log(`[flight-detail] top matches: ${scored.slice(0, 3).map(s => `${s.normalized}(${s.score})`).join(", ")}`);
  
  // Return best match if score is good enough
  if (scored.length > 0 && scored[0].score >= 50) {
    return scored[0].flight;
  }
  
  // If no good match but we have flights, return the first one (closest in time)
  if (scored.length > 0) {
    console.log(`[flight-detail] no strong match, using first result: ${scored[0].normalized}`);
    return scored[0].flight;
  }
  
  return null;
}

// Get flights for a specific airport (cached wrapper around existing function)
export async function getAirportFlights(code: string): Promise<{
  departures: AeroAirportFlight[];
  arrivals: AeroAirportFlight[];
  timestamp: number;
  source: "api" | "cache";
}> {
  const normalizedCode = code.trim().toUpperCase();
  const cacheKey = getCacheKey("airport", normalizedCode);
  
  // Check cache first
  const cached = getFlightCache<{ departures: AeroAirportFlight[]; arrivals: AeroAirportFlight[] }>(cacheKey);
  if (cached) {
    return {
      ...cached,
      timestamp: Date.now(),
      source: "cache",
    };
  }
  
  // Import and call existing airportFids function
  const { getAirportFids } = await import("./server/airportFids");
  
  if (!AERODATABOX_API_KEY) {
    return {
      departures: [],
      arrivals: [],
      timestamp: Date.now(),
      source: "api",
    };
  }
  
  const result = await getAirportFids(normalizedCode, AERODATABOX_API_KEY);
  
  if (!result.ok) {
    return {
      departures: [],
      arrivals: [],
      timestamp: Date.now(),
      source: "api",
    };
  }
  
  // Cache the result
  setFlightCache(cacheKey, result.data, AIRPORT_CACHE_TTL_SECONDS);
  
  return {
    ...result.data,
    timestamp: Date.now(),
    source: "api",
  };
}

// Normalize flight detail into consistent format
function normalizeFlightDetail(flight: AeroAirportFlight): FlightDetail {
  const dep = flight.departure;
  const arr = flight.arrival;
  
  const scheduledDep = dep?.scheduledTime?.local ?? dep?.scheduledTime?.utc ?? null;
  const scheduledArr = arr?.scheduledTime?.local ?? arr?.scheduledTime?.utc ?? null;
  const estimatedDep = dep?.revisedTime?.local ?? dep?.revisedTime?.utc ?? dep?.predictedTime?.local ?? null;
  const estimatedArr = arr?.revisedTime?.local ?? arr?.revisedTime?.utc ?? arr?.predictedTime?.local ?? null;
  const actualDep = dep?.actualTime?.local ?? dep?.actualTime?.utc ?? null;
  const actualArr = arr?.actualTime?.local ?? arr?.actualTime?.utc ?? null;
  
  const delayMinutes = calculateDelay(scheduledDep, estimatedDep, actualDep);
  
  return {
    number: flight.number,
    airline: flight.airline ?? flight.carrier ?? flight.operator ?? { name: "Unknown", iata: null, icao: null },
    departure: dep ?? null,
    arrival: arr ?? null,
    aircraft: flight.aircraft ?? null,
    status: flight.status ?? "Scheduled",
    scheduledDeparture: scheduledDep,
    scheduledArrival: scheduledArr,
    estimatedDeparture: estimatedDep,
    estimatedArrival: estimatedArr,
    actualDeparture: actualDep,
    actualArrival: actualArr,
    delayMinutes,
    gate: dep?.gate ?? null,
    terminal: dep?.terminal ?? null,
    baggageBelt: arr?.gate ?? null, // Some APIs use gate for baggage belt
  };
}

// Calculate delay in minutes
function calculateDelay(
  scheduled: string | null,
  estimated: string | null,
  actual: string | null
): number {
  const scheduledTime = scheduled ? new Date(scheduled).getTime() : null;
  const actualTime = actual ? new Date(actual).getTime() : estimated ? new Date(estimated).getTime() : null;
  
  if (!scheduledTime || !actualTime) return 0;
  
  const diffMs = actualTime - scheduledTime;
  return Math.max(0, Math.round(diffMs / (1000 * 60)));
}

// Score flight match quality
function scoreFlightMatch(flightNumber: string, query: string): number {
  const normalized = normalizeFlightNumber(flightNumber);
  
  // Exact match
  if (normalized === query) return 100;
  
  // Starts with query
  if (normalized.startsWith(query)) {
    return 80 - (normalized.length - query.length) * 5;
  }
  
  // Contains query
  if (normalized.includes(query)) {
    return 50;
  }
  
  // Airline code match only
  const airlineCode = extractAirlineCode(normalized);
  if (query.length <= 3 && airlineCode === query) {
    return 30;
  }
  
  return 0;
}

// Clear specific cache entry
export function clearFlightCache(flightNumber: string): void {
  const cacheKey = getCacheKey("flight", flightNumber);
  cache.delete(cacheKey);
}

// Clear all cache
export function clearAllFlightCache(): void {
  cache.clear();
}

// Get cache stats (for monitoring)
export function getFlightCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
