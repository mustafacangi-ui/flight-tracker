import { randomBytes } from "crypto";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { normalizeFlightNumberKey } from "../../../../lib/flightDetail";
import { userHasPremiumSubscription } from "../../../../lib/premiumUserMeta";

export const dynamic = "force-dynamic";

function generateShareToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {
        /* session refresh not required on this response */
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!userHasPremiumSubscription(user)) {
    return NextResponse.json(
      {
        error: "Premium required for private family tracking links.",
        code: "PREMIUM_REQUIRED",
      },
      { status: 403 }
    );
  }

  let body: { flightNumber?: string; expiresInDays?: number };
  try {
    body = (await request.json()) as { flightNumber?: string; expiresInDays?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.flightNumber?.trim();
  if (!raw) {
    return NextResponse.json({ error: "flightNumber required" }, { status: 400 });
  }
  const flightNumber = normalizeFlightNumberKey(raw);

  const days =
    typeof body.expiresInDays === "number" && body.expiresInDays > 0
      ? Math.min(body.expiresInDays, 90)
      : 7;
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString();

  let shareToken = "";
  let lastError: string | null = null;
  for (let i = 0; i < 5; i++) {
    shareToken = generateShareToken();
    const { error } = await supabase.from("family_tracking_links").insert({
      user_id: user.id,
      flight_number: flightNumber,
      share_token: shareToken,
      expires_at: expiresAt,
    });
    if (!error) {
      lastError = null;
      break;
    }
    lastError = error.message;
    if (error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  if (lastError) {
    return NextResponse.json({ error: lastError }, { status: 500 });
  }

  const origin = request.nextUrl.origin;
  const path = `/family/${encodeURIComponent(shareToken)}`;
  const shareUrl = `${origin}${path}`;

  return NextResponse.json(
    { ok: true, shareToken, path, shareUrl, expiresAt },
    { headers: { "Cache-Control": "no-store" } }
  );
}
