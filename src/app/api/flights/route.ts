import { NextRequest, NextResponse } from "next/server";

import { captureError } from "../../../lib/monitoring/captureError";
import { getAirportFlightsHybrid } from "../../../lib/flightProviders";

export async function GET(request: NextRequest) {
  const param =
    request.nextUrl.searchParams.get("airport")?.trim().toUpperCase() || "IST";

  try {
    const result = await getAirportFlightsHybrid(param);

    // Check if we got real data or empty results
    const hasData = result.departures.length > 0 || result.arrivals.length > 0;
    
    if (!hasData && result.source === "mock") {
      // All providers failed
      return NextResponse.json(
        { 
          error: "Unable to fetch flight data from any provider",
          departures: [],
          arrivals: [],
          source: result.source,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      departures: result.departures,
      arrivals: result.arrivals,
      timestamp: result.timestamp,
      source: result.source,
    });
  } catch (error) {
    captureError(error instanceof Error ? error : new Error(String(error)), {
      area: "api_flights",
      tags: { airport: param },
      level: "error",
    });
    
    return NextResponse.json(
      { 
        error: "Failed to fetch flight data",
        departures: [],
        arrivals: [],
      },
      { status: 500 }
    );
  }
}
