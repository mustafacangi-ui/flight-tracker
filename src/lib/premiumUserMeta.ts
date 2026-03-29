import type { User } from "@supabase/supabase-js";

/** Synced via Stripe webhook or client upgrade flow (`updateUser` metadata). */
export function userHasPremiumSubscription(
  user: Pick<User, "user_metadata"> | null | undefined
): boolean {
  const m = user?.user_metadata;
  if (!m || typeof m !== "object") return false;
  if (m.rw_premium === true) return true;
  if (m.subscription_tier === "premium" || m.subscription_tier === "pro")
    return true;
  return false;
}
