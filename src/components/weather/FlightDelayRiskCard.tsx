"use client";

import { motion } from "framer-motion";

import type { WeatherDelayRiskLevel } from "../../lib/weather/getAirportWeather";

type Props = {
  level: WeatherDelayRiskLevel;
  reasons: string[];
  className?: string;
};

const TITLE: Record<WeatherDelayRiskLevel, string> = {
  low: "Low delay risk",
  moderate: "Moderate delay risk",
  high: "High delay risk",
};

const RING: Record<WeatherDelayRiskLevel, string> = {
  low: "ring-emerald-500/25 shadow-[0_0_28px_rgba(16,185,129,0.12)]",
  moderate: "ring-amber-500/30 shadow-[0_0_28px_rgba(245,158,11,0.12)]",
  high: "ring-red-500/35 shadow-[0_0_32px_rgba(239,68,68,0.15)]",
};

const FILL: Record<WeatherDelayRiskLevel, string> = {
  low: "bg-emerald-400",
  moderate: "bg-amber-400",
  high: "bg-red-400",
};

export default function FlightDelayRiskCard({
  level,
  reasons,
  className = "",
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-2xl border border-blue-500/20 bg-slate-950/60 p-4 ring-1 backdrop-blur-xl sm:rounded-3xl sm:p-5 ${RING[level]} ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-400/80">
          Weather delay outlook
        </h2>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">
          Weather-based
        </span>
      </div>
      <p className="mt-3 text-xl font-bold text-white sm:text-2xl">{TITLE[level]}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full ${FILL[level]}`}
          initial={{ width: "8%" }}
          animate={{
            width: level === "low" ? "33%" : level === "moderate" ? "66%" : "100%",
          }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {reasons.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-slate-400">
          {reasons.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-sky-400/90" aria-hidden>
                ·
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          No significant weather drivers detected for this route (demo data).
        </p>
      )}
    </motion.section>
  );
}
