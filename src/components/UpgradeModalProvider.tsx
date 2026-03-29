"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AnalyticsEvents,
  trackProductEvent,
} from "../lib/analytics/telemetry";
import { trackEvent } from "../lib/localAnalytics";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

export type OpenUpgradeOptions = {
  /** When the modal opens due to a paywalled feature. */
  blockedFeature?: string;
};

type Ctx = {
  openUpgrade: (opts?: OpenUpgradeOptions) => void;
  closeUpgrade: () => void;
  upgradeOpen: boolean;
};

const UpgradeModalContext = createContext<Ctx | null>(null);

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const openUpgrade = useCallback((opts?: OpenUpgradeOptions) => {
    trackProductEvent(AnalyticsEvents.premium_modal_opened, {
      blocked_feature: opts?.blockedFeature ?? null,
    });
    if (opts?.blockedFeature) {
      trackProductEvent(AnalyticsEvents.premium_feature_blocked, {
        feature: opts.blockedFeature,
      });
    }
    trackEvent("upgrade_modal_open");
    setUpgradeOpen(true);
  }, []);

  const closeUpgrade = useCallback(() => setUpgradeOpen(false), []);

  const value = useMemo(
    () => ({ openUpgrade, closeUpgrade, upgradeOpen }),
    [openUpgrade, closeUpgrade, upgradeOpen]
  );

  return (
    <UpgradeModalContext.Provider value={value}>
      {children}
      <PremiumUpgradeModal open={upgradeOpen} onClose={closeUpgrade} />
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal(): Ctx {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx) {
    throw new Error("useUpgradeModal must be used within UpgradeModalProvider");
  }
  return ctx;
}
