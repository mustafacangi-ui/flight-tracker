import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next");
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/";

  console.log("[auth] /auth/callback", {
    origin,
    hasCode: Boolean(code),
    next,
  });

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    console.error("[auth] Supabase env missing on callback route");
    return NextResponse.redirect(
      `${origin}/?rw_oauth_error=${encodeURIComponent("Server auth is not configured.")}`
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth] exchangeCodeForSession", error.message);
      return NextResponse.redirect(
        `${origin}/?rw_oauth_error=${encodeURIComponent(error.message)}`
      );
    }
    console.log("[auth] OAuth exchange OK, redirecting to", next);
    return NextResponse.redirect(`${origin}${next}`);
  }

  const desc =
    searchParams.get("error_description") ||
    searchParams.get("error") ||
    "Sign-in was cancelled or failed.";
  console.warn("[auth] callback without code", desc);
  return NextResponse.redirect(
    `${origin}/?rw_oauth_error=${encodeURIComponent(desc)}`
  );
}
