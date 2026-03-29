/**
 * Canonical origins for OAuth redirects and post-login navigation.
 * Production Turkish site always uses https://www.fiyatrotasi.com (www + HTTPS).
 */

export const PRODUCTION_CANONICAL_ORIGIN = "https://www.fiyatrotasi.com";

export function normalizeHost(hostname: string): string {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

export function isLocalDevHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local");
}

/** Apex or www production host for RouteWings / FiyatRotasi. */
export function isFiyatrotasiProductionHost(hostname: string): boolean {
  return normalizeHost(hostname) === "fiyatrotasi.com";
}

/**
 * Browser: canonical origin for OAuth `redirectTo` and debug display.
 */
export function getCanonicalOriginClient(): string {
  if (typeof window === "undefined") {
    return "http://localhost:3000";
  }
  const { hostname, origin } = window.location;
  if (isLocalDevHost(hostname)) {
    return origin;
  }
  if (isFiyatrotasiProductionHost(hostname)) {
    return PRODUCTION_CANONICAL_ORIGIN;
  }
  return origin;
}

/**
 * OAuth callback URL registered in Supabase (must match exactly).
 */
export function getOAuthCallbackUrlClient(): string {
  return `${getCanonicalOriginClient()}/auth/callback`;
}

type RequestLike = {
  url: string;
  headers: Headers;
};

/**
 * Server / Edge: build canonical site origin for redirects after OAuth.
 * - localhost / 127.0.0.1 → request URL origin (preserves port).
 * - fiyatrotasi.com / www → https://www.fiyatrotasi.com
 * - Else: NEXT_PUBLIC_SITE_URL if hostname matches, else forwarded/proto + host.
 */
export function getCanonicalSiteOriginForRequest(request: RequestLike): string {
  const urlObj = new URL(request.url);

  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const rawHost =
    forwardedHost || request.headers.get("host")?.split(":")[0] || urlObj.hostname;

  if (isLocalDevHost(rawHost)) {
    return urlObj.origin;
  }

  if (isFiyatrotasiProductionHost(rawHost)) {
    return PRODUCTION_CANONICAL_ORIGIN;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    try {
      const u = new URL(siteUrl);
      if (normalizeHost(u.hostname) === normalizeHost(rawHost)) {
        return u.origin.replace(/\/$/, "");
      }
    } catch {
      /* fall through */
    }
  }

  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (urlObj.protocol === "https:" ? "https" : "http");
  const hostHeader = request.headers.get("host") || urlObj.host;
  return `${proto}://${hostHeader}`;
}
