/**
 * OAuth redirect URL registered in Supabase (Google provider):
 * - http://localhost:3000/auth/callback
 * - https://www.fiyatrotasi.com/auth/callback
 */

const PRODUCTION_CALLBACK_ORIGIN = "https://www.fiyatrotasi.com";

/** Client: derive callback from current host, forcing www for fiyatrotasi.com. */
export function getOAuthRedirectToClient(): string {
  if (typeof window === "undefined") {
    return "http://localhost:3000/auth/callback";
  }
  const { hostname, origin } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const url = `${origin}/auth/callback`;
    console.log("[auth] OAuth redirectTo (localhost)", url);
    return url;
  }
  if (hostname === "fiyatrotasi.com") {
    const url = `${PRODUCTION_CALLBACK_ORIGIN}/auth/callback`;
    console.log("[auth] OAuth redirectTo (apex → www)", url);
    return url;
  }
  if (hostname === "www.fiyatrotasi.com") {
    const url = `${PRODUCTION_CALLBACK_ORIGIN}/auth/callback`;
    console.log("[auth] OAuth redirectTo (production www)", url);
    return url;
  }
  const url = `${origin}/auth/callback`;
  console.log("[auth] OAuth redirectTo (fallback origin)", url);
  return url;
}
