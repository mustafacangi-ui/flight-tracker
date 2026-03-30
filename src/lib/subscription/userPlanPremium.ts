import type { SupabaseClient } from "@supabase/supabase-js";

/** Row shape from `user_plans` (client or server, RLS-scoped). */
export type UserPlanRow = {
  user_id: string;
  plan_type: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

const SELECT_FIELDS =
  "user_id, plan_type, subscription_status, stripe_customer_id, stripe_subscription_id";

/**
 * Premium only when Supabase has a linked Stripe subscription in good standing.
 * Does not use Auth user_metadata (not trustworthy on the client).
 */
export function userPlanRowGrantsPremium(
  row: UserPlanRow | null | undefined
): boolean {
  if (!row) return false;
  const status = (row.subscription_status ?? "").toLowerCase().trim();
  if (status !== "active" && status !== "trialing") return false;
  const plan = (row.plan_type ?? "").toLowerCase().trim();
  if (plan !== "premium") return false;
  if (!row.stripe_customer_id?.trim() || !row.stripe_subscription_id?.trim()) {
    return false;
  }
  return true;
}

export type PremiumResolveLog = {
  userId: string | null;
  subscriptionRow: UserPlanRow | null;
  premium: boolean;
};

/**
 * Resolve premium from `user_plans` for the current session. Logs for debugging.
 */
export async function fetchPremiumEntitlementForSession(
  supabase: SupabaseClient,
  options?: { log?: boolean }
): Promise<PremiumResolveLog> {
  const log = options?.log ?? true;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const payload = {
      userId: null,
      subscriptionRow: null,
      premium: false,
    };
    if (log) console.log("[premium] resolve", payload);
    return payload;
  }

  const { data: row, error } = await supabase
    .from("user_plans")
    .select(SELECT_FIELDS)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (log) {
      console.warn("[premium] user_plans query failed", {
        userId: user.id,
        message: error.message,
      });
    }
    const payload = {
      userId: user.id,
      subscriptionRow: null,
      premium: false,
    };
    if (log) console.log("[premium] resolve", payload);
    return payload;
  }

  const planRow = row as UserPlanRow | null;
  const premium = userPlanRowGrantsPremium(planRow);
  const payload = {
    userId: user.id,
    subscriptionRow: planRow,
    premium,
  };
  if (log) console.log("[premium] resolve", payload);
  return payload;
}

/** Server (or RLS) lookup by user id — use after `getUser()` in API routes. */
export async function userPlanGrantsPremiumForUserId(
  supabase: SupabaseClient,
  userId: string,
  options?: { log?: boolean }
): Promise<boolean> {
  const log = options?.log ?? true;
  const { data: row, error } = await supabase
    .from("user_plans")
    .select(SELECT_FIELDS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (log) {
      console.warn("[premium] user_plans query failed", {
        userId,
        message: error.message,
      });
    }
    return false;
  }

  const planRow = row as UserPlanRow | null;
  const premium = userPlanRowGrantsPremium(planRow);
  if (log) {
    console.log("[premium] resolve", {
      userId,
      subscriptionRow: planRow,
      premium,
    });
  }
  return premium;
}
