import { NextRequest, NextResponse } from "next/server";

import {
  buildFlightDetailPayload,
  findFlightInFids,
  type FlightDetailPayload,
} from "../../../lib/flightDetail";
import { getAirportFids } from "../../../lib/server/airportFids";

export async function GET(request: NextRequest) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { found: false, error: "Missing RAPIDAPI_KEY." },
      { status: 503 }
    );
  }

  const airport =
    request.nextUrl.searchParams.get("airport")?.trim() || "IST";
  const numberParam =
    request.nextUrl.searchParams.get("number")?.trim() ||
    request.nextUrl.searchParams.get("flight")?.trim() ||
    "";

  if (!numberParam) {
    return NextResponse.json(
      { found: false, error: "Missing number parameter." },
      { status: 400 }
    );
  }

  const result = await getAirportFids(airport, apiKey);
  if (!result.ok) {
    return NextResponse.json(
      { found: false, error: result.error },
      { status: result.status === 429 ? 429 : 502 }
    );
  }

  const match = findFlightInFids(
    result.data.departures,
    result.data.arrivals,
    numberParam,
    airport
  );

  if (!match) {
    return NextResponse.json({ found: false, error: "Flight not found." });
  }

  const allFlights = [...result.data.departures, ...result.data.arrivals];
  const detail = buildFlightDetailPayload(match, airport, { allFlights });

  const res: {
    found: boolean;
    detail: FlightDetailPayload;
    _debug?: { labels: string[] };
  } = { found: true, detail };

  if (process.env.NODE_ENV === "development") {
    res._debug = { labels: ["Real API Data"] };
  }

  return NextResponse.json(res);
}
