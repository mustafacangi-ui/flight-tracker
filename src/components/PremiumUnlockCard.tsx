"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { useUpgradeModal } from "./UpgradeModalProvider";
import { PREMIUM_MODAL_FEATURES } from "../lib/premiumTier";

function JetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

export default function PremiumUnlockCard() {
  const { openUpgrade } = useUpgradeModal();

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-blue-500/35 bg-slate-950/70 p-5 shadow-[0_0_48px_rgba(37,99,235,0.18),0_20px_60px_rgba(0,0,0,0.45)] ring-1 ring-blue-400/15 backdrop-blur-xl sm:p-6"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_20%_0%,rgba(56,189,248,0.12),transparent),radial-gradient(ellipse_70%_50%_at_100%_100%,rgba(37,99,235,0.15),transparent)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-blue-500/25 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-sky-400/40 bg-gradient-to-br from-blue-600/40 via-sky-500/30 to-indigo-600/35 text-sky-100 shadow-[0_0_28px_rgba(56,189,248,0.35)]">
            <JetIcon className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-300/90">
              RouteWings Premium
            </p>
            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
              Unlock Premium
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
              {PREMIUM_MODAL_FEATURES.slice(0, 5).map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-sky-400/90" aria-hidden>
                    ✦
                  </span>
                  <span>{f}</span>
                </li>
              ))}
              <li className="pl-5 text-xs text-slate-500">
                + airport ops alerts &amp; more
              </li>
            </ul>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:w-44">
          <button
            type="button"
            onClick={() => openUpgrade({ blockedFeature: "home_premium_upsell" })}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-[0_10px_36px_rgba(37,99,235,0.45)] transition hover:brightness-110"
          >
            See plans
          </button>
          <Link
            href="/premium"
            className="w-full rounded-2xl border border-white/12 py-2.5 text-center text-xs font-semibold text-slate-300 transition hover:border-blue-400/35 hover:text-white"
          >
            Compare Free vs Premium
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
