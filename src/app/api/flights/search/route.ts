import { NextResponse } from "next/server";

import { searchFlights, normalizeFlightNumber, type FlightSearchItem } from "@/src/lib/aerodatabox";
import { searchFlightsHybrid } from "@/src/lib/flightProviders";

export type FlightSearchApiResponse = {
  flights: FlightSearchResult[];
  query: string;
  source: "api" | "cache" | "mock";
  timestamp: number;
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
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { flights: [], error: "Flight search not configured.", query: "", source: "mock", timestamp: Date.now() },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim() ?? "";

  if (!query || query.length < 2) {
    return NextResponse.json({ 
      flights: [], 
      query: normalizeFlightNumber(query), 
      source: "api" as const, 
      timestamp: Date.now() 
    });
  }

  try {
    // Use hybrid provider to search across all available sources
    const result = await searchFlightsHybrid(query);

    // Format for API response
    const flights = result.flights.map(formatSearchResult);

    return NextResponse.json({
      flights,
      query: result.query,
      source: result.source,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error("[flight-search] Error:", error);
    return NextResponse.json(
      { 
        flights: [], 
        error: "Could not search flights.",
        query: normalizeFlightNumber(query),
        source: "api" as const,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
