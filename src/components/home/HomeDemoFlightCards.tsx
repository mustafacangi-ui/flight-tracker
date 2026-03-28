"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import FlightCardLiveRow from "../FlightCardLiveRow";
import {
  flightCardHref,
  localDateInIanaTz,
} from "../../lib/flightCardLink";

type DemoFlight = {
  flightNumber: string;
  originCode: string;
  destCode: string;
  originLabel: string;
  destLabel: string;
  /** Context airport for /flight-card.html & API */
  airportCode: string;
  depTime: string;
  arrTime: string;
  airline: string;
  delayed?: boolean;
};

const DEMOS: DemoFlight[] = [
  {
    flightNumber: "TK2345",
    originCode: "SAW",
    destCode: "DUS",
    originLabel: "Sabiha Gökçen",
    destLabel: "Düsseldorf",
    airportCode: "SAW",
    depTime: "18:45",
    arrTime: "21:05",
    airline: "Turkish Airlines",
  },
  {
    flightNumber: "PC2092",
    originCode: "IST",
    destCode: "ADB",
    originLabel: "İstanbul",
    destLabel: "İzmir",
    airportCode: "IST",
    depTime: "14:20",
    arrTime: "15:35",
    airline: "Pegasus",
    delayed: true,
  },
  {
    flightNumber: "LH2029",
    originCode: "FRA",
    destCode: "IST",
    originLabel: "Frankfurt",
    destLabel: "İstanbul",
    airportCode: "FRA",
    depTime: "10:15",
    arrTime: "14:40",
    airline: "Lufthansa",
  },
];

const cardCls =
  "cursor-pointer rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-md transition duration-300 hover:scale-[1.02] hover:border-blue-500/40 hover:shadow-[0_20px_50px_rgba(59,130,246,0.2),0_0_36px_rgba(59,130,246,0.12)] md:rounded-3xl md:p-5";

export default function HomeDemoFlightCards() {
  const router = useRouter();
  const dateISO = useMemo(() => localDateInIanaTz("Europe/Istanbul"), []);

  return (
    <section className="space-y-3" aria-label="Example flights">
      <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-gray-500 sm:text-left">
        Demo flights
      </p>
      <ul className="flex flex-col gap-4">
        {DEMOS.map((d, i) => {
          const trackHref = flightCardHref(
            d.flightNumber,
            d.airportCode,
            dateISO
          );
          return (
            <motion.li
              key={d.flightNumber}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.07,
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <article
                role="button"
                tabIndex={0}
                className={cardCls}
                onClick={() => router.push(trackHref)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(trackHref);
                  }
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-2xl font-black tracking-tight text-white md:text-3xl">
                      {d.flightNumber}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{d.airline}</p>
                  </div>
                  {d.delayed ? (
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-200 ring-1 ring-amber-400/35">
                      Delayed
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-lg font-semibold text-gray-100 md:text-xl">
                  <span className="text-cyan-200/90">{d.originCode}</span>
                  <span className="mx-2 text-gray-600">→</span>
                  <span className="text-cyan-200/90">{d.destCode}</span>
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {d.originLabel} → {d.destLabel}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Departure
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold text-white">
                      {d.depTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Arrival
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold text-white">
                      {d.arrTime}
                    </p>
                  </div>
                </div>

                <FlightCardLiveRow
                  className="mt-4 border-t border-white/5 pt-4"
                  trackHref={trackHref}
                  flightNumber={d.flightNumber}
                  originLabel={d.originLabel}
                  destLabel={d.destLabel}
                  estimatedArrivalHm={d.arrTime}
                />
              </article>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
