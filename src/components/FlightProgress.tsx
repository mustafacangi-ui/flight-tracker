"use client";

import { motion } from "framer-motion";

import type { FlightDetail, FlightLivePhase } from "../lib/flightDetailsTypes";
import { scheduleProgressPercent } from "../lib/flightDetailFallbacks";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

export type FlightProgressUiState =
  | "scheduled"
  | "boarding"
  | "departed"
  | "cruising"
  | "descending"
  | "landed";

const STATE_ORDER: FlightProgressUiState[] = [
  "scheduled",
  "boarding",
  "departed",
  "cruising",
  "descending",
  "landed",
];

const STATE_LABEL: Record<FlightProgressUiState, string> = {
  scheduled: "Scheduled",
  boarding: "Boarding",
  departed: "Departed",
  cruising: "Cruising",
  descending: "Descending",
  landed: "Landed",
};

function deriveUiState(
  detail: FlightDetail,
  barPct: number
): FlightProgressUiState {
  const phase: FlightLivePhase | undefined = detail.livePhase;
  if (phase === "landed" || barPct >= 99) return "landed";
  if (phase === "landing" || barPct >= 88) return "descending";
  if (phase === "in_air") return barPct >= 65 ? "descending" : "cruising";
  if (phase === "taxiing") return "departed";
  if (phase === "boarding") return "boarding";
  if (barPct <= 1) return "scheduled";
  if (barPct < 14) return "boarding";
  if (barPct < 38) return "departed";
  if (barPct < 80) return "cruising";
  if (barPct < 98) return "descending";
  return "landed";
}

export function effectiveProgressPercent(detail: FlightDetail): number {
  if (detail.progressPercent != null) {
    return Math.min(100, Math.max(0, detail.progressPercent));
  }
  const fromSched = scheduleProgressPercent(detail);
  if (fromSched > 0) return fromSched;
  const s = deriveUiState(detail, 0);
  const idx = STATE_ORDER.indexOf(s);
  return Math.min(95, Math.max(0, idx * 18));
}

type Props = { detail: FlightDetail };

export default function FlightProgress({ detail }: Props) {
  const depCode = detail.departureAirportCode ?? "—";
  const arrCode = detail.arrivalAirportCode ?? "—";
  const depLabel =
    detail.departureAirportName ?? detail.departureCity ?? "Departure";
  const arrLabel =
    detail.arrivalAirportName ?? detail.arrivalCity ?? "Arrival";

  const pct = effectiveProgressPercent(detail);
  const activeState = deriveUiState(detail, pct);
  const activeIdx = STATE_ORDER.indexOf(activeState);

  return (
    <motion.section
      className={glassCard("p-6")}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
        Flight progress
      </h2>
      <p className="mt-1 text-xs text-gray-600">
        Bar blends scheduled times with current local time when live progress
        is unavailable.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {STATE_ORDER.map((key, i) => {
          const on = i === activeIdx;
          const past = i < activeIdx;
          return (
            <span
              key={key}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 transition ${
                on
                  ? "bg-blue-500/25 text-blue-100 ring-blue-400/50"
                  : past
                    ? "bg-white/[0.06] text-gray-400 ring-white/10"
                    : "bg-transparent text-gray-600 ring-white/10"
              }`}
            >
              {STATE_LABEL[key]}
            </span>
          );
        })}
      </div>

      <div className="mt-8">
        <div className="relative flex items-center justify-between gap-2 text-center">
          <div className="min-w-0 flex-1 text-left">
            <p className="font-mono text-lg font-bold text-cyan-200/95 sm:text-xl">
              {depCode}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500">
              {depLabel}
            </p>
          </div>

          <div className="relative mx-1 flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16">
            <span
              className="absolute inset-0 rounded-full border border-cyan-500/20 bg-cyan-500/5"
              aria-hidden
            />
            <motion.span
              className="relative text-2xl sm:text-3xl"
              aria-hidden
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              ✈
            </motion.span>
          </div>

          <div className="min-w-0 flex-1 text-right">
            <p className="font-mono text-lg font-bold text-cyan-200/95 sm:text-xl">
              {arrCode}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500">
              {arrLabel}
            </p>
          </div>
        </div>

        <div className="relative mt-6 h-12">
          <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/10" />
          <motion.div
            className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 70, damping: 18 }}
          />
          <motion.div
            className="absolute top-1/2 z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-400/45 bg-gray-950/95 text-lg shadow-[0_0_24px_rgba(34,211,238,0.25)] sm:h-12 sm:w-12 sm:text-xl"
            initial={false}
            animate={{ left: `${pct}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 16 }}
            aria-hidden
          >
            ✈
          </motion.div>
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] text-gray-500 sm:text-xs">
          <span>Sched. dep. {detail.departureTime ?? "—"}</span>
          <span>{Math.round(pct)}%</span>
          <span>Sched. arr. {detail.arrivalTime ?? "—"}</span>
        </div>
      </div>

      {detail.estimatedArrivalCaption ? (
        <p className="mt-4 text-center text-xs text-gray-400">
          {detail.estimatedArrivalCaption}
        </p>
      ) : null}
    </motion.section>
  );
}
