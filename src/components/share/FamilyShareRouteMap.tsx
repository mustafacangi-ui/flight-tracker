"use client";

import { motion } from "framer-motion";

type Props = {
  departureCity: string;
  arrivalCity: string;
  progressPercent: number;
  familyMode?: boolean;
};

export default function FamilyShareRouteMap({
  departureCity,
  arrivalCity,
  progressPercent,
  familyMode = false,
}: Props) {
  const pct = Math.min(100, Math.max(0, progressPercent));

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-indigo-950/85 via-slate-950/95 to-gray-950 shadow-[0_12px_48px_rgba(0,0,0,0.45)] ${
        familyMode ? "p-8" : "p-6"
      }`}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[12%] top-10 h-14 w-40 rounded-full bg-white/[0.06] blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[18%] top-16 h-12 w-28 rounded-full bg-white/[0.04] blur-xl"
        aria-hidden
      />

      <p className="relative text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-white/40">
        Live route view
      </p>

      <div className="relative mt-6 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 text-left">
          <p
            className={`truncate font-semibold text-white ${
              familyMode ? "text-lg sm:text-xl" : "text-base sm:text-lg"
            }`}
          >
            {departureCity || "Departure"}
          </p>
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p
            className={`truncate font-semibold text-white ${
              familyMode ? "text-lg sm:text-xl" : "text-base sm:text-lg"
            }`}
          >
            {arrivalCity || "Arrival"}
          </p>
        </div>
      </div>

      <div className="relative mx-auto mt-8 h-24 w-full max-w-md px-2">
        <div className="absolute left-4 right-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/[0.08]" />
        <svg
          className="absolute left-4 right-4 top-1/2 h-8 w-[calc(100%-2rem)] -translate-y-1/2 overflow-visible"
          viewBox="0 0 400 32"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M 0 24 Q 200 -8 400 24"
            fill="none"
            stroke="url(#routeGlow)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.25"
          />
          <defs>
            <linearGradient id="routeGlow" x1="0" x2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
        </svg>
        <motion.div
          className="absolute top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-amber-200/55 bg-slate-950/95 text-xl shadow-[0_0_28px_rgba(251,191,36,0.4)]"
          initial={false}
          animate={{
            left: `${8 + (pct / 100) * 84}%`,
            y: -Math.sin((pct / 100) * Math.PI) * 20,
          }}
          transition={{ type: "spring", stiffness: 70, damping: 16 }}
        >
          ✈
        </motion.div>
      </div>

      <p className="relative mt-6 text-center text-xs leading-relaxed text-white/45">
        Soft illustration — not real-time map data
      </p>
    </div>
  );
}
