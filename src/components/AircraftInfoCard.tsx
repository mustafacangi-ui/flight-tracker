"use client";

import { motion } from "framer-motion";

import type { FlightDetail } from "../lib/flightDetailsTypes";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

type Props = Pick<
  FlightDetail,
  | "aircraftType"
  | "tailNumber"
  | "aircraftAgeYears"
  | "seatCount"
  | "seatLayout"
  | "registrationCountry"
  | "airlineName"
> & { motionIndex?: number };

export default function AircraftInfoCard({
  aircraftType,
  tailNumber,
  aircraftAgeYears,
  seatCount,
  seatLayout,
  registrationCountry,
  airlineName,
  motionIndex = 0,
}: Props) {
  const type =
    aircraftType?.trim() || "Aircraft data unavailable";
  const tail = tailNumber?.trim() || "Unknown registration";
  const age =
    aircraftAgeYears != null ? `${aircraftAgeYears.toFixed(1)} years` : "—";
  const seats =
    seatCount != null ? `${seatCount} seats` : "—";
  const layout = seatLayout?.trim() || "—";
  const reg = registrationCountry?.trim() || "—";
  const airline = airlineName?.trim() || "—";

  return (
    <motion.section
      className={glassCard("p-6")}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.36,
        delay: 0.1 + motionIndex * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
        Aircraft
      </h2>
      <p className="mt-3 text-lg font-semibold text-white">{type}</p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        Tail number
      </p>
      <p className="mt-0.5 font-mono text-lg font-semibold text-cyan-200/90">
        {tail}
      </p>

      <ul className="mt-5 space-y-2.5 text-sm text-gray-400">
        <li>
          <span className="text-gray-500">Aircraft age </span>
          <span className="text-gray-200">{age}</span>
        </li>
        <li>
          <span className="text-gray-500">Seat capacity </span>
          <span className="text-gray-200">{seats}</span>
        </li>
        <li>
          <span className="text-gray-500">Layout </span>
          <span className="text-gray-200">{layout}</span>
        </li>
        <li>
          <span className="text-gray-500">Airline </span>
          <span className="text-gray-200">{airline}</span>
        </li>
        <li>
          <span className="text-gray-500">Registration country </span>
          <span className="text-gray-200">{reg}</span>
        </li>
      </ul>
    </motion.section>
  );
}
