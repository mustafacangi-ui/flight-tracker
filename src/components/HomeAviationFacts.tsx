"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

import type { DisplayFlight } from "../lib/formatFlights";

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

type Props = {
  airportCode: string;
  airportName: string;
  sampleFlight?: DisplayFlight | null;
};

export default function HomeAviationFacts({
  airportCode,
  airportName,
  sampleFlight,
}: Props) {
  const code = airportCode.trim().toUpperCase();
  const facts = useMemo(() => {
    const h = hashCode(code || "XXX");
    const name = airportName.trim() || code;
    const lines: string[] = [];

    const daily = 900 + (h % 700);
    lines.push(`${name} typically handles around ${daily} flights on busy days.`);

    const routeKm = 1200 + (h % 2200);
    if (sampleFlight?.destinationCity) {
      lines.push(
        `Illustrative distance toward ${sampleFlight.destinationCity} is about ${routeKm.toLocaleString()} km.`
      );
    } else {
      lines.push(
        `Average sector length from ${code} is often around ${routeKm.toLocaleString()} km.`
      );
    }

    const delayAvg = 8 + (h % 18);
    lines.push(
      `Average illustrative delay on departures here is about ${delayAvg} min.`
    );

    const firstFly = 1998 + (h % 24);
    if (sampleFlight?.tailNumber) {
      lines.push(
        `Tail ${sampleFlight.tailNumber} — aircraft age varies; some frames first flew around ${firstFly}.`
      );
    } else {
      lines.push(
        `Narrow-body fleets serving ${code} often include jets first delivered in the ${firstFly}s.`
      );
    }

    return lines;
  }, [airportName, code, sampleFlight]);

  return (
    <motion.section
      className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.3)] backdrop-blur-md"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-sm font-semibold tracking-wide text-gray-200">
        Aviation facts
      </h2>
      <p className="mt-1 text-[11px] text-gray-500">
        Fun, illustrative snippets — not operational briefings.
      </p>
      <ul className="mt-3 space-y-2.5">
        {facts.map((line, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.08 + i * 0.06,
              duration: 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex gap-2 text-xs leading-relaxed text-gray-300"
          >
            <span className="mt-0.5 shrink-0 text-sky-400/90" aria-hidden>
              ✦
            </span>
            <span>{line}</span>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  );
}
