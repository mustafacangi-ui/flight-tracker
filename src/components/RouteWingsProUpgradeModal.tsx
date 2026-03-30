"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useId, useState } from "react";

export type ProBillingPlan = "monthly" | "yearly";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Override default: enable Pro locally (demo) and reload. */
  onStartTrial?: (plan: ProBillingPlan) => void;
};

const BENEFITS = [
  "Unlimited saved flights",
  "Unlimited family sharing",
  "Live notifications",
  "Multiple family members",
  "Airport delay intelligence",
  "No ads",
  "Weather risk alerts",
  "Premium themes",
] as const;

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <circle cx="10" cy="10" r="9" className="stroke-amber-400/35" strokeWidth="1" />
      <path
        className="stroke-amber-300"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 10.5 8.8 13.2 14 7.5"
      />
    </svg>
  );
}

function ProCrownBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-blue-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-100/95 shadow-sm shadow-amber-900/20">
      <svg
        className="h-3.5 w-3.5 text-amber-400"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M5 16L3 7l5.5.5L12 4l3.5 3.5L21 7l-2 9H5zm2.7-2h8.6l1.1-5h-4.2l-2.3-2.3L12 9l-2.3-2.3L7.6 9H3.4l1.1 5z" />
      </svg>
      Pro
    </span>
  );
}

export default function RouteWingsProUpgradeModal({
  open,
  onClose,
  onStartTrial,
}: Props) {
  const [plan, setPlan] = useState<ProBillingPlan>("yearly");
  const titleId = useId();
  const descId = useId();

  const handleStartTrial = useCallback(() => {
    if (onStartTrial) {
      onStartTrial(plan);
      onClose();
      return;
    }
    try {
      localStorage.setItem("flightApp_proPlanPreference", plan);
    } catch {
      /* ignore */
    }
    onClose();
  }, [onClose, onStartTrial, plan]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close upgrade"
            className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md"
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
            className="fixed left-1/2 top-1/2 z-[201] flex max-h-[min(92dvh,820px)] w-[min(100vw-1.5rem,28rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-950 shadow-[0_32px_100px_rgba(0,0,0,0.65)] sm:w-[min(100vw-2rem,26rem)]"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-600/[0.07] via-transparent to-amber-500/[0.06]" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative flex max-h-full flex-col overflow-y-auto overscroll-contain px-5 pb-6 pt-7 sm:px-7 sm:pb-8 sm:pt-8">
              <div className="mb-5 flex items-start justify-between gap-3">
                <ProCrownBadge />
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
                className="text-2xl font-bold tracking-tight text-white sm:text-[1.65rem] sm:leading-tight"
              >
                <span className="bg-gradient-to-r from-slate-100 via-white to-blue-100/90 bg-clip-text text-transparent">
                  Upgrade to RouteWings Pro
                </span>
              </h2>
              <p
                id={descId}
                className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-[0.9375rem]"
              >
                Unlock live alerts, unlimited family sharing and premium flight
                tools
              </p>

              <ul className="mt-6 grid gap-2.5 sm:grid-cols-1">
                {BENEFITS.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 px-3 py-2.5 sm:px-3.5"
                  >
                    <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
                    <span className="text-sm leading-snug text-slate-200">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Choose your plan
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPlan("monthly")}
                  className={`relative rounded-2xl border p-4 text-left transition ${
                    plan === "monthly"
                      ? "border-blue-500/50 bg-blue-500/[0.08] ring-1 ring-blue-500/30"
                      : "border-slate-700/90 bg-slate-900/50 hover:border-slate-600"
                  }`}
                >
                  <p className="text-xs font-medium text-slate-500">
                    Monthly plan
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                    €2.99
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">per month</p>
                </button>

                <div
                  className={`relative rounded-2xl p-[1px] transition ${
                    plan === "yearly"
                      ? "bg-gradient-to-br from-amber-400/70 via-blue-500/50 to-blue-600/70 shadow-lg shadow-blue-950/40"
                      : "bg-slate-700/80"
                  }`}
                >
                  <div className="absolute -top-2.5 left-3 right-3 flex flex-wrap items-center justify-center gap-1.5 sm:left-2 sm:right-2">
                    <span className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-950 shadow-sm">
                      Save 30%
                    </span>
                    <span className="rounded-full border border-blue-400/40 bg-blue-950/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-200">
                      Best value
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPlan("yearly")}
                    className={`relative h-full w-full rounded-[0.9rem] p-4 pt-5 text-left ${
                      plan === "yearly"
                        ? "bg-slate-950/95"
                        : "bg-slate-900/90 hover:bg-slate-900"
                    }`}
                  >
                    <p className="text-xs font-medium text-slate-500">
                      Yearly plan
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                      €24.99
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">per year</p>
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                {onStartTrial ? (
                  <button
                    type="button"
                    onClick={handleStartTrial}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/35 transition hover:brightness-110 active:scale-[0.99]"
                  >
                    Start Pro Trial
                  </button>
                ) : (
                  <Link
                    href="/premium"
                    onClick={onClose}
                    className="flex w-full justify-center rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-950/35 transition hover:brightness-110 active:scale-[0.99]"
                  >
                    Subscribe on Premium page
                  </Link>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-2xl border border-slate-600/80 bg-slate-900/60 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/80"
                >
                  Maybe Later
                </button>
              </div>
              <p className="mt-4 text-center text-xs text-slate-500">
                Cancel anytime
              </p>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-600">
                Subscriptions are activated through Stripe Checkout after you sign
                in.
              </p>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
