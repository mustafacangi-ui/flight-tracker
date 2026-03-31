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
  console.log("[saved-flights] GET request started");
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    console.error("[saved-flights] Server misconfigured - no Supabase client");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.warn("[saved-flights] Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[saved-flights] Fetching flights for user", { userId: user.id });
  const { data, error } = await supabase
    .from("saved_flights")
    .select("*")
    .eq("user_id", user.id)
    .order("departure_time", { ascending: true });

  if (error) {
    console.error("[saved-flights] Database fetch failed", { 
      userId: user.id, 
      error: error.message,
      code: error.code,
      details: error.details 
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as SavedFlightDbRow[];
  console.log("[saved-flights] Successfully fetched flights", { 
    userId: user.id, 
    count: rows.length 
  });
  const flights = rows.map(savedFlightFromDbRow);
  return NextResponse.json({ flights });
}

export async function POST(request: Request) {
  console.log("[saved-flights] POST request started");
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    console.error("[saved-flights] Server misconfigured - no Supabase client");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.warn("[saved-flights] Unauthorized save attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
    console.log("[saved-flights] Request body parsed", { 
      userId: user.id,
      flightNumber: body.flightNumber,
      departureAirport: body.departureAirport,
      arrivalAirport: body.arrivalAirport
    });
  } catch {
    console.error("[saved-flights] Invalid JSON in request body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodyToSavedFlightInsert(body, user.id);
  if (!parsed.ok) {
    console.error("[saved-flights] Body validation failed", { 
      userId: user.id, 
      error: parsed.error 
    });
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Check premium status and limits
  const premium = await userPlanGrantsPremiumForUserId(supabase, user.id, {
    log: true,
  });
  console.log("[saved-flights] Premium status checked", { 
    userId: user.id, 
    isPremium: premium 
  });

  if (!premium) {
    console.log("[saved-flights] Checking free tier limits for user", { userId: user.id });
    const { count, error: cErr } = await supabase
      .from("saved_flights")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (cErr) {
      console.error("[saved-flights] Count query failed", { 
        userId: user.id, 
        error: cErr.message 
      });
      return NextResponse.json({ error: cErr.message }, { status: 500 });
    }
    const currentCount = count ?? 0;
    console.log("[saved-flights] Current saved flights count", { 
      userId: user.id, 
      count: currentCount,
      limit: FREE_TIER.maxSavedFlights 
    });
    
    if (currentCount >= FREE_TIER.maxSavedFlights) {
      console.log("[saved-flights] Free limit reached", {
        userId: user.id,
        currentCount,
        limit: FREE_TIER.maxSavedFlights,
      });
      return NextResponse.json(
        { error: "Free tier limit reached", code: "FREE_LIMIT" },
        { status: 403 }
      );
    }
  }

  console.log("[saved-flights] Attempting to insert flight", { 
    userId: user.id,
    flightNumber: parsed.insert.flight_number,
    departureTime: parsed.insert.departure_time
  });

  const { data, error } = await supabase
    .from("saved_flights")
    .insert(parsed.insert)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      console.log("[saved-flights] Duplicate flight prevented by unique constraint", { 
        userId: user.id,
        flightNumber: parsed.insert.flight_number,
        departureTime: parsed.insert.departure_time
      });
      return NextResponse.json(
        { error: "This flight is already saved", code: "DUPLICATE" },
        { status: 409 }
      );
    }
    console.error("[saved-flights] Insert operation failed", {
      userId: user.id,
      flightNumber: parsed.insert.flight_number,
      error: error.message,
      code: error.code,
      details: error.details,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[saved-flights] Flight saved successfully", { 
    userId: user.id,
    flightId: data.id,
    flightNumber: data.flight_number 
  });
  const flight = savedFlightFromDbRow(data as SavedFlightDbRow);
  return NextResponse.json({ flight });
}

export async function DELETE(request: Request) {
  console.log("[saved-flights] DELETE request started");
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    console.error("[saved-flights] Server misconfigured - no Supabase client");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.warn("[saved-flights] Unauthorized delete attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    console.error("[saved-flights] Delete request missing flight ID", { userId: user.id });
    return NextResponse.json({ error: "Flight ID required" }, { status: 400 });
  }

  console.log("[saved-flights] Attempting to delete flight", { 
    userId: user.id, 
    flightId: id 
  });

  const { error, count } = await supabase
    .from("saved_flights")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[saved-flights] Delete operation failed", {
      userId: user.id,
      flightId: id,
      error: error.message,
      code: error.code,
      details: error.details,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if ((count ?? 0) === 0) {
    console.warn("[saved-flights] No flight found to delete", { 
      userId: user.id, 
      flightId: id 
    });
    return NextResponse.json({ error: "Flight not found" }, { status: 404 });
  }

  console.log("[saved-flights] Flight deleted successfully", { 
    userId: user.id, 
    flightId: id,
    deletedCount: count 
  });
  return NextResponse.json({ ok: true });
}
