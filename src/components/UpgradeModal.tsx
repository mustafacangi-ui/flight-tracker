"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback } from "react";

import { STORAGE_TIER_KEY } from "../lib/premiumTier";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function UpgradeModal({ open, onClose }: Props) {
  const enableProLocal = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_TIER_KEY, "premium");
    } catch {
      /* ignore */
    }
    onClose();
    window.dispatchEvent(new Event("storage"));
    window.location.reload();
  }, [onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close upgrade dialog"
            className="fixed inset-0 z-[200] bg-black/65 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-modal-title"
            className="fixed left-1/2 top-1/2 z-[201] w-[min(92vw,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-gray-950/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            <p
              id="upgrade-modal-title"
              className="text-base font-semibold leading-snug text-white"
            >
              Unlock advanced flight tracking and family notifications.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">
              Pro includes unlimited tracked flights, richer aircraft history,
              delay and weather intelligence, and more. Billing integration
              coming soon — this preview enables Pro locally in your browser.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition hover:brightness-105"
                onClick={enableProLocal}
              >
                Upgrade to Pro
              </button>
              <button
                type="button"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-gray-200 transition hover:bg-white/[0.07]"
                onClick={onClose}
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
