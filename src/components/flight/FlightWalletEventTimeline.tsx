"use client";

import { motion } from "framer-motion";

import type { FlightDetail } from "../../lib/flightDetailsTypes";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

type RowState = "done" | "active" | "upcoming";

type Row = {
  id: string;
  title: string;
  caption: string;
  state: RowState;
};

function findTimeline(
  f: FlightDetail,
  re: RegExp,
  exclude?: RegExp
): { time?: string; label?: string; completed?: boolean } | null {
  const events = f.timelineEvents ?? [];
  const hit = events.find(
    (e) =>
      re.test(e.label) && (!exclude || !exclude.test(e.label))
  );
  if (!hit) return null;
  return {
    time: hit.time,
    label: hit.label,
    completed: hit.state === "completed",
  };
}

function buildRows(f: FlightDetail): Row[] {
  const phase = f.livePhase;
  const statusLower = (f.status ?? "").toLowerCase();

  const boardingHit = findTimeline(f, /boarding/i);
  let boardingState: RowState = "upcoming";
  let boardingCaption = "Awaiting start";
  if (phase === "boarding") {
    boardingState = "active";
    boardingCaption = boardingHit?.time
      ? `Now · ${boardingHit.time}`
      : "In progress";
  } else if (
    phase &&
    ["taxiing", "in_air", "landing", "landed"].includes(phase)
  ) {
    boardingState = "done";
    boardingCaption = boardingHit?.time
      ? `${boardingHit.time} · ${boardingHit.label ?? "Boarding"}`
      : "Complete";
  } else if (boardingHit?.completed) {
    boardingState = "done";
    boardingCaption = `${boardingHit.time ?? ""} · ${boardingHit.label ?? "Boarding"}`.trim();
  } else if (boardingHit?.time) {
    boardingCaption = `Expected · ${boardingHit.time}`;
  }

  const gateHit = findTimeline(
    f,
    /gate/i,
    /arrived at gate|at gate$/i
  );
  const gateBadge = f.badges?.find((b) =>
    /gate|terminal|reassign|moved|change/i.test(b.text)
  );
  let gateState: RowState = "upcoming";
  let gateCaption = "No change reported";
  if (gateHit?.completed || gateBadge) {
    gateState = "done";
    gateCaption = gateHit?.time
      ? `${gateHit.time} · ${gateHit.label ?? "Gate update"}`
      : gateBadge?.text ?? "Updated";
  } else if (gateHit && !gateHit.completed) {
    gateState = "active";
    gateCaption = `${gateHit.time ?? ""} · ${gateHit.label ?? "Gate"}`.trim();
  }

  const delayed =
    /delay|late|behind/i.test(statusLower) ||
    f.statusTone === "yellow" ||
    f.badges?.some((b) => /delay|late/i.test(b.text));
  let delayState: RowState = "upcoming";
  let delayCaption = "Operating on schedule";
  if (delayed) {
    delayState =
      phase === "landed" || statusLower.includes("landed")
        ? "done"
        : "active";
    delayCaption =
      f.status && /delay|late/i.test(f.status) ? f.status : "Delay reported";
  }

  const landedHit = findTimeline(f, /landed|arrived at gate/i);
  let landedState: RowState = "upcoming";
  let landedCaption = "En route";
  if (phase === "landed") {
    landedState = "done";
    landedCaption = landedHit?.time
      ? `${landedHit.time} · Arrived`
      : f.actualArrivalTime
        ? `Landed · ${f.actualArrivalTime}`
        : "Complete";
  } else if (phase === "landing") {
    landedState = "active";
    landedCaption = "On final approach";
  } else if (landedHit?.completed) {
    landedState = "done";
    landedCaption = `${landedHit.time ?? ""} · ${landedHit.label ?? "Landed"}`.trim();
  }

  return [
    { id: "boarding", title: "Boarding started", caption: boardingCaption, state: boardingState },
    { id: "gate", title: "Gate changed", caption: gateCaption, state: gateState },
    { id: "delay", title: "Delayed", caption: delayCaption, state: delayState },
    { id: "landed", title: "Landed", caption: landedCaption, state: landedState },
  ];
}

function dotClass(state: RowState): string {
  if (state === "done")
    return "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.45)]";
  if (state === "active")
    return "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)] animate-pulse";
  return "bg-white/20";
}

function lineClass(state: RowState): string {
  if (state === "done") return "bg-emerald-500/35";
  if (state === "active") return "bg-amber-500/30";
  return "bg-white/10";
}

type Props = { flight: FlightDetail };

export default function FlightWalletEventTimeline({ flight }: Props) {
  const rows = buildRows(flight);

  return (
    <motion.section
      className={glassCard("p-6 sm:p-8")}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
        Trip events
      </h2>
      <p className="mt-1 text-xs text-gray-600">
        Wallet-style milestones for this leg.
      </p>

      <ul className="relative mt-6 space-y-0">
        {rows.map((row, i) => (
          <li key={row.id} className="relative flex gap-4 pb-8 last:pb-0">
            {i < rows.length - 1 ? (
              <span
                className={`absolute left-[7px] top-4 h-[calc(100%-0.25rem)] w-px ${lineClass(row.state)}`}
                aria-hidden
              />
            ) : null}
            <span className="relative z-10 mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center">
              <span className={`h-2.5 w-2.5 rounded-full ${dotClass(row.state)}`} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-white">{row.title}</p>
              <p className="mt-0.5 text-xs text-gray-500">{row.caption}</p>
            </div>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
