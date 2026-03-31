import { NextResponse } from "next/server";

import { FREE_TIER } from "../../../lib/premiumTier";
import {
  bodyToSavedFlightInsert,
  savedFlightFromDbRow,
  type SavedFlightDbRow,
} from "../../../lib/savedFlightsCloud";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { userPlanGrantsPremiumForUserId } from "../../../lib/subscription/userPlanPremium";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_flights")
    .select("*")
    .eq("user_id", user.id)
    .order("departure_time", { ascending: true });

  if (error) {
    console.warn("[saved-flights] fetch failed", { userId: user.id, message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as SavedFlightDbRow[];
  const flights = rows.map(savedFlightFromDbRow);
  return NextResponse.json({ flights });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodyToSavedFlightInsert(body, user.id);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const premium = await userPlanGrantsPremiumForUserId(supabase, user.id, {
    log: false,
  });
  if (!premium) {
    const { count, error: cErr } = await supabase
      .from("saved_flights")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (cErr) {
      console.warn("[saved-flights] count failed", cErr.message);
      return NextResponse.json({ error: cErr.message }, { status: 500 });
    }
    if ((count ?? 0) >= FREE_TIER.maxSavedFlights) {
      console.log("[saved-flights] free limit reached", {
        userId: user.id,
        count: count ?? 0,
      });
      return NextResponse.json(
        { error: "limit", code: "FREE_LIMIT" },
        { status: 403 }
      );
    }
  }

  const { data, error } = await supabase
    .from("saved_flights")
    .insert(parsed.insert)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      console.log("[saved-flights] duplicate prevented", { userId: user.id });
      return NextResponse.json(
        { error: "duplicate", code: "DUPLICATE" },
        { status: 409 }
      );
    }
    console.warn("[saved-flights] insert failed", {
      userId: user.id,
      message: error.message,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[saved-flights] insert success", { userId: user.id });
  const flight = savedFlightFromDbRow(data as SavedFlightDbRow);
  return NextResponse.json({ flight });
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("saved_flights")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.warn("[saved-flights] delete failed", {
      userId: user.id,
      message: error.message,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[saved-flights] delete success", { userId: user.id, id });
  return NextResponse.json({ ok: true });
}
