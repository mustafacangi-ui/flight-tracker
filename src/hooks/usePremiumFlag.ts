"use client";

import { useContext } from "react";

import { PremiumEntitlementContext } from "../components/PremiumEntitlementProvider";

/**
 * Premium when `user_plans` has an active/trialing Stripe subscription for the signed-in user.
 */
export function usePremiumFlag(): boolean {
  const ctx = useContext(PremiumEntitlementContext);
  return ctx?.isPremium ?? false;
}
