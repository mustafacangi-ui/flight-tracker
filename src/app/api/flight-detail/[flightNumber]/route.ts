import { NextResponse } from "next/server";

import { getFlightHybrid, type FlightDetail } from "@/src/lib/flightProviders";
import { normalizeFlightNumber } from "@/src/lib/aerodatabox";

export type FlightDetailApiResponse = {
  flight: FlightDetail | null;
  found: boolean;
  source: "api" | "cache" | "mock";
  timestamp: number;
};

export async function GET(request: Request) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { 
        flight: null, 
        found: false, 
        error: "Flight data not configured.",
        source: "mock", 
        timestamp: Date.now() 
      },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const flightNumber = url.searchParams.get("flightNumber")?.trim() ?? "";

  if (!flightNumber) {
    return NextResponse.json(
      { 
        flight: null, 
        found: false, 
        error: "Flight number required.",
        source: "api" as const, 
        timestamp: Date.now() 
      },
      { status: 400 }
    );
  }

  try {
    const normalizedNumber = normalizeFlightNumber(flightNumber);
    
    // Use hybrid provider to fetch flight with fallback support
    const flight = await getFlightHybrid(normalizedNumber);

    if (!flight) {
      return NextResponse.json({
        flight: null,
        found: false,
        source: "api" as const,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({
      flight,
      found: true,
      source: "api" as const,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[flight-detail] Error:", error);
    return NextResponse.json(
      { 
        flight: null, 
        found: false, 
        error: "Could not fetch flight details.",
        source: "api" as const, 
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
