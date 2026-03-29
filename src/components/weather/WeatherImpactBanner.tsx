"use client";

import { motion } from "framer-motion";

import type { WeatherImpactAlert } from "../../lib/weather/getAirportWeather";

type Props = {
  alerts: WeatherImpactAlert[];
  className?: string;
};

const VARIANT_STYLES: Record<
  WeatherImpactAlert["variant"],
  string
> = {
  info: "border-sky-500/35 bg-sky-500/10 text-sky-100 shadow-[0_0_24px_rgba(14,165,233,0.12)]",
  warning:
    "border-amber-500/40 bg-amber-500/10 text-amber-50 shadow-[0_0_24px_rgba(245,158,11,0.12)]",
  danger:
    "border-red-500/40 bg-red-500/10 text-red-50 shadow-[0_0_28px_rgba(239,68,68,0.14)]",
};

export default function WeatherImpactBanner({
  alerts,
  className = "",
}: Props) {
  if (!alerts.length) return null;

  return (
    <div className={`space-y-2 sm:space-y-3 ${className}`.trim()}>
      {alerts.map((a, i) => (
        <motion.div
          key={a.id}
          role="status"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
          className={`flex gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md sm:rounded-3xl sm:px-5 sm:py-3.5 ${VARIANT_STYLES[a.variant]}`}
        >
          <span className="shrink-0 text-lg" aria-hidden>
            {a.variant === "danger"
              ? "⚠️"
              : a.variant === "warning"
                ? "⛈️"
                : "ℹ️"}
          </span>
          <p className="min-w-0 text-sm font-medium leading-snug">{a.message}</p>
        </motion.div>
      ))}
    </div>
  );
}
