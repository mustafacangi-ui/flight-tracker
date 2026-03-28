import { NextRequest, NextResponse } from "next/server";

import { getAirportFids } from "../../../lib/server/airportFids";

export async function GET(request: NextRequest) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Missing RAPIDAPI_KEY environment variable.",
        departures: [],
        arrivals: [],
      },
      { status: 503 }
    );
  }

  const param =
    request.nextUrl.searchParams.get("airport")?.trim().toUpperCase() || "IST";

  const result = await getAirportFids(param, apiKey);

  if (!result.ok) {
    if (result.status === 429 && result.fallback) {
      return NextResponse.json(
        {
          error: result.error,
          departures: [],
          arrivals: [],
          fallback: true,
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: result.error, departures: [], arrivals: [] },
      { status: result.status >= 400 ? result.status : 502 }
    );
  }

  return NextResponse.json(result.data);
}
