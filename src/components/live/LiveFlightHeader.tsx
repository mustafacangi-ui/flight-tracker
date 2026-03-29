"use client";

import { motion } from "framer-motion";

import type { FlightDetail } from "../../lib/flightDetailsTypes";

type Props = {
  detail: FlightDetail;
};

export default function LiveFlightHeader({ detail }: Props) {
  const fn = detail.flightNumber ?? "—";
  const airline = detail.airlineName ?? "Airline";
  const status = detail.status ?? "Scheduled";

  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-blue-500/30 bg-white/[0.04] p-5 shadow-[0_0_40px_rgba(37,99,235,0.12)] ring-1 ring-blue-400/10 backdrop-blur-xl sm:rounded-3xl sm:p-6"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-400/85">
        Live track
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <motion.span
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/35 bg-gradient-to-br from-blue-600/30 to-sky-500/20 text-xl text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.25)]"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          ✈
        </motion.span>
        <div className="min-w-0">
          <h1 className="font-mono text-3xl font-black tracking-tight text-white sm:text-4xl">
            {fn}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-300">{airline}</p>
        </div>
        <span className="mb-1 ml-auto rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-sky-100">
          {status}
        </span>
      </div>
    </motion.header>
  );
}
