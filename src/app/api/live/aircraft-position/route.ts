import { NextRequest, NextResponse } from "next/server";

import { getAircraftLivePosition } from "../../../../lib/live/getAircraftLivePosition";
import { captureError } from "../../../../lib/monitoring/captureError";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const flight =
    request.nextUrl.searchParams.get("flight")?.trim() ??
    request.nextUrl.searchParams.get("number")?.trim() ??
    "";
  if (!flight) {
    return NextResponse.json(
      { position: null, regionalLabel: null, error: "Missing flight parameter." },
      { status: 400 }
    );
  }

  const dep = request.nextUrl.searchParams.get("dep")?.trim() ?? undefined;
  const arr = request.nextUrl.searchParams.get("arr")?.trim() ?? undefined;

  try {
    const result = await getAircraftLivePosition({
      flightNumber: flight,
      departureAirportCode: dep,
      arrivalAirportCode: arr,
    });
    return NextResponse.json(result);
  } catch (e) {
    captureError(e, {
      area: "live_radar",
      tags: { flight: flight.slice(0, 12) },
      extras: { summary: "getAircraftLivePosition threw" },
      level: "warning",
    });
    return NextResponse.json(
      { position: null, regionalLabel: null },
      { status: 200 }
    );
  }
}
