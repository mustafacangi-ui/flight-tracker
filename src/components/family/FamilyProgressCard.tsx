"use client";

import { motion } from "framer-motion";

import type { FlightDetail } from "../../lib/flightDetailsTypes";
import {
  familyDistanceRemainingDisplay,
  familyEtaLine,
  familyRouteCodes,
  familyShareCountdownLine,
  familyShareMinutesRemaining,
  familyShareProgressHeadline,
} from "../../lib/familyShareView";

function cardPad(familyMode: boolean) {
  return familyMode ? "p-8 sm:p-10" : "p-6 sm:p-8";
}

type Props = {
  detail: FlightDetail;
  familyMode: boolean;
};

export default function FamilyProgressCard({ detail, familyMode }: Props) {
  const pct = Math.min(100, Math.max(0, detail.progressPercent ?? 0));
  const { dep, arr } = familyRouteCodes(detail);
  const headline = familyShareProgressHeadline(detail);
  const minutes = familyShareMinutesRemaining(detail);
  const countdown = familyShareCountdownLine(detail);
  const etaLine = familyEtaLine(detail);
  const distance = familyDistanceRemainingDisplay(detail);

  const small = familyMode ? "text-base sm:text-lg" : "text-sm sm:text-base";
  const stat = familyMode ? "text-xl sm:text-2xl" : "text-lg sm:text-xl";

  return (
    <section
      className={`rounded-3xl border border-white/[0.08] bg-white/[0.04] ${cardPad(familyMode)} shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-md`}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-base font-bold text-white sm:text-lg">
        <span className="text-rose-200/90">{dep}</span>
        <span className="text-white/35" aria-hidden>
          ●
        </span>
        <span className="hidden min-w-[1.5rem] flex-1 border-t border-dashed border-white/25 sm:block" />
        <span className="text-2xl text-amber-200/90" aria-hidden>
          ✈
        </span>
        <span className="hidden min-w-[1.5rem] flex-1 border-t border-dashed border-white/25 sm:block" />
        <span className="text-white/35" aria-hidden>
          ●
        </span>
        <span className="text-emerald-200/90">{arr}</span>
      </div>

      <p
        className={`mt-8 text-center font-semibold text-white ${
          familyMode ? "text-3xl" : "text-2xl sm:text-3xl"
        }`}
      >
        {headline}
      </p>

      <div
        className={`mt-8 grid gap-4 text-center sm:grid-cols-2 ${small} text-gray-300`}
      >
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Progress
          </p>
          <p className={`mt-1 font-mono font-bold text-white ${stat}`}>
            {Math.round(pct)}% completed
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Time to landing
          </p>
          <p className={`mt-1 font-semibold text-cyan-200/90 ${stat}`}>
            {minutes != null
              ? familyMode
                ? `About ${minutes} minutes left`
                : `Landing in ${minutes} min`
              : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 sm:col-span-2">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Estimated arrival
          </p>
          <p className={`mt-1 font-mono font-semibold text-amber-200/90 ${stat}`}>
            {etaLine}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 sm:col-span-2">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Distance remaining
          </p>
          <p className={`mt-1 font-mono text-white ${stat}`}>{distance}</p>
        </div>
      </div>

      <div className="relative mt-8 h-14">
        <div className="absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-white/[0.08]" />
        <motion.div
          className="absolute left-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-gradient-to-r from-rose-400 via-orange-300 to-amber-200"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 70, damping: 18 }}
        />
        <motion.div
          className="absolute top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-amber-200/50 bg-[#141418] text-2xl shadow-[0_0_28px_rgba(251,191,36,0.35)]"
          initial={false}
          animate={{ left: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 16 }}
          aria-hidden
        >
          ✈
        </motion.div>
      </div>

      {countdown ? (
        <p
          className={`mt-8 text-center font-semibold text-amber-100 ${
            familyMode ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
          }`}
        >
          {countdown}
        </p>
      ) : null}
    </section>
  );
}
