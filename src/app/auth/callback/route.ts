import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

  if (!code) {
    const desc =
      searchParams.get("error_description") ||
      searchParams.get("error") ||
      "Sign-in was cancelled or failed.";
    console.warn("[auth] callback without code", desc);
    return NextResponse.redirect(
      `${origin}/?rw_oauth_error=${encodeURIComponent(desc)}`
    );
  }

  const redirect = NextResponse.redirect(`${origin}${next}`);
  const supabase = createSupabaseRouteHandlerClient(request, redirect);
  if (!supabase) {
    console.error("[auth] Supabase env missing on callback route");
    return NextResponse.redirect(
      `${origin}/?rw_oauth_error=${encodeURIComponent("Server auth is not configured.")}`
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth] exchangeCodeForSession", error.message);
    return NextResponse.redirect(
      `${origin}/?rw_oauth_error=${encodeURIComponent(error.message)}`
    );
  }

  console.log("[auth] OAuth exchange OK, redirecting to", next);
  return redirect;
}
