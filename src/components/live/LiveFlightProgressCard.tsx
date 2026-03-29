"use client";

import { motion } from "framer-motion";

import { effectiveProgressPercent } from "../FlightProgress";
import type { FlightDetail } from "../../lib/flightDetailsTypes";
import { estimatedRemainingLabel } from "../../lib/liveFlightLabels";

type Props = {
  detail: FlightDetail;
};

export default function LiveFlightProgressCard({ detail }: Props) {
  const pct = effectiveProgressPercent(detail);
  const remaining = estimatedRemainingLabel(detail);
  const dep = detail.departureAirportCode ?? "—";
  const arr = detail.arrivalAirportCode ?? "—";
  const depT =
    detail.estimatedDepartureTime ??
    detail.departureTime ??
    "—";
  const arrT =
    detail.estimatedArrivalTime ?? detail.arrivalTime ?? "—";

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.35)] ring-1 ring-blue-500/10 backdrop-blur-xl sm:rounded-3xl sm:p-6"
    >
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        Route &amp; progress
      </h2>
      <div className="mt-4 flex items-center justify-between gap-3 font-mono text-sm font-bold text-white">
        <span className="text-sky-200/95">{dep}</span>
        <span className="text-slate-600" aria-hidden>
          ······
        </span>
        <span className="text-emerald-200/95">{arr}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-400">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Departure
          </p>
          <p className="mt-1 font-medium text-slate-200">{depT}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Arrival
          </p>
          <p className="mt-1 font-medium text-slate-200">{arrT}</p>
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-[11px] font-medium text-slate-500">
          <span>Progress</span>
          <span className="tabular-nums text-sky-200/90">{Math.round(pct)}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/90 ring-1 ring-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-300 shadow-[0_0_16px_rgba(56,189,248,0.45)]"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">
          Est. remaining / ETA context
        </p>
        <p className="mt-1 text-sm font-medium text-slate-200">{remaining}</p>
      </div>
    </motion.section>
  );
}
