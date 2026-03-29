import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import {
  syncPremiumMetadata,
  type PlanType,
} from "../subscription/syncPremiumMetadata";

function subscriptionPeriodEndUnix(sub: Stripe.Subscription): number | null {
  const end = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  return typeof end === "number" ? end : null;
}

function customerIdOf(sub: Stripe.Subscription): string | null {
  const c = sub.customer;
  if (typeof c === "string") return c;
  return c?.id ?? null;
}

export function userIdFromSubscriptionMetadata(
  sub: Stripe.Subscription
): string | null {
  const id = sub.metadata?.supabase_user_id?.trim();
  return id || null;
}

/** Whether the subscription should keep Premium entitlements. */
export function subscriptionGrantsPremium(
  status: Stripe.Subscription.Status
): boolean {
  return (
    status === "active" ||
    status === "trialing" ||
    status === "past_due" ||
    status === "paused"
  );
}

export async function lookupUserIdByStripeCustomer(
  supabase: SupabaseClient,
  customerId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_plans")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (error || !data?.user_id) return null;
  return data.user_id as string;
}

export async function syncStripeSubscriptionToUser(
  supabase: SupabaseClient,
  sub: Stripe.Subscription,
  options?: { userEmail?: string | null; fallbackUserId?: string | null }
): Promise<{ ok: true } | { ok: false; error: string }> {
  let userId =
    userIdFromSubscriptionMetadata(sub) ||
    options?.fallbackUserId?.trim() ||
    null;
  const customerId = customerIdOf(sub);

  if (!userId && customerId) {
    userId = await lookupUserIdByStripeCustomer(supabase, customerId);
  }
  if (!userId) {
    return { ok: false, error: "Could not resolve Supabase user for subscription" };
  }

  const grants = subscriptionGrantsPremium(sub.status);
  const planType: PlanType = grants ? "premium" : "free";
  const subscriptionStatus = grants ? sub.status : "canceled";

  return syncPremiumMetadata(
    {
      userId,
      userEmail: options?.userEmail,
      planType,
      subscriptionStatus,
      stripeCustomerId: customerId,
      stripeSubscriptionId: grants ? sub.id : null,
      subscriptionCurrentPeriodEnd: grants
        ? subscriptionPeriodEndUnix(sub)
        : null,
    },
    supabase
  );
}
