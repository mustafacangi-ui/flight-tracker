import { NextRequest, NextResponse } from "next/server";

import type { AeroAirportFlight } from "../../../lib/flightTypes";
import { mapStatus } from "../../../lib/formatFlights";
import type { AircraftHistoryItem } from "../../../lib/flightDetail";
import { getRapidApiHost, rapidApiHeaders } from "../../../lib/server/rapidApiConfig";

function airportCode(
  a: { iata?: string | null; icao?: string | null } | null | undefined
): string {
  if (!a) return "?";
  return (a.iata || a.icao || "?").trim().toUpperCase() || "?";
}

function shortTime(raw: string | undefined | null): string {
  if (raw == null || !String(raw).trim()) return "--:--";
  const t = String(raw).trim();
  const iso = t.match(/T(\d{1,2}):(\d{2})/);
  if (iso) {
    return `${String(iso[1]).padStart(2, "0")}:${iso[2]}`;
  }
  const hm = t.match(/^(\d{1,2}):(\d{2})/);
  if (hm) {
    return `${String(hm[1]).padStart(2, "0")}:${hm[2]}`;
  }
  return t.slice(0, 5);
}

function formatHistoryItem(f: AeroAirportFlight): AircraftHistoryItem {
  const dep = f.departure;
  const arr = f.arrival;
  const dCode = airportCode(dep?.airport);
  const aCode = airportCode(arr?.airport);
  const depT =
    dep?.scheduledTime?.local?.trim() ||
    dep?.revisedTime?.local?.trim() ||
    dep?.predictedTime?.local?.trim() ||
    "";
  const arrT =
    arr?.scheduledTime?.local?.trim() ||
    arr?.revisedTime?.local?.trim() ||
    arr?.predictedTime?.local?.trim() ||
    "";
  const { label } = mapStatus(f.status);
  return {
    number: f.number.trim(),
    route: `${dCode} → ${aCode}`,
    departureTime: shortTime(depT),
    arrivalTime: shortTime(arrT),
    status: label,
  };
}

function extractFlightsArray(data: unknown): AeroAirportFlight[] {
  if (Array.isArray(data)) {
    return data.filter(
      (x): x is AeroAirportFlight =>
        x != null && typeof x === "object" && typeof (x as AeroAirportFlight).number === "string"
    );
  }
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const key of ["flights", "items", "data"]) {
      const v = o[key];
      if (Array.isArray(v)) return extractFlightsArray(v);
    }
  }
  return [];
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { items: [], error: "Missing RAPIDAPI_KEY." },
      { status: 503 }
    );
  }

  const reg =
    request.nextUrl.searchParams.get("reg")?.trim().replace(/\s+/g, "") ?? "";
  if (!reg || reg.length < 3) {
    return NextResponse.json(
      { items: [], error: "Missing or invalid reg." },
      { status: 400 }
    );
  }

  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
  const fromStr = from.toISOString().slice(0, 16);
  const toStr = to.toISOString().slice(0, 16);

  const host = getRapidApiHost();
  const paths = [
    `https://${host}/flights/aircraft/reg/${encodeURIComponent(reg)}/${fromStr}/${toStr}`,
    `https://${host}/flights/aircraft/reg/${encodeURIComponent(reg)}/${fromStr}Z/${toStr}Z`,
  ];

  let flights: AeroAirportFlight[] = [];
  let lastStatus = 0;

  for (const url of paths) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: rapidApiHeaders(apiKey),
        cache: "no-store",
      });
    } catch {
      continue;
    }
    lastStatus = res.status;
    if (!res.ok) continue;
    try {
      const data = (await res.json()) as unknown;
      flights = extractFlightsArray(data);
      if (flights.length > 0) break;
    } catch {
      continue;
    }
  }

  const items = flights.map(formatHistoryItem);
  return NextResponse.json({
    items,
    upstreamStatus: lastStatus,
    ...(items.length === 0 ? { note: "No history rows parsed or API path returned empty." } : {}),
  });
}
