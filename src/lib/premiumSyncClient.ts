"use client";

import {
  dispatchPremiumTierUpdated,
  STORAGE_TIER_KEY,
} from "./premiumTier";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "./supabase/client";

/**
 * Demo / phase-1 unlock: local tier + Supabase `user_metadata` for API gates.
 */
export async function grantClientPremiumTier(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_TIER_KEY, "premium");
  } catch {
    /* ignore */
  }
  dispatchPremiumTierUpdated();

  if (!isSupabaseConfigured()) return;
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.auth.updateUser({
    data: {
      rw_premium: true,
      subscription_tier: "premium",
    },
  });
}
