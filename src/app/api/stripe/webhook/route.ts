import { NextResponse } from "next/server";
import Stripe from "stripe";

import { subscriptionIdFromInvoice } from "../../../../lib/stripe/invoiceSubscriptionId";
import { syncStripeSubscriptionToUser } from "../../../../lib/stripe/syncStripeSubscriptionToUser";
import {
  getStripeSecretKey,
  getStripeWebhookSecret,
} from "../../../../lib/stripeEnv";
import { createServiceSupabaseClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const whSecret = getStripeWebhookSecret();
  const apiKey = getStripeSecretKey();
  if (!whSecret || !apiKey) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = new Stripe(apiKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, whSecret);
  } catch (err) {
    console.error("[stripe webhook] signature verify failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createServiceSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase service role not configured" },
      { status: 503 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const userId =
          session.metadata?.supabase_user_id?.trim() ||
          session.client_reference_id?.trim();
        const subRaw = session.subscription;
        const subId =
          typeof subRaw === "string" ? subRaw : subRaw && "id" in subRaw ? subRaw.id : null;
        if (!userId || !subId) {
          console.warn("[stripe webhook] checkout.session.completed missing user or subscription");
          break;
        }
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncStripeSubscriptionToUser(admin, sub, {
          fallbackUserId: userId,
          userEmail:
            session.customer_details?.email ??
            session.customer_email ??
            session.metadata?.user_email,
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncStripeSubscriptionToUser(admin, sub);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = subscriptionIdFromInvoice(invoice);
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncStripeSubscriptionToUser(admin, sub);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error", event.type, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
