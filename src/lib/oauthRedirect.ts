/**
 * OAuth redirect URL registered in Supabase (Authentication → URL configuration).
 * Used by Google, Apple, and any other `signInWithOAuth` providers:
 * - http://localhost:3000/auth/callback
 * - https://www.fiyatrotasi.com/auth/callback
 *
 * Apple Developer “Return URLs” / Services ID must match the same callback URL.
 *
 * `NEXT_PUBLIC_SITE_URL` (optional): used for non–fiyatrotasi deployments when
 * hostname matches the configured origin.
 */

import {
  getCanonicalOriginClient,
  getOAuthCallbackUrlClient,
  isFiyatrotasiProductionHost,
  isLocalDevHost,
  normalizeHost,
} from "./auth/getCanonicalSiteOrigin";

function tryCallbackFromSiteUrl(hostname: string): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (normalizeHost(u.hostname) !== normalizeHost(hostname)) return null;
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

  if (isLocalDevHost(hostname)) {
    redirectTo = `${origin}/auth/callback`;
    reason = "localhost / 127.0.0.1 → window.origin";
  } else if (isFiyatrotasiProductionHost(hostname)) {
    redirectTo = getOAuthCallbackUrlClient();
    reason = "fiyatrotasi → canonical www HTTPS callback";
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
    canonicalClient: getCanonicalOriginClient(),
    oauthCallbackUrl: getOAuthCallbackUrlClient(),
    NEXT_PUBLIC_SITE_URL: siteUrlEnv,
    siteUrlUsed: Boolean(fromSiteUrl),
  });

  return redirectTo;
}
