"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useId, useState } from "react";

import { getStripePriceIds } from "../lib/stripeEnv";
import { PREMIUM_MODAL_FEATURES } from "../lib/premiumTier";
import { grantClientPremiumTier } from "../lib/premiumSyncClient";

export type PremiumBillingPlan = "monthly" | "yearly";

type Props = {
  open: boolean;
  onClose: () => void;
};

const MONTHLY_DISPLAY = "$6.99";
const YEARLY_DISPLAY = "$59";

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M5 16L3 7l5.5.5L12 4l3.5 3.5L21 7l-2 9H5zm2.7-2h8.6l1.1-5h-4.2l-2.3-2.3L12 9l-2.3-2.3L7.6 9H3.4l1.1 5z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <circle
        cx="10"
        cy="10"
        r="9"
        className="stroke-sky-400/40"
        strokeWidth="1"
      />
      <path
        className="stroke-sky-300"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 10.5 8.8 13.2 14 7.5"
      />
    </svg>
  );
}

export default function PremiumUpgradeModal({ open, onClose }: Props) {
  const [plan, setPlan] = useState<PremiumBillingPlan>("yearly");
  const [busy, setBusy] = useState(false);
  const titleId = useId();
  const descId = useId();
  const priceIds = getStripePriceIds();

  const handleSubscribe = useCallback(async () => {
    setBusy(true);
    try {
      await grantClientPremiumTier();
      try {
        localStorage.setItem(
          "flightApp_premiumPlanPreference",
          plan
        );
      } catch {
        /* ignore */
      }
      onClose();
    } finally {
      setBusy(false);
    }
  }, [onClose, plan]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close upgrade"
            className="fixed inset-0 z-[200] bg-[#030508]/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="fixed left-1/2 top-1/2 z-[201] flex max-h-[min(92dvh,840px)] w-[min(100vw-1.5rem,28rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.75rem] border border-blue-500/30 bg-slate-950/95 shadow-[0_0_60px_rgba(37,99,235,0.2),0_32px_100px_rgba(0,0,0,0.65)] ring-1 ring-blue-400/15 backdrop-blur-xl sm:w-[min(100vw-2rem,26rem)]"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.25),transparent),radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(14,165,233,0.12),transparent)]"
              aria-hidden
            />
            <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-sky-500/15 blur-3xl" />

            <div className="relative flex max-h-full flex-col overflow-y-auto overscroll-contain px-5 pb-6 pt-7 sm:px-7 sm:pb-8 sm:pt-8">
              <div className="mb-5 flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/35 bg-gradient-to-r from-blue-600/20 via-sky-500/15 to-indigo-600/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-100/95 shadow-[0_0_24px_rgba(56,189,248,0.15)]">
                  <CrownIcon className="h-4 w-4 text-amber-300" />
                  Premium
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-full p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>

              <h2
                id={titleId}
                className="text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]"
              >
                <span className="bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
                  RouteWings Premium
                </span>
              </h2>
              <p
                id={descId}
                className="mt-2 text-sm leading-relaxed text-slate-400"
              >
                Full airport intelligence, private family links, and unlimited
                saves — built for frequent flyers.
              </p>

              <ul className="mt-6 grid gap-2.5">
                {PREMIUM_MODAL_FEATURES.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 ring-1 ring-blue-500/5"
                  >
                    <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
                    <span className="text-sm leading-snug text-slate-200">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Choose billing
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPlan("monthly")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    plan === "monthly"
                      ? "border-blue-500/50 bg-blue-500/[0.12] shadow-[0_0_28px_rgba(37,99,235,0.2)] ring-1 ring-blue-400/25"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <p className="text-xs font-medium text-slate-500">Monthly</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                    {MONTHLY_DISPLAY}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">per month</p>
                </button>

                <div
                  className={`relative rounded-2xl p-[1px] transition ${
                    plan === "yearly"
                      ? "bg-gradient-to-br from-sky-400/70 via-blue-500/60 to-indigo-600/70 shadow-[0_0_32px_rgba(59,130,246,0.35)]"
                      : "bg-white/15"
                  }`}
                >
                  <div className="pointer-events-none absolute -top-2.5 left-2 right-2 flex justify-center sm:left-3 sm:right-3">
                    <span className="rounded-full bg-sky-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-950 shadow-sm">
                      Best value
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPlan("yearly")}
                    className={`relative h-full w-full rounded-[0.95rem] p-4 pt-5 text-left ${
                      plan === "yearly"
                        ? "bg-slate-950/95"
                        : "bg-slate-950/80 hover:bg-slate-950/90"
                    }`}
                  >
                    <p className="text-xs font-medium text-slate-500">Annual</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                      {YEARLY_DISPLAY}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">per year</p>
                  </button>
                </div>
              </div>

              {priceIds.monthly || priceIds.yearly ? (
                <p className="mt-3 text-[10px] leading-relaxed text-slate-600">
                  Stripe price IDs detected — Checkout integration can use{" "}
                  <code className="rounded bg-white/5 px-1 text-slate-400">
                    NEXT_PUBLIC_STRIPE_PRICE_{plan === "monthly" ? "MONTHLY" : "YEARLY"}
                  </code>
                  .
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleSubscribe()}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-[0_12px_40px_rgba(37,99,235,0.4)] transition hover:brightness-110 disabled:opacity-50 active:scale-[0.99]"
                >
                  {busy ? "Unlocking…" : "Unlock Premium"}
                </button>
                <Link
                  href="/premium"
                  onClick={onClose}
                  className="w-full rounded-2xl border border-white/12 bg-white/[0.04] py-3 text-center text-sm font-medium text-slate-300 transition hover:border-blue-400/30 hover:bg-white/[0.07]"
                >
                  View full comparison
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-sm text-slate-500 transition hover:text-slate-300"
                >
                  Maybe later
                </button>
              </div>

              <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-600">
                Phase 1 preview: unlocks Premium in-app and syncs to your
                account when signed in. Stripe Checkout wires up with the price
                IDs in your environment.
              </p>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
