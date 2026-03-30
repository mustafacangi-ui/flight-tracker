"use client";

import { useContext } from "react";

import { PremiumEntitlementContext } from "../components/PremiumEntitlementProvider";

/**
 * Premium when `user_plans` has an active/trialing Stripe subscription for the signed-in user.
 * False until the first entitlement resolution completes (never assume premium while loading).
 */
export function usePremiumFlag(): boolean {
  const ctx = useContext(PremiumEntitlementContext);
  if (!ctx?.hasResolved) return false;
  return ctx.isPremium;
}
