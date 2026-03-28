"use client";

import { motion } from "framer-motion";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

type Props = {
  variant: "departure" | "arrival";
  airportCode: string;
  airportName: string;
  city?: string;
  scheduledTime?: string;
  estimatedTime?: string;
  actualTime?: string;
  terminal?: string;
  gate?: string;
  /** IANA timezone for wall-clock context */
  timeZoneIana?: string;
  /** Stagger index for entrance animation */
  motionIndex?: number;
};

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-2.5 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="max-w-[60%] text-right font-mono font-medium text-white">
        {value}
      </span>
    </div>
  );
}

export default function AirportInfoCard({
  variant,
  airportCode,
  airportName,
  city,
  scheduledTime,
  estimatedTime,
  actualTime,
  terminal,
  gate,
  timeZoneIana,
  motionIndex = 0,
}: Props) {
  const title = variant === "departure" ? "Departure airport" : "Arrival airport";
  const sched = scheduledTime?.trim() || "—";
  const est = estimatedTime?.trim() || sched;
  const act = actualTime?.trim();
  const term = terminal?.trim() || "—";
  const g = gate?.trim() || "—";

  return (
    <motion.section
      className={glassCard("p-5")}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.36,
        delay: 0.08 + motionIndex * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
        {title}
      </h2>
      <p className="mt-3 font-mono text-2xl font-bold tracking-wider text-white">
        {airportCode}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-200">{airportName}</p>
      {city?.trim() ? (
        <p className="mt-0.5 text-xs text-gray-500">{city}</p>
      ) : null}

      <div className="mt-4 text-sm">
        <Row label="Scheduled" value={sched} />
        <Row label="Estimated" value={est} />
        <Row label="Actual" value={act || "—"} />
        <Row
          label="Time zone"
          value={timeZoneIana?.trim() || "— (using device / airport default)"}
        />
        <Row label="Terminal" value={term} />
        <Row label="Gate" value={g} />
      </div>
    </motion.section>
  );
}
