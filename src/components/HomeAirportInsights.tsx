"use client";

import { motion } from "framer-motion";

import {
  getAirportInsightsMock,
  operationalBadgeClass,
  operationalLabel,
  trafficBadgeClass,
  trafficLabel,
  weatherPlaceholderFromMock,
} from "../lib/airportInsightsMock";
import DataProvenanceBadge from "./DataProvenanceBadge";
import PremiumBadge from "./PremiumBadge";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  },
};

type Props = { airportCode: string };

export default function HomeAirportInsights({ airportCode }: Props) {
  const code = airportCode.trim().toUpperCase();
  if (!code) return null;

  const insight = getAirportInsightsMock(code);
  const wx = weatherPlaceholderFromMock(insight);

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-3 sm:gap-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={item}
        whileHover={{
          y: -1,
          scale: 1.01,
          transition: { type: "spring", stiffness: 420, damping: 30 },
        }}
        className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_10px_36px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-[box-shadow,border-color] duration-300 hover:border-sky-400/30 hover:shadow-[0_14px_44px_rgba(56,189,248,0.07)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Destination weather
          </p>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <DataProvenanceBadge kind="mock" />
            <PremiumBadge variant="premium" />
          </div>
        </div>
        <p className="mt-2 font-mono text-2xl font-bold text-white">{code}</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums text-sky-100">
          {wx.temperature}
        </p>
        <p className="mt-1 text-sm font-medium text-gray-200">
          {wx.condition}
        </p>
        <p className="mt-3 text-xs text-gray-400">
          <span className="font-semibold text-gray-300">
            {insight.windDescriptor}
          </span>
          <span className="text-gray-600"> · </span>
          {wx.wind}
        </p>
        <p className="mt-2 text-xs text-gray-400">
          Visibility {insight.visibility}
        </p>
        <p className="mt-3 text-xs font-medium leading-relaxed text-amber-200/90">
          Delay risk: {wx.delayRisk}
        </p>
      </motion.div>

      <motion.div
        variants={item}
        whileHover={{
          y: -1,
          scale: 1.01,
          transition: { type: "spring", stiffness: 420, damping: 30 },
        }}
        className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_10px_36px_rgba(0,0,0,0.28)] outline-none backdrop-blur-sm transition-[box-shadow,border-color] duration-300 hover:border-amber-400/25 hover:shadow-[0_14px_44px_rgba(245,158,11,0.05)] focus-within:ring-2 focus-within:ring-amber-500/20"
      >
        <div>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Airport traffic score
            </p>
            <PremiumBadge variant="pro" />
          </div>
          <span
            className={`mt-3 inline-flex h-7 min-h-7 items-center rounded-full border px-3 py-0 text-xs font-semibold leading-none ${trafficBadgeClass(insight.traffic)}`}
          >
            {trafficLabel(insight.traffic)}
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-gray-400">
          Indicative only — based on typical patterns for this airport code.
        </p>
      </motion.div>

      <motion.div
        variants={item}
        whileHover={{
          y: -1,
          scale: 1.01,
          transition: { type: "spring", stiffness: 420, damping: 30 },
        }}
        className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-[box-shadow,border-color] duration-300 hover:border-emerald-400/25 hover:shadow-[0_14px_44px_rgba(52,211,153,0.05)]"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Operational status
          </p>
          <span
            className={`mt-3 inline-flex h-7 min-h-7 items-center rounded-full border px-3 py-0 text-xs font-semibold leading-none ${operationalBadgeClass(insight.operational)}`}
          >
            {operationalLabel(insight.operational)}
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-gray-400">
          Illustrative status — always confirm with your airline.
        </p>
      </motion.div>
    </motion.div>
  );
}
