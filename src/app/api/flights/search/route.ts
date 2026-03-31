import { NextResponse } from "next/server";

import { searchFlights, normalizeFlightNumber, getFlightCache, setFlightCache, AUTOCOMPLETE_CACHE_TTL_SECONDS, type FlightSearchItem } from "@/src/lib/aerodatabox";
import { searchFlightsHybrid } from "@/src/lib/flightProviders";

export type FlightSearchApiResponse = {
  flights: FlightSearchResult[];
  query: string;
  source: "api" | "cache" | "mock" | "rate_limited" | "aviationstack" | "aerodatabox";
  timestamp: number;
  rateLimited?: boolean;
};

export type FlightSearchResult = {
  type: "flight";
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureCity?: string;
  arrivalCity?: string;
  status: string;
  departureTime?: string;
  source: "live" | "cache";
};

function formatSearchResult(item: FlightSearchItem): FlightSearchResult {
  return {
    type: "flight",
    flightNumber: item.number,
    airline: item.airline,
    departureAirport: item.departureAirport,
    arrivalAirport: item.arrivalAirport,
    departureCity: item.departureCity,
    arrivalCity: item.arrivalCity,
    status: item.status,
    departureTime: item.scheduledTime,
    source: "live",
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim() ?? "";
  const normalizedQuery = normalizeFlightNumber(query);

  // Check server-side cache first
  const cacheKey = `search:${normalizedQuery}`;
  const cached = getFlightCache<FlightSearchApiResponse>(cacheKey);
  
  if (cached) {
    return NextResponse.json({ ...cached, source: "cache" as const });
  }

  if (!query || query.length < 3) {
    return NextResponse.json({ 
      flights: [], 
      query: normalizedQuery, 
      source: "api" as const, 
      timestamp: Date.now() 
    });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { flights: [], error: "Flight search not configured.", query: normalizedQuery, source: "mock" as const, timestamp: Date.now() },
      { status: 503 }
    );
  }

  try {
    // Use hybrid provider to search across all available sources
    const result = await searchFlightsHybrid(query);

    // Format for API response - limit to max 5 results
    const flights = result.flights.slice(0, 5).map(formatSearchResult);
    
    const response: FlightSearchApiResponse = {
      flights,
      query: result.query,
      source: result.source === "cache" ? "api" : result.source,
      timestamp: Date.now(),
    };

    // Cache successful results for 15 minutes
    if (flights.length > 0) {
      setFlightCache(cacheKey, response, AUTOCOMPLETE_CACHE_TTL_SECONDS);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[flight-search] Error:", error);
    
    // Check if this was a rate limit error - return cached data if we have any stale cache
    const staleCache = getFlightCache<FlightSearchApiResponse>(cacheKey);
    if (staleCache) {
      return NextResponse.json({
        ...staleCache,
        source: "cache" as const,
        rateLimited: true,
      });
    }
    
    return NextResponse.json(
      { 
        flights: [], 
        error: "Could not search flights.",
        query: normalizedQuery,
        source: "api" as const,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
