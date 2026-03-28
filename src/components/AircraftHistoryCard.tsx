"use client";

import { motion } from "framer-motion";

import type { FlightDetail } from "../lib/flightDetailsTypes";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

type Props = Pick<
  FlightDetail,
  "tailNumber" | "aircraftType" | "airlineName" | "aircraftAgeYears"
>;

export default function AircraftHistoryCard({
  tailNumber,
  aircraftType,
  airlineName,
  aircraftAgeYears,
}: Props) {
  const tail = tailNumber?.trim() || "—";
  const type = aircraftType?.trim() || "—";
  const airline = airlineName?.trim() || "—";
  const age =
    aircraftAgeYears != null ? `${aircraftAgeYears.toFixed(1)} years old` : "—";

  return (
    <motion.section
      className={glassCard("p-6")}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
        Aircraft (tail history)
      </h2>
      <div className="mt-4 space-y-1">
        <p className="font-mono text-2xl font-bold tracking-wide text-white">
          {tail}
        </p>
        <p className="text-base font-medium text-gray-200">{type}</p>
        <p className="text-sm text-gray-400">{airline}</p>
        <p className="text-sm text-amber-200/85">{age}</p>
      </div>
    </motion.section>
  );
}
