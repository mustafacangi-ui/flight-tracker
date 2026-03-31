import { NextResponse } from "next/server";
import { searchFlights, getFlightByNumber, normalizeFlightNumber } from "@/src/lib/aerodatabox";
import { searchFlightsHybrid } from "@/src/lib/flightProviders";

export type FlightComparisonResponse = {
  query: string;
  normalizedQuery: string;
  autocomplete: {
    source: string;
    flightCount: number;
    flights: Array<{
      number: string;
      airline: string;
      departureAirport: string;
      arrivalAirport: string;
      score: number;
    }>;
    rawResponse?: unknown;
  };
  detailLookup: {
    found: boolean;
    flightNumber?: string;
    airline?: string;
    departureAirport?: string;
    arrivalAirport?: string;
    error?: string;
  };
  hybridSearch?: {
    source: string;
    flightCount: number;
    flights: Array<{
      number: string;
      airline: string;
      departureAirport: string;
      arrivalAirport: string;
    }>;
  };
  timestamp: number;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim() ?? "";
  
  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter. Use ?query=TK1244" },
      { status: 400 }
    );
  }
  
  const normalizedQuery = normalizeFlightNumber(query);
  
  console.log(`[flight-compare] ========== COMPARISON START ==========`);
  console.log(`[flight-compare] query="${query}" normalized="${normalizedQuery}"`);
  
  // 1. Run autocomplete search
  console.log(`[flight-compare] --- RUNNING AUTOCOMPLETE SEARCH ---`);
  const autocompleteResult = await searchFlights(query);
  
  // 2. Run detail lookup
  console.log(`[flight-compare] --- RUNNING DETAIL LOOKUP ---`);
  const detailResult = await getFlightByNumber(query);
  
  // 3. Run hybrid search (what the API uses)
  console.log(`[flight-compare] --- RUNNING HYBRID SEARCH ---`);
  const hybridResult = await searchFlightsHybrid(query);
  
  // Build response
  const response: FlightComparisonResponse = {
    query,
    normalizedQuery,
    autocomplete: {
      source: autocompleteResult.source,
      flightCount: autocompleteResult.flights.length,
      flights: autocompleteResult.flights.map(f => ({
        number: f.number,
        airline: f.airline,
        departureAirport: f.departureAirport,
        arrivalAirport: f.arrivalAirport,
        score: f.score,
      })),
      rawResponse: (autocompleteResult as { _rawResponse?: unknown })._rawResponse,
    },
    detailLookup: detailResult 
      ? {
          found: true,
          flightNumber: detailResult.number,
          airline: detailResult.airline?.name ?? "Unknown",
          departureAirport: detailResult.departure?.airport?.iata ?? "—",
          arrivalAirport: detailResult.arrival?.airport?.iata ?? "—",
        }
      : {
          found: false,
          error: "Flight not found in detail lookup",
        },
    hybridSearch: {
      source: hybridResult.source,
      flightCount: hybridResult.flights.length,
      flights: hybridResult.flights.slice(0, 5).map(f => ({
        number: f.number,
        airline: f.airline,
        departureAirport: f.departureAirport,
        arrivalAirport: f.arrivalAirport,
      })),
    },
    timestamp: Date.now(),
  };
  
  console.log(`[flight-compare] ========== COMPARISON COMPLETE ==========`);
  console.log(`[flight-compare] Autocomplete: ${response.autocomplete.flightCount} flights from ${response.autocomplete.source}`);
  console.log(`[flight-compare] Detail lookup: ${response.detailLookup.found ? "FOUND" : "NOT FOUND"}`);
  if (response.hybridSearch) {
    console.log(`[flight-compare] Hybrid search: ${response.hybridSearch.flightCount} flights from ${response.hybridSearch.source}`);
  }
  
  return NextResponse.json(response);
}
