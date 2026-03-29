"use client";

import { motion } from "framer-motion";

/**
 * Placeholder for a future native in-app review prompt (StoreKit / Play In-App Review).
 */
export default function RateAppCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5"
      role="region"
      aria-label="Rate the app"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80">
        Review prompt (placeholder)
      </p>
      <h3 className="mt-2 text-base font-semibold text-white">
        Enjoying RouteWings?
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        When the native apps ship, we&apos;ll ask for App Store and Play Store
        ratings at the right moment. On the web, your feedback on the roadmap
        page helps us prioritize.
      </p>
      <button
        type="button"
        disabled
        className="mt-4 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-slate-500"
      >
        Rate on the store (coming soon)
      </button>
    </motion.div>
  );
}
