/**
 * Sign in with Apple via Supabase Auth (`signInWithOAuth` provider `apple`).
 *
 * Apple credentials (Services ID, Team ID, Key ID, private key) are configured
 * in the Supabase Dashboard — not in this Next.js app. See README section
 * “Sign in with Apple (Phase 1)” for the full checklist.
 */

import { captureError } from "../monitoring/captureError";
import { getOAuthRedirectToClient } from "../oauthRedirect";
import { createBrowserSupabaseClient } from "../supabase/client";

export type AppleSignInResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Starts Apple OAuth. On success the browser is redirected by Supabase to Apple,
 * then back to `/auth/callback` (production: https://www.fiyatrotasi.com/auth/callback,
 * local: http://localhost:3000/auth/callback).
 */
export async function signInWithApple(): Promise<AppleSignInResult> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) {
    return {
      ok: false,
      error:
        "Sign-in is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const redirectTo = getOAuthRedirectToClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let supabaseHost = "(unset)";
  try {
    if (supabaseUrl) supabaseHost = new URL(supabaseUrl).hostname;
  } catch {
    supabaseHost = "(invalid URL)";
  }

  console.log("[auth] signInWithApple start", {
    provider: "apple",
    windowHref: typeof window !== "undefined" ? window.location.href : "(ssr)",
    windowHostname:
      typeof window !== "undefined" ? window.location.hostname : "(ssr)",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "(unset)",
    NEXT_PUBLIC_SUPABASE_HOST: supabaseHost,
  });
  console.log("[auth] apple redirectTo", redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: { redirectTo },
  });

  if (error) {
    console.error("[auth] Apple OAuth error", error.message);
    captureError(new Error(error.message), {
      area: "apple_oauth",
      tags: { phase: "signInWithOAuth" },
    });
    return { ok: false, error: error.message };
  }

  let providerUrlHost: string | null = null;
  if (data?.url) {
    try {
      providerUrlHost = new URL(data.url).hostname;
    } catch {
      providerUrlHost = "(parse error)";
    }
  }
  console.log("[auth] Apple OAuth success → navigate to provider", {
    providerUrlHost,
  });

  return { ok: true };
}
