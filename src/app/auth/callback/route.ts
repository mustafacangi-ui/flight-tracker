import { type NextRequest, NextResponse } from "next/server";

import { getCanonicalSiteOriginForRequest } from "../../../lib/auth/getCanonicalSiteOrigin";
import {
  captureError,
  captureMessage,
} from "../../../lib/monitoring/captureError";
import { createSupabaseRouteHandlerClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Server-only (Vercel / .env.local, not NEXT_PUBLIC).
 * `DEBUG_OAUTH_SUCCESS=1` → after success redirect to `/?oauth=success` instead of `/`
 * to verify the browser follows the redirect chain and client refresh.
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
  const canonicalOrigin = getCanonicalSiteOriginForRequest(request);
  const host = request.headers.get("host");
  const xfHost = request.headers.get("x-forwarded-host");
  const xfProto = request.headers.get("x-forwarded-proto");
  const requestOrigin = new URL(request.url).origin;

  console.log("[auth] callback request origin & forwarding", {
    requestOrigin,
    canonicalOrigin,
    host,
    xForwardedHost: xfHost,
    xForwardedProto: xfProto,
  });

  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next");
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/";

  console.log("[auth] callback query", {
    hasCode: Boolean(code),
    codeLength: code?.length ?? 0,
    nextParam: nextRaw,
    nextResolved: next,
    allParams: safeSearchParams(searchParams),
  });

  if (!code) {
    const desc =
      searchParams.get("error_description") ||
      searchParams.get("error") ||
      "Sign-in was cancelled or failed.";
    console.warn("[auth] callback without code", { desc });
    captureMessage("OAuth callback without code (Google/Apple or cancel)", {
      area: "oauth_callback",
      tags: { phase: "missing_code" },
      level: "info",
    });
    return NextResponse.redirect(
      `${canonicalOrigin}/?rw_oauth_error=${encodeURIComponent(desc)}`
    );
  }

  let redirectTarget = `${canonicalOrigin}${next}`;
  if (DEBUG_OAUTH_SUCCESS && next === "/") {
    redirectTarget = `${canonicalOrigin}/?oauth=success`;
  }

  console.log("[auth] callback redirect target (pre-exchange)", {
    redirectTarget,
    debugOauthSuccess: DEBUG_OAUTH_SUCCESS,
  });

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
      `${canonicalOrigin}/?rw_oauth_error=${encodeURIComponent("Server auth is not configured.")}`
    );
  }

  console.log("[auth] callback before exchange", {
    cookiesIncoming: request.cookies.getAll().map((c) => c.name),
    redirectTargetPlanned: redirectTarget,
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
      `${canonicalOrigin}/?rw_oauth_error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  const {
    data: { session },
    error: sessionReadError,
  } = await supabase.auth.getSession();

  console.log("[auth] callback getSession immediately after exchange", {
    hasSession: Boolean(session),
    userId: session?.user?.id ?? null,
    err: sessionReadError?.message ?? null,
  });

  const cookiesOutgoing = summarizeResponseCookies(redirect);
  console.log("[auth] response cookies after exchange (names + value lengths)", cookiesOutgoing);
  console.log("[auth] Set-Cookie count on redirect", cookiesOutgoing.length);

  console.log("[auth] OAuth exchange OK → final redirect", {
    finalUrl: redirectTarget,
    next,
    debugOauthSuccess: DEBUG_OAUTH_SUCCESS,
    canonicalOrigin,
  });

  return redirect;
}
