import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type SubBody = {
  subscription?: {
    endpoint: string;
    keys?: { p256dh?: string; auth?: string };
  };
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(request: NextRequest) {
  const res = NextResponse.json({ ok: true });
  const supabase = createSupabaseRouteHandlerClient(request, res);
  if (!supabase) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SubBody;
  try {
    body = (await request.json()) as SubBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sub = body.subscription ?? body;
  const endpoint = sub.endpoint?.trim();
  const p256dh = sub.keys?.p256dh?.trim();
  const authKey = sub.keys?.auth?.trim();
  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json(
      { error: "Missing subscription endpoint or keys" },
      { status: 400 }
    );
  }

  const ua = request.headers.get("user-agent") ?? null;

  const { error: delErr } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
  if (delErr) {
    console.error("[push] subscribe delete", delErr.message);
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  const { error: insErr } = await supabase.from("push_subscriptions").insert({
    user_id: user.id,
    endpoint,
    p256dh,
    auth: authKey,
    user_agent: ua,
  });
  if (insErr) {
    console.error("[push] subscribe insert", insErr.message);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  res.headers.set("Cache-Control", "no-store");
  return res;
}
