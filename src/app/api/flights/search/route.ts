import { NextResponse } from "next/server";

import { getAirportFids } from "@/src/lib/server/airportFids";
import type { AeroAirportFlight } from "@/src/lib/flightTypes";

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
  source: "saved" | "live";
};

function normalizeFlightNumber(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

function formatLiveFlight(flight: AeroAirportFlight): FlightSearchResult {
  const dep = flight.departure;
  const arr = flight.arrival;
  
  let status = flight.status ?? "Scheduled";
  if (!status || status === "UNKNOWN") {
    status = "Scheduled";
  }
  
  return {
    type: "flight",
    flightNumber: flight.number,
    airline: flight.airline?.name ?? flight.airline?.iata ?? "Unknown Airline",
    departureAirport: dep?.airport?.iata ?? dep?.airport?.icao ?? "—",
    arrivalAirport: arr?.airport?.iata ?? arr?.airport?.icao ?? "—",
    departureCity: dep?.airport?.municipalityName ?? dep?.airport?.name,
    arrivalCity: arr?.airport?.municipalityName ?? arr?.airport?.name,
    status,
    departureTime: dep?.scheduledTime?.local ?? dep?.scheduledTime?.utc,
    source: "live",
  };
}

// Score how well a flight matches the query (higher = better match)
function scoreFlightMatch(flight: AeroAirportFlight, query: string): number {
  const flightNum = normalizeFlightNumber(flight.number);
  const airlineCode = flight.airline?.iata?.toUpperCase() ?? flight.airline?.icao?.toUpperCase() ?? "";
  
  // Exact match gets highest score
  if (flightNum === query) return 100;
  
  // Flight number starts with query (TK123 matches TK1)
  if (flightNum.startsWith(query)) {
    const extraChars = flightNum.length - query.length;
    return 80 - extraChars * 5;
  }
  
  // Query is airline code and flight uses that airline
  if (query.length <= 3 && airlineCode === query) {
    return 50;
  }
  
  // Partial match within flight number
  if (flightNum.includes(query)) {
    return 30;
  }
  
  return 0;
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
    const results: FlightSearchResult[] = [];
    const seenFlights = new Set<string>();
    const normalizedQuery = normalizeFlightNumber(query);

    // Search live flights from airport board
    const result = await getAirportFids(airport, apiKey);
    
    if (result.ok) {
      const allFlights = [...result.data.departures, ...result.data.arrivals];
      
      // Score and sort flights by relevance
      const scoredFlights = allFlights
        .map((f) => ({
          flight: f,
          score: scoreFlightMatch(f, normalizedQuery),
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      for (const item of scoredFlights) {
        const formatted = formatLiveFlight(item.flight);
        if (!seenFlights.has(formatted.flightNumber)) {
          seenFlights.add(formatted.flightNumber);
          results.push(formatted);
        }
      }
    }

    return NextResponse.json({ 
      flights: results,
      query: normalizedQuery,
    });
  } catch (error) {
    console.error("[flight-search] Error:", error);
    return NextResponse.json(
      { flights: [], error: "Could not search flights." },
      { status: 500 }
    );
  }
}
