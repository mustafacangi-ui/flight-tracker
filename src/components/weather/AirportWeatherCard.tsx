"use client";

import { motion } from "framer-motion";

import type { AirportWeatherSnapshot } from "../../lib/weather/getAirportWeather";

type Role = "departure" | "arrival";

type Props = {
  snapshot: AirportWeatherSnapshot;
  role: Role;
  className?: string;
};

const ROLE_LABEL: Record<Role, string> = {
  departure: "Departure",
  arrival: "Arrival",
};

function formatVis(m: number): string {
  if (m >= 5000) return `${Math.round(m / 1000)} km`;
  return `${m} m`;
}

export default function AirportWeatherCard({
  snapshot,
  role,
  className = "",
}: Props) {
  const title =
    snapshot.airportLabel?.trim() ||
    `${ROLE_LABEL[role]} · ${snapshot.airportCode}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-2xl border border-blue-500/25 bg-slate-950/55 p-4 shadow-[0_0_32px_rgba(37,99,235,0.12)] ring-1 ring-sky-500/10 backdrop-blur-xl sm:rounded-3xl sm:p-5 ${className}`.trim()}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-400/75">
        {ROLE_LABEL[role]} weather
      </p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{snapshot.airportCode}</p>
        </div>
        <motion.span
          className="shrink-0 text-4xl leading-none sm:text-[2.75rem]"
          aria-hidden
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {snapshot.icon}
        </motion.span>
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums text-white sm:text-4xl">
        {snapshot.temperatureC > 0 ? "+" : ""}
        {snapshot.temperatureC}
        <span className="text-lg font-semibold text-slate-400">°C</span>
      </p>
      <p className="mt-1 text-sm text-sky-200/90">{snapshot.conditionLabel}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:text-sm">
        <div className="rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/5">
          <dt className="text-slate-500">Wind</dt>
          <dd className="mt-0.5 font-medium text-slate-200">
            {snapshot.windSpeedKph} km/h
          </dd>
        </div>
        <div className="rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/5">
          <dt className="text-slate-500">Visibility</dt>
          <dd className="mt-0.5 font-medium text-slate-200">
            {formatVis(snapshot.visibilityM)}
          </dd>
        </div>
        <div className="col-span-2 rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/5">
          <dt className="text-slate-500">Precipitation (1h)</dt>
          <dd className="mt-0.5 font-medium text-slate-200">
            {snapshot.precipitationMm <= 0
              ? "None"
              : `${snapshot.precipitationMm} mm`}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-600">
        Illustrative conditions for demo. Live API integration planned.
      </p>
    </motion.section>
  );
}
