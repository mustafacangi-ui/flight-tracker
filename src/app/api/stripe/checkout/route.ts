import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { captureError } from "../../../../lib/monitoring/captureError";
import { isStripeConfigured } from "../../../../lib/stripe/isStripeConfigured";
import {
  getStripeCheckoutReturnUrls,
  getStripePriceIds,
  getStripeSecretKey,
} from "../../../../lib/stripeEnv";

export const runtime = "nodejs";

type Body = {
  plan?: "monthly" | "yearly";
};

type PendingCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

function friendlyStripeMessage(err: unknown): string {
  if (err instanceof Stripe.errors.StripeError) {
    const code = err.code ?? "";
    if (code === "resource_missing" || err.message?.includes("No such price")) {
      return "Billing is misconfigured (invalid price). Check Stripe price IDs in the server environment.";
    }
    if (err.type === "StripeAuthenticationError") {
      return "Payment system authentication failed. Verify the Stripe secret key on the server.";
    }
    if (err.type === "StripeInvalidRequestError") {
      return "Could not start checkout. Please try again or contact support.";
    }
  }
  return "Could not start checkout. Please try again.";
}

export async function POST(request: NextRequest) {
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

  const secret = getStripeSecretKey();
  const prices = getStripePriceIds();
  const hasSecret = Boolean(secret);
  console.log("[stripe] checkout preflight", {
    hasSecretKey: hasSecret,
    secretKeyPrefix: hasSecret ? `${secret.slice(0, 7)}…` : null,
    monthlyPriceIdSet: Boolean(prices.monthly),
    yearlyPriceIdSet: Boolean(prices.yearly),
    monthlyPricePrefix: prices.monthly
      ? `${prices.monthly.slice(0, 12)}…`
      : null,
    yearlyPricePrefix: prices.yearly
      ? `${prices.yearly.slice(0, 12)}…`
      : null,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 }
    );
  }

  const pendingCookies: PendingCookie[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        pendingCookies.push(...cookiesToSet);
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.warn("[stripe] checkout getUser", authError.message);
  }

  if (!user) {
    const res = NextResponse.json(
      { error: "Sign in required to subscribe" },
      { status: 401 }
    );
    pendingCookies.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
    );
    return res;
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    /* empty body */
  }
  const plan = body.plan === "monthly" ? "monthly" : "yearly";
  const priceId = plan === "monthly" ? prices.monthly : prices.yearly;

  if (!priceId || !priceId.startsWith("price_")) {
    console.error("[stripe] checkout invalid or missing price id", {
      plan,
      priceIdPresent: Boolean(priceId),
      priceIdPrefix: priceId ? `${priceId.slice(0, 16)}…` : null,
    });
    const res = NextResponse.json(
      {
        error:
          "Billing is misconfigured (missing or invalid Stripe price ID for this plan).",
      },
      { status: 500 }
    );
    pendingCookies.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
    );
    return res;
  }

  const { successUrl, cancelUrl } = getStripeCheckoutReturnUrls();
  const successWithSession = `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;

  console.log("[stripe] checkout session params", {
    userId: user.id,
    plan,
    priceId: `${priceId.slice(0, 16)}…`,
    successUrl: successWithSession,
    cancelUrl,
  });

  const stripe = new Stripe(secret);

  let session: Stripe.Response<Stripe.Checkout.Session>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successWithSession,
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
    const message =
      e instanceof Error ? e.message : typeof e === "string" ? e : "unknown";
    console.error("[stripe] checkout.sessions.create failed", {
      message,
      stripeError:
        e instanceof Stripe.errors.StripeError
          ? {
              type: e.type,
              code: e.code,
              param: e.param,
              decline_code: e.decline_code,
              doc_url: e.doc_url,
            }
          : null,
    });
    captureError(e, {
      area: "stripe_checkout",
      tags: { plan },
      extras: { user_id: user.id, summary: "checkout sessions create failed" },
    });
    const res = NextResponse.json(
      { error: friendlyStripeMessage(e) },
      { status: 500 }
    );
    pendingCookies.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
    );
    return res;
  }

  if (!session.url) {
    console.error("[stripe] checkout session missing url", {
      sessionId: session.id,
    });
    const res = NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
    pendingCookies.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
    );
    return res;
  }

  console.log("[stripe] checkout session created", {
    sessionId: session.id,
    hasUrl: true,
  });

  const res = NextResponse.json({ url: session.url });
  pendingCookies.forEach(({ name, value, options }) =>
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
  );
  return res;
}
