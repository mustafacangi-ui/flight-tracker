import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceSupabaseClient } from "../supabase/admin";

export type PlanType = "free" | "premium";

export type SyncPremiumMetadataInput = {
  userId: string;
  userEmail?: string | null;
  planType: PlanType;
  /** Raw Stripe subscription status or synthetic values like `canceled` */
  subscriptionStatus: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  /** Stripe `current_period_end` unix seconds */
  subscriptionCurrentPeriodEnd?: number | null;
};

/**
 * Upserts `user_plans` and merges Supabase Auth `user_metadata` premium flags.
 * Call from Stripe webhooks with the service role client.
 */
export async function syncPremiumMetadata(
  input: SyncPremiumMetadataInput,
  client?: SupabaseClient | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = client ?? createServiceSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase service client not configured" };
  }

  const premium = input.planType === "premium";

  const { data: existing, error: getErr } =
    await supabase.auth.admin.getUserById(input.userId);
  if (getErr || !existing?.user) {
    return {
      ok: false,
      error: getErr?.message ?? "User not found for premium sync",
    };
  }

  const periodEnd =
    input.subscriptionCurrentPeriodEnd != null
      ? new Date(input.subscriptionCurrentPeriodEnd * 1000).toISOString()
      : null;

  const row = {
    user_id: input.userId,
    user_email: input.userEmail ?? existing.user.email ?? null,
    plan_type: input.planType,
    subscription_status: input.subscriptionStatus,
    stripe_customer_id: input.stripeCustomerId ?? null,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    subscription_current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertErr } = await supabase.from("user_plans").upsert(row, {
    onConflict: "user_id",
  });
  if (upsertErr) {
    return { ok: false, error: upsertErr.message };
  }

  const prevMeta =
    (existing.user.user_metadata as Record<string, unknown> | undefined) ?? {};
  const user_metadata: Record<string, unknown> = {
    ...prevMeta,
    rw_premium: premium,
    subscription_tier: premium ? "premium" : "free",
  };

  const { error: metaErr } = await supabase.auth.admin.updateUserById(
    input.userId,
    { user_metadata }
  );
  if (metaErr) {
    return { ok: false, error: metaErr.message };
  }

  return { ok: true };
}
