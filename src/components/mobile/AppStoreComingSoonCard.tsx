"use client";

import { motion } from "framer-motion";

export default function AppStoreComingSoonCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
      role="region"
      aria-label="Mobile apps"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-white">iOS & Android apps coming soon</p>
        <p className="text-[10px] text-gray-500">Install the PWA version for now</p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          disabled
          className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium text-slate-400 cursor-not-allowed opacity-60"
          aria-label="App Store - Coming soon"
        >
          App Store
        </button>
        <button
          type="button"
          disabled
          className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium text-slate-400 cursor-not-allowed opacity-60"
          aria-label="Google Play - Coming soon"
        >
          Google Play
        </button>
      </div>
    </motion.div>
  );
}
