import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { configureWebPush, isWebPushConfigured, webpush } from "../../../../lib/serverWebPush";

export const dynamic = "force-dynamic";

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
        /* test route: no session refresh write-back */
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

  if (!isWebPushConfigured() || !configureWebPush()) {
    return NextResponse.json(
      { error: "VAPID keys not configured on server" },
      { status: 503 }
    );
  }

  let endpointFilter: string | undefined;
  try {
    const body = (await request.json()) as { endpoint?: string };
    endpointFilter = body.endpoint?.trim();
  } catch {
    /* empty body ok */
  }

  let q = supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);
  if (endpointFilter) q = q.eq("endpoint", endpointFilter);
  const { data: rows, error: qErr } = await q;
  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }
  if (!rows?.length) {
    return NextResponse.json({ error: "No push subscription found" }, { status: 404 });
  }

  const payload = JSON.stringify({
    title: "RouteWings",
    body: "Test push — flight alerts are live.",
    url: "/",
  });

  let sent = 0;
  for (const row of rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        payload,
        { TTL: 120 }
      );
      sent += 1;
    } catch (e) {
      console.error("[push] test send failed", e);
    }
  }

  return NextResponse.json(
    { ok: true, sent },
    { headers: { "Cache-Control": "no-store" } }
  );
}
