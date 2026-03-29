"use client";

import { useEffect, useState } from "react";

import {
  isPremiumUser,
  PREMIUM_TIER_UPDATED_EVENT,
} from "../lib/premiumTier";

/**
 * Re-renders when premium tier changes (localStorage + custom event from auth / upgrade).
 */
export function usePremiumFlag(): boolean {
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    const sync = () => setPremium(isPremiumUser());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(PREMIUM_TIER_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PREMIUM_TIER_UPDATED_EVENT, sync);
    };
  }, []);

  return premium;
}
