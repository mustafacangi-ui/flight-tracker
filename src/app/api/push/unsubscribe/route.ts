import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

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

  let endpoint: string | undefined;
  try {
    const body = (await request.json()) as { endpoint?: string };
    endpoint = body.endpoint?.trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    console.error("[push] unsubscribe", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  res.headers.set("Cache-Control", "no-store");
  return res;
}
