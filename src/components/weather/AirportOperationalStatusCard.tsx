"use client";

import { motion } from "framer-motion";

import type { OperationalStatusKind } from "../../lib/weather/getAirportWeather";

type Role = "departure" | "arrival";

type Props = {
  status: OperationalStatusKind;
  airportCode: string;
  role: Role;
  className?: string;
};

const ROLE: Record<Role, string> = {
  departure: "Departure airport",
  arrival: "Arrival airport",
};

const COPY: Record<
  OperationalStatusKind,
  { label: string; sub: string; accent: string }
> = {
  on_time: {
    label: "On time",
    sub: "Operations flowing normally",
    accent: "from-emerald-500/25 to-emerald-600/5",
  },
  moderate_delays: {
    label: "Moderate delays",
    sub: "Some holding and slot adjustments possible",
    accent: "from-amber-500/25 to-amber-600/5",
  },
  severe_delays: {
    label: "Severe delays",
    sub: "Expect significant schedule disruption",
    accent: "from-red-500/30 to-red-900/10",
  },
  runway_congestion: {
    label: "Runway congestion",
    sub: "Taxi and departure queues elevated",
    accent: "from-orange-500/25 to-orange-900/10",
  },
  heavy_traffic: {
    label: "Heavy traffic",
    sub: "Peak movement volume at airport",
    accent: "from-sky-500/20 to-blue-900/10",
  },
  weather_warning: {
    label: "Weather warning",
    sub: "ATC may issue ground stops or diversions",
    accent: "from-violet-500/25 to-indigo-900/10",
  },
};

export default function AirportOperationalStatusCard({
  status,
  airportCode,
  role,
  className = "",
}: Props) {
  const c = COPY[status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className={`rounded-2xl border border-white/10 bg-gradient-to-br ${c.accent} p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/10 backdrop-blur-md sm:rounded-3xl sm:p-4 ${className}`.trim()}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        {ROLE[role]}
      </p>
      <p className="mt-2 text-xs font-medium text-slate-500">{airportCode}</p>
      <p className="mt-2 text-base font-bold text-white sm:text-lg">{c.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
        {c.sub}
      </p>
    </motion.div>
  );
}
