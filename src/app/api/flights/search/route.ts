import { NextResponse } from "next/server";

import { getAirportFids } from "@/src/lib/server/airportFids";
import type { AeroAirportFlight } from "@/src/lib/flightTypes";

type FlightSuggestion = {
  type: "flight";
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  arrivalCity?: string;
};

function normalizeFlightNumber(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

function matchesFlightQuery(flight: AeroAirportFlight, query: string): boolean {
  const normalizedQuery = normalizeFlightNumber(query);
  const flightNum = normalizeFlightNumber(flight.number);
  const airlineCode = flight.airline?.iata?.toUpperCase() ?? flight.airline?.icao?.toUpperCase() ?? "";
  
  // Match by full flight number (TK123)
  if (flightNum.startsWith(normalizedQuery)) return true;
  
  // Match by airline code only (TK)
  if (normalizedQuery.length <= 3 && airlineCode.startsWith(normalizedQuery)) return true;
  
  return false;
}

function formatFlightSuggestion(flight: AeroAirportFlight): FlightSuggestion {
  const dep = flight.departure;
  const arr = flight.arrival;
  
  return {
    type: "flight",
    flightNumber: flight.number,
    airline: flight.airline?.name ?? flight.airline?.iata ?? "Unknown Airline",
    departureAirport: dep?.airport?.iata ?? dep?.airport?.icao ?? "—",
    arrivalAirport: arr?.airport?.iata ?? arr?.airport?.icao ?? "—",
    arrivalCity: arr?.airport?.municipalityName ?? undefined,
  };
}

export async function GET(request: Request) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { flights: [], error: "Flight search not configured." },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim() ?? "";
  const airport = url.searchParams.get("airport")?.trim().toUpperCase() || "IST";

  if (!query || query.length < 2) {
    return NextResponse.json({ flights: [] });
  }

  try {
    // Search flights from the specified airport (default IST)
    const result = await getAirportFids(airport, apiKey);
    
    if (!result.ok) {
      return NextResponse.json(
        { flights: [], error: result.error },
        { status: result.status === 429 ? 429 : 502 }
      );
    }

    const allFlights = [...result.data.departures, ...result.data.arrivals];
    
    // Filter flights matching the query
    const matchingFlights = allFlights
      .filter((f) => matchesFlightQuery(f, query))
      .slice(0, 5) // Limit to 5 suggestions
      .map(formatFlightSuggestion);

    return NextResponse.json({ flights: matchingFlights });
  } catch (error) {
    console.error("[flight-search] Error:", error);
    return NextResponse.json(
      { flights: [], error: "Could not search flights." },
      { status: 500 }
    );
  }
}
