"use client";

import { motion } from "framer-motion";

import type { FlightDetail } from "../../lib/flightDetailsTypes";

type Props = {
  detail: FlightDetail;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/15 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export default function LiveFlightStatsCard({ detail }: Props) {
  const alt =
    detail.stats?.altitude?.trim() || "Awaiting live ADS-B (phase 1)";
  const spd =
    detail.stats?.speed?.trim() || "Ground / cruise estimate soon";

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.35)] ring-1 ring-indigo-500/10 backdrop-blur-xl sm:rounded-3xl sm:p-6"
    >
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        Aircraft
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field
          label="Type"
          value={detail.aircraftType?.trim() || "—"}
        />
        <Field
          label="Tail / reg"
          value={detail.tailNumber?.trim() || "—"}
        />
        <Field label="Altitude" value={alt} />
        <Field label="Speed" value={spd} />
      </div>
    </motion.section>
  );
}
