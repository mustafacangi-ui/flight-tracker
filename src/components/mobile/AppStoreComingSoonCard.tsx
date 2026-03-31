"use client";

import { motion } from "framer-motion";

export default function AppStoreComingSoonCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-5"
      role="region"
      aria-label="App Store and Play Store"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400/90">
        Coming soon
      </p>
      <h2 className="mt-1 text-base font-semibold text-white sm:text-lg">
        RouteWings native apps
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Download RouteWings on iPhone and Android soon. Until then, add the
        web app to your home screen for the same live tracking, family links,
        and alerts.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-400 cursor-not-allowed opacity-60"
          aria-label="App Store - Coming soon"
        >
          App Store
        </button>
        <button
          type="button"
          disabled
          className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-400 cursor-not-allowed opacity-60"
          aria-label="Google Play - Coming soon"
        >
          Google Play
        </button>
      </div>
    </motion.div>
  );
}
