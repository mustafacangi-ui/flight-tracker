"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { setPremiumEntitlementReader } from "../lib/premiumEntitlementRegistry";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "../lib/supabase/client";
import type { PremiumResolveLog } from "../lib/subscription/userPlanPremium";
import { fetchPremiumEntitlementForSession } from "../lib/subscription/userPlanPremium";
import {
  PREMIUM_TIER_UPDATED_EVENT,
  STORAGE_TIER_KEY,
} from "../lib/premiumTier";

export type PremiumEntitlementContextValue = {
  /** True only after at least one entitlement fetch finished (or env missing). */
  hasResolved: boolean;
  isPremium: boolean;
  lastResolution: PremiumResolveLog | null;
  refreshPremium: () => Promise<void>;
};

export const PremiumEntitlementContext =
  createContext<PremiumEntitlementContextValue | null>(null);

export default function PremiumEntitlementProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hasResolved, setHasResolved] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [lastResolution, setLastResolution] =
    useState<PremiumResolveLog | null>(null);
  const isPremiumRef = useRef(isPremium);
  const clearedLegacyTier = useRef(false);

  isPremiumRef.current = isPremium;

  const refreshPremium = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      const snap: PremiumResolveLog = {
        userId: null,
        subscriptionRow: null,
        premium: false,
      };
      setIsPremium(false);
      setLastResolution(snap);
      setHasResolved(true);
      return;
    }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      const snap: PremiumResolveLog = {
        userId: null,
        subscriptionRow: null,
        premium: false,
      };
      setIsPremium(false);
      setLastResolution(snap);
      setHasResolved(true);
      return;
    }
    const resolved = await fetchPremiumEntitlementForSession(supabase, {
      log: true,
    });
    setIsPremium(resolved.premium);
    setLastResolution(resolved);
    setHasResolved(true);
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

  useLayoutEffect(() => {
    setPremiumEntitlementReader(() => isPremiumRef.current);
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
    () => ({
      hasResolved,
      isPremium,
      lastResolution,
      refreshPremium,
    }),
    [hasResolved, isPremium, lastResolution, refreshPremium]
  );

  return (
    <PremiumEntitlementContext.Provider value={value}>
      {children}
    </PremiumEntitlementContext.Provider>
  );
}
