"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { setPremiumEntitlementReader } from "../lib/premiumEntitlementRegistry";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "../lib/supabase/client";
import { fetchPremiumEntitlementForSession } from "../lib/subscription/userPlanPremium";
import {
  PREMIUM_TIER_UPDATED_EVENT,
  STORAGE_TIER_KEY,
} from "../lib/premiumTier";

type Ctx = {
  isPremium: boolean;
  refreshPremium: () => Promise<void>;
};

export const PremiumEntitlementContext = createContext<Ctx | null>(null);

export default function PremiumEntitlementProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isPremium, setIsPremium] = useState(false);
  const clearedLegacyTier = useRef(false);

  const refreshPremium = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsPremium(false);
      return;
    }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setIsPremium(false);
      return;
    }
    const { premium } = await fetchPremiumEntitlementForSession(supabase, {
      log: true,
    });
    setIsPremium(premium);
  }, []);

  useEffect(() => {
    if (!clearedLegacyTier.current && typeof window !== "undefined") {
      clearedLegacyTier.current = true;
      try {
        localStorage.removeItem(STORAGE_TIER_KEY);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    setPremiumEntitlementReader(() => isPremium);
  }, [isPremium]);

  useEffect(() => {
    void refreshPremium();
  }, [refreshPremium]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_TIER_KEY) void refreshPremium();
    };
    const onTierEvent = () => void refreshPremium();
    window.addEventListener("storage", onStorage);
    window.addEventListener(PREMIUM_TIER_UPDATED_EVENT, onTierEvent);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PREMIUM_TIER_UPDATED_EVENT, onTierEvent);
    };
  }, [refreshPremium]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshPremium();
    });
    return () => subscription.unsubscribe();
  }, [refreshPremium]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshPremium();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshPremium]);

  const value = useMemo(
    () => ({ isPremium, refreshPremium }),
    [isPremium, refreshPremium]
  );

  return (
    <PremiumEntitlementContext.Provider value={value}>
      {children}
    </PremiumEntitlementContext.Provider>
  );
}
