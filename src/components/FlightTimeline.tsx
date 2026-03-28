"use client";

import { motion } from "framer-motion";

import type { FlightTimelineEvent } from "../lib/flightDetailsTypes";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

function dotClass(state: FlightTimelineEvent["state"]): string {
  switch (state) {
    case "completed":
      return "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.55)] ring-2 ring-emerald-400/40";
    case "active":
      return "bg-blue-500 shadow-[0_0_14px_rgba(59,130,246,0.65)] ring-2 ring-blue-400/50";
    case "upcoming":
    default:
      return "bg-gray-600 ring-2 ring-gray-500/40";
  }
}

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.055,
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

type Props = {
  events: FlightTimelineEvent[];
  showDisclaimer?: boolean;
};

export default function FlightTimeline({
  events,
  showDisclaimer = true,
}: Props) {
  if (events.length === 0) return null;

  return (
    <motion.section
      className={glassCard("p-6")}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
        Flight timeline
      </h2>
      {showDisclaimer ? (
        <p className="mt-1 text-xs text-gray-600">
          Times may be illustrative when live milestones are not available from
          the feed.
        </p>
      ) : null}
      <ol className="relative mt-6 space-y-0 pl-1">
        <span
          className="absolute bottom-2 left-[0.45rem] top-2 w-px bg-gradient-to-b from-white/5 via-white/15 to-white/5"
          aria-hidden
        />
        {events.map((ev, i) => (
          <motion.li
            key={`${ev.time}-${ev.label}-${i}`}
            className="relative flex gap-4 pb-8 pl-8 last:pb-0"
            custom={i}
            variants={itemVariants}
            initial="hidden"
            animate="show"
          >
            <span
              className={`absolute left-0 top-1.5 z-[1] h-3 w-3 shrink-0 rounded-full ${dotClass(
                ev.state
              )}`}
              aria-hidden
            />
            <div className="min-w-0 pt-0.5">
              <p className="font-mono text-sm text-gray-300">{ev.time}</p>
              <p className="text-sm font-medium text-white">{ev.label}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </motion.section>
  );
}
