import { NextRequest, NextResponse } from "next/server";

import type {
  AirportsApiResponse,
  SimplifiedAirport,
} from "../../../lib/airportSearchTypes";
import { getRapidApiHost, rapidApiHeaders } from "../../../lib/server/rapidApiConfig";

const CACHE_TTL_MS = 5 * 60 * 1000;

/** Upstream: GET /airports/search/term?q= (RapidAPI docs); we expose `query` and map to `q`. */
const UPSTREAM_PATH = "/airports/search/term";

const searchCache = new Map<
  string,
  { data: AirportsApiResponse; timestamp: number }
>();

type UpstreamAirport = {
  iata?: string | null;
  icao?: string | null;
  name?: string;
  shortName?: string | null;
  municipalityName?: string | null;
  countryCode?: string | null;
  timeZone?: string | { id?: string | null } | null;
  timeZoneId?: string | null;
  location?: { timeZone?: string | { id?: string | null } | null } | null;
};

type UpstreamBody = {
  items?: UpstreamAirport[] | null;
};

function pickIanaTimeZone(item: UpstreamAirport): string | undefined {
  const fromNested = item.location?.timeZone;
  const candidates = [
    typeof item.timeZone === "string" ? item.timeZone : undefined,
    item.timeZone &&
    typeof item.timeZone === "object" &&
    typeof item.timeZone.id === "string"
      ? item.timeZone.id
      : undefined,
    typeof item.timeZoneId === "string" ? item.timeZoneId : undefined,
    typeof fromNested === "string" ? fromNested : undefined,
    fromNested &&
    typeof fromNested === "object" &&
    typeof fromNested.id === "string"
      ? fromNested.id
      : undefined,
  ];
  for (const c of candidates) {
    const t = c?.trim();
    if (t) return t;
  }
  return undefined;
}

function simplifyAirport(item: UpstreamAirport): SimplifiedAirport | null {
  const code =
    item.iata?.trim() ||
    item.icao?.trim() ||
    "";
  if (!code) return null;

  const name =
    item.shortName?.trim() ||
    item.name?.trim() ||
    code;
  const city = item.municipalityName?.trim() || "-";
  const country = item.countryCode?.trim() || "-";
  const timezone = pickIanaTimeZone(item);

  return { code, name, city, country, ...(timezone ? { timezone } : {}) };
}

export async function GET(request: NextRequest) {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    const body: AirportsApiResponse = {
      airports: [],
      error: "Missing RAPIDAPI_KEY environment variable.",
    };
    return NextResponse.json(body, { status: 503 });
  }

  const rawQuery = request.nextUrl.searchParams.get("query")?.trim() ?? "";
  if (rawQuery.length < 3) {
    const body: AirportsApiResponse = { airports: [] };
    return NextResponse.json(body);
  }

  const cacheKey = rawQuery.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const url = new URL(`https://${getRapidApiHost()}${UPSTREAM_PATH}`);
  url.searchParams.set("q", rawQuery);
  url.searchParams.set("limit", "15");

  let res: Response;
  try {
    res = await fetch(url, {
      headers: rapidApiHeaders(key),
      cache: "no-store",
    });
  } catch {
    const body: AirportsApiResponse = {
      airports: [],
      error: "Failed to reach AeroDataBox.",
    };
    return NextResponse.json(body, { status: 502 });
  }

  if (res.status === 204) {
    const body: AirportsApiResponse = { airports: [] };
    searchCache.set(cacheKey, { data: body, timestamp: Date.now() });
    return NextResponse.json(body);
  }

  if (!res.ok) {
    /** Upstream documents min. 3 non-whitespace chars for `q`; treat short queries as empty. */
    if (res.status === 400 && rawQuery.replace(/\s/g, "").length < 3) {
      return NextResponse.json({ airports: [] } satisfies AirportsApiResponse);
    }
    let message = res.statusText;
    const text = await res.text();
    try {
      const errJson = JSON.parse(text) as { message?: string };
      if (typeof errJson.message === "string") message = errJson.message;
    } catch {
      if (text) message = text.slice(0, 200);
    }
    const body: AirportsApiResponse = { airports: [], error: message };
    return NextResponse.json(body, {
      status: res.status >= 400 && res.status < 600 ? res.status : 502,
    });
  }

  let data: UpstreamBody;
  try {
    data = (await res.json()) as UpstreamBody;
  } catch {
    const body: AirportsApiResponse = {
      airports: [],
      error: "Invalid JSON from AeroDataBox.",
    };
    return NextResponse.json(body, { status: 502 });
  }

  const items = data.items ?? [];
  const airports: SimplifiedAirport[] = [];
  for (const item of items) {
    const row = simplifyAirport(item);
    if (row) airports.push(row);
  }

  const body: AirportsApiResponse = { airports };
  searchCache.set(cacheKey, { data: body, timestamp: Date.now() });
  return NextResponse.json(body);
}
