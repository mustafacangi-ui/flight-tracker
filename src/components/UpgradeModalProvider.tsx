"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { trackEvent } from "../lib/localAnalytics";
import UpgradeModal from "./UpgradeModal";

type Ctx = {
  openUpgrade: () => void;
  closeUpgrade: () => void;
  upgradeOpen: boolean;
};

const UpgradeModalContext = createContext<Ctx | null>(null);

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const openUpgrade = useCallback(() => {
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
      <UpgradeModal open={upgradeOpen} onClose={closeUpgrade} />
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
