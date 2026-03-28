"use client";

import { motion } from "framer-motion";

import FamilyMapCard from "../family/FamilyMapCard";
import { effectiveProgressPercent } from "../FlightProgress";
import type { FlightDetail } from "../../lib/flightDetailsTypes";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

type Props = { detail: FlightDetail };

export default function FlightLiveRouteMapSection({ detail }: Props) {
  const dep =
    detail.departureCity ??
    detail.departureAirportName ??
    detail.departureAirportCode ??
    "Departure";
  const arr =
    detail.arrivalCity ??
    detail.arrivalAirportName ??
    detail.arrivalAirportCode ??
    "Arrival";
  const pct = effectiveProgressPercent(detail);
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour >= 20;

  return (
    <motion.section
      className={glassCard("overflow-hidden p-1")}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="px-5 pb-2 pt-4 sm:px-6 sm:pt-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
          Live flight map
        </h2>
        <p className="mt-1 text-xs text-gray-600">
          Stylized journey view — position updates with flight progress.
        </p>
      </div>
      <div className="px-1 pb-1 sm:px-2 sm:pb-2">
        <FamilyMapCard
          departureCity={dep}
          arrivalCity={arr}
          progressPercent={pct}
          isNight={isNight}
        />
      </div>
    </motion.section>
  );
}
