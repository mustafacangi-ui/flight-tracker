"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

import { usePremiumFlag } from "../hooks/usePremiumFlag";
import {
  AnalyticsEvents,
  trackProductEvent,
} from "../lib/analytics/telemetry";
import { captureError } from "../lib/monitoring/captureError";
import { grantClientPremiumTier } from "../lib/premiumSyncClient";
import { PREMIUM_MODAL_FEATURES } from "../lib/premiumTier";
import { createBrowserSupabaseClient } from "../lib/supabase/client";

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
      stroke="currentColor"
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
  const premium = usePremiumFlag();
  const [plan, setPlan] = useState<PremiumBillingPlan>("yearly");
  const [busy, setBusy] = useState(false);
  const [checkoutEnabled, setCheckoutEnabled] = useState<boolean | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    setCheckoutError(null);
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/stripe/config");
        const data = (await res.json()) as { checkoutEnabled?: boolean };
        if (!cancelled) setCheckoutEnabled(Boolean(data.checkoutEnabled));
      } catch {
        if (!cancelled) setCheckoutEnabled(false);
      }
      const supabase = createBrowserSupabaseClient();
      if (!supabase) {
        if (!cancelled) setSignedIn(false);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) setSignedIn(Boolean(user));
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSubscribe = useCallback(async () => {
    if (premium) return;
    setCheckoutError(null);

    if (checkoutEnabled) {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
      if (!user) {
        setCheckoutError(
          "Sign in with Google from the header to start Stripe Checkout."
        );
        setSignedIn(false);
        return;
      }

      setBusy(true);
      try {
        trackProductEvent(AnalyticsEvents.premium_checkout_started, {
          plan,
          channel: "stripe",
        });
        trackProductEvent(AnalyticsEvents.stripe_checkout_started, { plan });
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        let data: { url?: string; error?: string } = {};
        try {
          data = (await res.json()) as typeof data;
        } catch {
          /* ignore */
        }
        if (!res.ok) {
          const errText = (data.error ?? "").toLowerCase();
          const configMissing =
            res.status === 503 &&
            (data.error === "Stripe is not configured" ||
              errText.includes("not configured"));
          if (configMissing) {
            trackProductEvent(AnalyticsEvents.stripe_payment_failed, {
              phase: "config_missing",
            });
            setCheckoutError(
              "Premium checkout isn’t available right now. Please try again later."
            );
            return;
          }
          trackProductEvent(AnalyticsEvents.stripe_payment_failed, {
            phase: "checkout_start",
            has_message: Boolean(data.error),
          });
          setCheckoutError("Checkout failed. Try again.");
          return;
        }
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        trackProductEvent(AnalyticsEvents.stripe_payment_failed, {
          phase: "checkout_start",
          has_message: true,
        });
        setCheckoutError("Checkout failed. Try again.");
      } catch (e) {
        captureError(e, {
          area: "stripe_checkout_client",
          tags: { plan },
          extras: { summary: "checkout start failed" },
        });
        trackProductEvent(AnalyticsEvents.stripe_payment_failed, {
          phase: "checkout_start",
          has_message: true,
        });
        setCheckoutError("Checkout failed. Try again.");
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      trackProductEvent(AnalyticsEvents.premium_checkout_started, {
        plan,
        channel: "qa_local",
      });
      await grantClientPremiumTier();
      trackProductEvent(AnalyticsEvents.premium_checkout_success, {
        plan,
        channel: "qa_local",
      });
      try {
        localStorage.setItem("flightApp_premiumPlanPreference", plan);
      } catch {
        /* ignore */
      }
      onClose();
    } finally {
      setBusy(false);
    }
  }, [checkoutEnabled, onClose, plan, premium]);

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
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/35 bg-gradient-to-r from-blue-600/20 via-sky-500/15 to-indigo-600/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-100/95 shadow-[0_0_24px_rgba(56,189,248,0.15)]">
                    <CrownIcon className="h-4 w-4 text-amber-300" />
                    Premium
                  </span>
                  {checkoutEnabled === false ? (
                    <>
                      <span className="rounded-full border border-violet-500/35 bg-violet-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-violet-200/90">
                        QA
                      </span>
                      <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-amber-200/90">
                        Stripe not configured
                      </span>
                    </>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-full p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>

              {premium ? (
                <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100/95 ring-1 ring-emerald-500/15">
                  You already have Premium — enjoy unlimited saves, family links,
                  and live tracking.
                </div>
              ) : null}

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

              {checkoutEnabled === false ? (
                <p className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-amber-100/90">
                  Premium checkout is not configured yet. Add Stripe env variables
                  to enable subscriptions.
                </p>
              ) : null}

              <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Choose billing
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={premium}
                  onClick={() => setPlan("monthly")}
                  className={`rounded-2xl border p-4 text-left transition disabled:opacity-45 ${
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
                    disabled={premium}
                    onClick={() => setPlan("yearly")}
                    className={`relative h-full w-full rounded-[0.95rem] p-4 pt-5 text-left disabled:opacity-45 ${
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

              {checkoutEnabled && signedIn === false ? (
                <p className="mt-3 text-xs leading-relaxed text-amber-200/85">
                  Sign in from the header to continue with secure Checkout.
                </p>
              ) : null}

              {checkoutError ? (
                <p className="mt-3 text-xs text-red-300/95" role="alert">
                  {checkoutError}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  disabled={
                    busy ||
                    premium ||
                    (checkoutEnabled === true && signedIn !== true)
                  }
                  onClick={() => void handleSubscribe()}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-[0_12px_40px_rgba(37,99,235,0.4)] transition hover:brightness-110 disabled:opacity-45 active:scale-[0.99]"
                >
                  {premium
                    ? "You already have Premium"
                    : busy
                      ? checkoutEnabled
                        ? "Redirecting to Checkout…"
                        : "Unlocking…"
                      : checkoutEnabled
                        ? "Continue to Checkout"
                        : "Unlock Premium (QA)"}
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
                {checkoutEnabled
                  ? "Secure payment via Stripe. Subscription renews until you cancel in the customer portal."
                  : "QA: the button below unlocks Premium locally for testing and syncs account metadata when you’re signed in."}
              </p>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
