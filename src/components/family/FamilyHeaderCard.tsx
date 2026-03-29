"use client";

import { motion } from "framer-motion";

import type { FlightDetail } from "../../lib/flightDetailsTypes";

type Props = { flight: FlightDetail };

export default function FamilyHeaderCard({ flight }: Props) {
  const fn = flight.flightNumber ?? "—";
  const airline = flight.airlineName ?? "Airline";

  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-blue-500/35 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-[#060a14] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_48px_rgba(37,99,235,0.18)] ring-1 ring-blue-400/15 backdrop-blur-xl sm:rounded-3xl sm:p-6"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-400/85">
        Family tracking
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <h1 className="font-mono text-3xl font-black tracking-tight text-white sm:text-4xl">
          {fn}
        </h1>
        <span className="mb-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-slate-200">
          {airline}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Live-style status for your family — no sign-in required on this page.
      </p>
    </motion.header>
  );
}
