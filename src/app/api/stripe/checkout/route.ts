import { NextResponse } from "next/server";
import Stripe from "stripe";

import { captureError } from "../../../../lib/monitoring/captureError";
import { isStripeConfigured } from "../../../../lib/stripe/isStripeConfigured";
import {
  getStripeCheckoutReturnUrls,
  getStripePriceIds,
  getStripeSecretKey,
} from "../../../../lib/stripeEnv";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  plan?: "monthly" | "yearly";
};

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    captureError(new Error("Stripe checkout requested but not configured"), {
      area: "stripe_checkout",
      tags: { phase: "config_missing" },
      extras: { summary: "missing STRIPE_SECRET_KEY or price env vars" },
      level: "warning",
    });
    return NextResponse.json(
      { error: "Stripe is not configured" },
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

  let session: Stripe.Response<Stripe.Checkout.Session>;
  try {
    session = await stripe.checkout.sessions.create({
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
  } catch (e) {
    captureError(e, {
      area: "stripe_checkout",
      tags: { plan },
      extras: { user_id: user.id },
    });
    return NextResponse.json(
      { error: "Could not start checkout session" },
      { status: 500 }
    );
  }

  if (!session.url) {
    return NextResponse.json(
      { error: "Could not start checkout session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: session.url });
}
