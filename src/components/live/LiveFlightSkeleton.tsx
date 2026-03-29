"use client";

import { motion } from "framer-motion";

type Props = {
  /** Shorter map-only shimmer for embeds */
  compact?: boolean;
};

export default function LiveFlightSkeleton({ compact = false }: Props) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-blue-500/20 bg-slate-950/60 ring-1 ring-blue-500/10"
      aria-busy
      aria-label="Loading map"
    >
      <div
        className={`relative ${compact ? "h-[220px]" : "h-[min(52vh,420px)] min-h-[260px]"}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-[#050810]" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500/10 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute bottom-4 left-4 right-4 flex gap-2">
          <div className="h-2 flex-1 rounded-full bg-white/10" />
          <div className="h-2 w-20 rounded-full bg-white/10" />
        </div>
      </div>
      {!compact ? (
        <div className="space-y-3 border-t border-white/5 p-4">
          <div className="h-3 w-1/3 rounded bg-white/10" />
          <div className="h-2 w-full rounded bg-white/5" />
          <div className="h-2 w-5/6 rounded bg-white/5" />
        </div>
      ) : null}
    </div>
  );
}
