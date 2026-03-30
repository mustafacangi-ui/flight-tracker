"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import HomeTopAuthBar from "../../../components/home/HomeTopAuthBar";
import {
  dispatchPremiumTierUpdated,
  PREMIUM_MODAL_FEATURES,
} from "../../../lib/premiumTier";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "../../../lib/supabase/client";
import { fetchPremiumEntitlementForSession } from "../../../lib/subscription/userPlanPremium";
import {
  AnalyticsEvents,
  trackProductEvent,
} from "../../../lib/analytics/telemetry";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[...Array(12)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/3 h-2 w-2 rounded-full bg-sky-400/90"
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0.6],
            x: Math.cos((i / 12) * Math.PI * 2) * (60 + i * 8),
            y: Math.sin((i / 12) * Math.PI * 2) * (60 + i * 8),
          }}
          transition={{ duration: 1.1, delay: i * 0.04, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

const POLL_MS = 2000;
const MAX_POLLS = 15;

export default function PremiumSuccessPage() {
  const [synced, setSynced] = useState(false);
  const [subscriptionReady, setSubscriptionReady] = useState(false);
  const checkoutTracked = useRef(false);

  useEffect(() => {
    if (checkoutTracked.current) return;
    checkoutTracked.current = true;
    trackProductEvent(AnalyticsEvents.premium_checkout_success, {
      channel: "stripe",
    });
    trackProductEvent(AnalyticsEvents.stripe_checkout_completed, {
      channel: "stripe",
    });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSynced(true);
      return;
    }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setSynced(true);
      return;
    }
    void (async () => {
      try {
        await supabase.auth.refreshSession();
        for (let i = 0; i < MAX_POLLS; i++) {
          const { premium } = await fetchPremiumEntitlementForSession(
            supabase,
            { log: true }
          );
          if (premium) {
            setSubscriptionReady(true);
            dispatchPremiumTierUpdated();
            break;
          }
          await sleep(POLL_MS);
        }
      } catch {
        /* ignore */
      } finally {
        setSynced(true);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#04060d] text-white">
      <HomeTopAuthBar />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.55]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 50% at 50% -15%, rgba(37,99,235,0.38), transparent), radial-gradient(ellipse 50% 40% at 100% 85%, rgba(14,165,233,0.14), transparent)",
        }}
      />

      <main className="relative mx-auto max-w-lg px-4 py-[max(2rem,env(safe-area-inset-top))] pb-24 sm:px-6 sm:py-14">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-blue-500/35 bg-slate-950/70 p-8 shadow-[0_0_60px_rgba(37,99,235,0.2)] ring-1 ring-sky-500/15 backdrop-blur-xl sm:p-10">
          <ConfettiBurst />
          <motion.div
            className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-4xl shadow-[0_0_40px_rgba(52,211,153,0.25)]"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            ✓
          </motion.div>
          <motion.h1
            className="relative mt-8 text-center text-2xl font-bold tracking-tight sm:text-3xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.4 }}
          >
            <span className="bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
              Welcome aboard Premium
            </span>
          </motion.h1>
          <motion.p
            className="relative mt-3 text-center text-sm leading-relaxed text-slate-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {!synced
              ? "Syncing your account…"
              : subscriptionReady
                ? "Your subscription is active. Enjoy unlimited saves, family links, live maps, and alerts."
                : "Payment succeeded. Your Premium access will appear shortly once we finish syncing your subscription — refresh in a moment if features look locked."}
          </motion.p>

          <motion.ul
            className="relative mt-8 space-y-2.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            {PREMIUM_MODAL_FEATURES.map((line, i) => (
              <motion.li
                key={line}
                className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-slate-200 ring-1 ring-blue-500/5"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.32 + i * 0.05 }}
              >
                <span className="text-sky-400" aria-hidden>
                  ✦
                </span>
                {line}
              </motion.li>
            ))}
          </motion.ul>

          <motion.div
            className="relative mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Link
              href="/"
              className="inline-flex justify-center rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 px-8 py-3.5 text-center text-sm font-bold text-white shadow-[0_12px_40px_rgba(37,99,235,0.4)] transition hover:brightness-110"
            >
              Back to homepage
            </Link>
            <Link
              href="/"
              className="inline-flex justify-center rounded-2xl border border-blue-500/35 bg-white/[0.05] px-8 py-3.5 text-center text-sm font-semibold text-sky-100 transition hover:border-blue-400/50 hover:bg-white/[0.08]"
            >
              Try Live Track
            </Link>
          </motion.div>
          <p className="relative mt-6 text-center text-[11px] text-slate-600">
            From airport boards, open any flight and tap{" "}
            <span className="text-slate-500">Live track</span> (Premium).
          </p>
        </div>
      </main>
    </div>
  );
}
