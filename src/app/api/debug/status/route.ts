import { NextResponse } from "next/server";

const FLIGHT_FIDS_CACHE_TTL_MS = 5 * 60 * 1000;
const AIRPORT_SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Safe diagnostics for QA — never exposes secret values.
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    vercelEnv: process.env.VERCEL_ENV ?? null,
    rapidApiKeyConfigured: Boolean(process.env.RAPIDAPI_KEY?.trim()),
    nextPublicSiteUrlConfigured: Boolean(siteUrl),
    nextPublicSiteUrlHost: siteUrl
      ? (() => {
          try {
            return new URL(siteUrl).host;
          } catch {
            return "(invalid URL)";
          }
        })()
      : null,
    /** In-memory server cache TTLs (see airportFids + airports API routes). */
    serverFlightFidsCacheTtlMs: FLIGHT_FIDS_CACHE_TTL_MS,
    serverAirportSearchCacheTtlMs: AIRPORT_SEARCH_CACHE_TTL_MS,
  });
}
