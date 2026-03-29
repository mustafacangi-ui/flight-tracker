"use client";

import { motion } from "framer-motion";

type Props = {
  onUnlock: () => void;
};

export default function PremiumLiveMapTeaser({ onUnlock }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className="relative overflow-hidden rounded-3xl border border-blue-500/25 bg-white/[0.03] p-6 shadow-[0_12px_48px_rgba(0,0,0,0.4)] ring-1 ring-blue-500/10 backdrop-blur-md"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37,99,235,0.2), transparent)",
        }}
      />
      <div className="relative text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-400/85">
          Premium
        </p>
        <h2 className="mt-2 text-lg font-bold text-white sm:text-xl">
          Live flight map
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          Animated journey view with progress is included with RouteWings
          Premium.
        </p>
        <button
          type="button"
          onClick={onUnlock}
          className="mt-5 inline-flex items-center justify-center rounded-2xl border border-blue-500/40 bg-gradient-to-r from-blue-600/90 to-sky-600/90 px-6 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(37,99,235,0.35)] transition hover:brightness-110"
        >
          Unlock Premium
        </button>
      </div>
    </motion.section>
  );
}
