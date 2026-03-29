/**
 * OAuth redirect URL registered in Supabase (Authentication → URL configuration).
 * Used by Google, Apple, and any other `signInWithOAuth` providers:
 * - http://localhost:3000/auth/callback
 * - https://www.fiyatrotasi.com/auth/callback
 *
 * Apple Developer “Return URLs” / Services ID must match the same callback URL.
 *
 * `NEXT_PUBLIC_SITE_URL` (optional): canonical site origin. Used for callback
 * only when its hostname matches the current page (after stripping `www.`), so
 * a stale `http://localhost:3000` in production cannot send users to localhost.
 */

const PRODUCTION_CALLBACK_ORIGIN = "https://www.fiyatrotasi.com";

function normalizeHost(hostname: string): string {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

function hostsMatch(a: string, b: string): boolean {
  return normalizeHost(a) === normalizeHost(b);
}

function tryCallbackFromSiteUrl(hostname: string): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (!hostsMatch(u.hostname, hostname)) return null;
    const base = u.origin.replace(/\/$/, "");
    return `${base}/auth/callback`;
  } catch {
    return null;
  }
}

/** Client: derive OAuth `redirectTo` (must match Supabase “Redirect URLs” exactly). */
export function getOAuthRedirectToClient(): string {
  if (typeof window === "undefined") {
    return "http://localhost:3000/auth/callback";
  }

  const { href, hostname, origin } = window.location;
  const siteUrlEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "(unset)";

  const fromSiteUrl = tryCallbackFromSiteUrl(hostname);
  let redirectTo: string;
  let reason: string;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    redirectTo = `${origin}/auth/callback`;
    reason = "localhost / 127.0.0.1 → window.origin";
  } else if (hostname === "fiyatrotasi.com" || hostname === "www.fiyatrotasi.com") {
    redirectTo = `${PRODUCTION_CALLBACK_ORIGIN}/auth/callback`;
    reason = "fiyatrotasi.com → canonical www HTTPS";
  } else if (fromSiteUrl) {
    redirectTo = fromSiteUrl;
    reason = "NEXT_PUBLIC_SITE_URL hostname matches current host";
  } else {
    redirectTo = `${origin}/auth/callback`;
    reason = "fallback → window.origin";
  }

  console.log("[auth] getOAuthRedirectToClient", {
    redirectTo,
    reason,
    window: { href, hostname, origin },
    NEXT_PUBLIC_SITE_URL: siteUrlEnv,
    siteUrlUsed: Boolean(fromSiteUrl),
  });

  return redirectTo;
}
