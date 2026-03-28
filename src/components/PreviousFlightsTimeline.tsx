"use client";

import { motion } from "framer-motion";

import SectionHeader from "./SectionHeader";
import type {
  AircraftHistoryDayGroup,
  AircraftHistoryItem,
} from "../lib/flightDetailsTypes";
import { parseHmToMinutes } from "../lib/flightDetailFallbacks";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

function blockDuration(dep?: string, arr?: string): string {
  if (!dep?.trim() || !arr?.trim() || dep === "—" || arr === "—") return "—";
  const d1 = parseHmToMinutes(dep);
  const d2 = parseHmToMinutes(arr);
  if (d1 == null || d2 == null) return "—";
  let diff = d2 - d1;
  if (diff < 0) diff += 24 * 60;
  if (diff === 0) return "—";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function groupItems(
  items: AircraftHistoryItem[]
): { label: string; rows: AircraftHistoryItem[] }[] {
  const today: AircraftHistoryItem[] = [];
  const yesterday: AircraftHistoryItem[] = [];
  for (const h of items) {
    const g: AircraftHistoryDayGroup | undefined = h.dayGroup;
    if (g === "today") today.push(h);
    else if (g === "yesterday") yesterday.push(h);
  }
  const out: { label: string; rows: AircraftHistoryItem[] }[] = [];
  if (today.length) out.push({ label: "Today", rows: today });
  if (yesterday.length) out.push({ label: "Yesterday", rows: yesterday });
  if (out.length === 0) {
    out.push({ label: "Today", rows: items });
  }
  return out;
}

type Props = { items: AircraftHistoryItem[] };

export default function PreviousFlightsTimeline({ items }: Props) {
  const sections = groupItems(items);

  if (items.length === 0) {
    return (
      <motion.section
        className={glassCard("p-6")}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionHeader
          title="Previous flights (same aircraft)"
          titleClassName="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500"
        />
        <p className="mt-3 text-sm text-gray-500">No legs to show yet.</p>
      </motion.section>
    );
  }

  return (
    <motion.section
      className={glassCard("p-6")}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <SectionHeader
        title="Previous flights (same aircraft)"
        titleClassName="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500"
        subtitle="Grouped by day. Duration is block time from scheduled departure to arrival when both times are known."
      />

      <div className="mt-6 space-y-8">
        {sections.map((sec) => (
          <div key={sec.label}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              {sec.label}
            </p>
            <ul className="space-y-3">
              {sec.rows.map((h, i) => {
                const timeLead = h.departureTime?.trim()
                  ? `${h.departureTime} `
                  : "";
                const duration = blockDuration(h.departureTime, h.arrivalTime);
                return (
                  <motion.li
                    key={`${h.flightNumber}-${h.from}-${h.to}-${sec.label}-${i}`}
                    className={`rounded-2xl border px-4 py-3 ${
                      h.isCurrent
                        ? "border-cyan-400/40 bg-cyan-500/[0.08]"
                        : h.delayed
                          ? "border-red-500/25 bg-red-500/[0.05]"
                          : "border-white/8 bg-black/25"
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: i * 0.045,
                      duration: 0.28,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <p className="font-mono text-sm font-semibold text-white">
                      <span className="text-cyan-200/90">{timeLead}</span>
                      <span className="text-white">{h.flightNumber}</span>{" "}
                      <span className="text-gray-500">{h.from}</span>
                      <span className="mx-1 text-gray-600">→</span>
                      <span className="text-gray-300">{h.to}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {h.status ? (
                        <span className="rounded-md bg-white/10 px-2 py-0.5 font-medium text-gray-300 ring-1 ring-white/10">
                          {h.status}
                        </span>
                      ) : null}
                      <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-gray-500 ring-1 ring-white/10">
                        {duration}
                      </span>
                      {h.isCurrent ? (
                        <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 font-semibold text-cyan-100 ring-1 ring-cyan-400/35">
                          This flight
                        </span>
                      ) : null}
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
