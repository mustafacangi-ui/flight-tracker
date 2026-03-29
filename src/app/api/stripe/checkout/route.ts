import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  getStripeCheckoutReturnUrls,
  getStripePriceIds,
  getStripeSecretKey,
  isStripeCheckoutConfigured,
} from "../../../../lib/stripeEnv";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  plan?: "monthly" | "yearly";
};

export async function POST(request: Request) {
  if (!isStripeCheckoutConfigured()) {
    return NextResponse.json(
      { error: "Stripe Checkout is not configured" },
      { status: 503 }
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required to subscribe" },
      { status: 401 }
    );
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    /* empty body */
  }
  const plan = body.plan === "monthly" ? "monthly" : "yearly";
  const prices = getStripePriceIds();
  const priceId = plan === "monthly" ? prices.monthly : prices.yearly;

  const stripe = new Stripe(getStripeSecretKey());
  const { successUrl, cancelUrl } = getStripeCheckoutReturnUrls();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      supabase_user_id: user.id,
      user_email: user.email ?? "",
      selected_plan: plan,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        user_email: user.email ?? "",
        selected_plan: plan,
      },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Could not start checkout session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: session.url });
}
