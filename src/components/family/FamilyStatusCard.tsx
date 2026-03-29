"use client";

import { motion } from "framer-motion";

import { effectiveProgressPercent } from "../FlightProgress";
import type { FlightDetail } from "../../lib/flightDetailsTypes";
import { familyFriendlyStatusMessages } from "../../lib/familyShareView";

function cardPad(familyMode: boolean) {
  return familyMode ? "p-8 sm:p-10" : "p-6 sm:p-8";
}

type MessagesProps = {
  variant?: "messages";
  detail: FlightDetail;
  familyMode: boolean;
};

type LiveProps = {
  variant: "live";
  detail: FlightDetail;
};

export type FamilyStatusCardProps = MessagesProps | LiveProps;

function toneBorder(tone: FlightDetail["statusTone"]): string {
  switch (tone) {
    case "green":
      return "border-emerald-500/35 shadow-[0_0_32px_rgba(16,185,129,0.12)]";
    case "yellow":
      return "border-amber-500/35 shadow-[0_0_32px_rgba(245,158,11,0.12)]";
    case "red":
      return "border-rose-500/35 shadow-[0_0_32px_rgba(244,63,94,0.12)]";
    default:
      return "border-blue-500/30 shadow-[0_0_28px_rgba(59,130,246,0.1)]";
  }
}

function LiveStatusBody({ flight }: { flight: FlightDetail }) {
  const status = flight.status ?? "Scheduled";
  const phrase = flight.liveStatusPhrase ?? flight.routePhaseLabel ?? "";
  const pct = effectiveProgressPercent(flight);
  const tone = flight.statusTone ?? "gray";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.35 }}
      className={`rounded-2xl border bg-slate-900/50 p-5 backdrop-blur-xl sm:rounded-3xl sm:p-6 ${toneBorder(tone)}`}
    >
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        Live status
      </h2>
      <p className="mt-2 text-xl font-bold text-white sm:text-2xl">{status}</p>
      {phrase ? (
        <p className="mt-1 text-sm font-medium text-sky-200/90">{phrase}</p>
      ) : null}
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-[11px] font-medium text-slate-500">
          <span>Progress</span>
          <span className="tabular-nums text-slate-300">{Math.round(pct)}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/90 ring-1 ring-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 shadow-[0_0_16px_rgba(56,189,248,0.45)]"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
      {flight.liveStatusLines && flight.liveStatusLines.length > 0 ? (
        <ul className="mt-4 space-y-1.5 border-t border-white/5 pt-4 text-sm text-slate-300">
          {flight.liveStatusLines.slice(0, 4).map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-sky-400/90" aria-hidden>
                ◆
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </motion.section>
  );
}

export default function FamilyStatusCard(props: FamilyStatusCardProps) {
  if (props.variant === "live") {
    return <LiveStatusBody flight={props.detail} />;
  }

  const { detail, familyMode } = props;
  const messages = familyFriendlyStatusMessages(detail, familyMode);
  const body = familyMode
    ? "text-lg sm:text-xl leading-relaxed"
    : "text-base sm:text-lg";

  return (
    <section
      className={`rounded-3xl border border-white/[0.08] bg-white/[0.04] ${cardPad(familyMode)} shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-5`}
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
        {familyMode ? "Reassuring updates" : "Live status"}
      </h2>
      {messages.map((line, i) => (
        <p key={i} className={`leading-relaxed text-gray-200 ${body}`}>
          {line}
        </p>
      ))}
    </section>
  );
}
