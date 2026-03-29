import { type NextRequest, NextResponse } from "next/server";

import {
  captureError,
  captureMessage,
} from "../../../lib/monitoring/captureError";
import { createSupabaseRouteHandlerClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Server-only (Vercel / .env.local, not NEXT_PUBLIC).
 * `DEBUG_OAUTH_SUCCESS=1` → after success redirect to `/?oauth=success` instead of `/`
 * to verify the browser follows the redirect chain.
 */
const DEBUG_OAUTH_SUCCESS = process.env.DEBUG_OAUTH_SUCCESS === "1";

function safeSearchParams(searchParams: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key === "code") {
      out[key] = value ? `[redacted ${value.length} chars]` : "";
      return;
    }
    out[key] = value;
  });
  return out;
}

function summarizeResponseCookies(res: NextResponse): { name: string; valueLength: number }[] {
  try {
    return res.cookies.getAll().map((c) => ({
      name: c.name,
      valueLength: c.value?.length ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const host = request.headers.get("host");
  console.log("[auth] callback request meta", {
    host,
    nextUrlOrigin: request.nextUrl.origin,
    nextUrlHref: request.nextUrl.href,
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
  });

  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next");
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/";

  console.log("[auth] callback query", {
    hasCode: Boolean(code),
    codeLength: code?.length ?? 0,
    hasNextParam: nextRaw != null,
    nextResolved: next,
    allParams: safeSearchParams(searchParams),
    urlOrigin: origin,
  });

  if (!code) {
    const desc =
      searchParams.get("error_description") ||
      searchParams.get("error") ||
      "Sign-in was cancelled or failed.";
    console.warn("[auth] callback without code", { desc });
    return NextResponse.redirect(
      `${origin}/?rw_oauth_error=${encodeURIComponent(desc)}`
    );
  }

  let redirectTarget = `${origin}${next}`;
  if (DEBUG_OAUTH_SUCCESS && next === "/") {
    redirectTarget = `${origin}/?oauth=success`;
  }

  const redirect = NextResponse.redirect(redirectTarget);
  const supabase = createSupabaseRouteHandlerClient(request, redirect);
  if (!supabase) {
    console.error("[auth] Supabase env missing on callback route");
    captureMessage("OAuth callback: Supabase client unavailable", {
      area: "oauth_callback",
      tags: { phase: "env" },
      level: "error",
    });
    return NextResponse.redirect(
      `${origin}/?rw_oauth_error=${encodeURIComponent("Server auth is not configured.")}`
    );
  }

  console.log("[auth] callback before exchange", {
    cookiesIncoming: request.cookies.getAll().map((c) => c.name),
    redirectTargetPlanned: redirectTarget,
    debugOauthSuccess: DEBUG_OAUTH_SUCCESS,
  });

  const exchangeResult = await supabase.auth.exchangeCodeForSession(code);
  const { error: exchangeError, data: exchangeData } = exchangeResult;

  console.log("[auth] exchangeCodeForSession result", {
    ok: !exchangeError,
    errorMessage: exchangeError?.message ?? null,
    errorStatus: (exchangeError as { status?: number } | null)?.status ?? null,
    hasSessionInData: Boolean(exchangeData?.session),
    userId: exchangeData?.session?.user?.id ?? null,
  });

  if (exchangeError) {
    console.error("[auth] exchangeCodeForSession failed", exchangeError.message);
    captureError(new Error(exchangeError.message), {
      area: "oauth_callback",
      tags: { phase: "exchange_code_for_session" },
      extras: {
        summary: "Google or Apple OAuth session exchange failed",
      },
    });
    return NextResponse.redirect(
      `${origin}/?rw_oauth_error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  const {
    data: { session },
    error: sessionReadError,
  } = await supabase.auth.getSession();

  console.log("[auth] callback getSession after exchangeCodeForSession", {
    hasSession: Boolean(session),
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    err: sessionReadError?.message ?? null,
  });

  const cookiesOutgoing = summarizeResponseCookies(redirect);
  console.log("[auth] response cookies after exchange (names + value lengths)", cookiesOutgoing);
  console.log("[auth] Set-Cookie count on redirect", cookiesOutgoing.length);

  console.log("[auth] OAuth exchange OK → final redirect", {
    finalUrl: redirectTarget,
    next,
    debugOauthSuccess: DEBUG_OAUTH_SUCCESS,
  });

  return redirect;
}
