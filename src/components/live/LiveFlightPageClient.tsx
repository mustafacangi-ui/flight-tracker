"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import LiveFlightHeader from "./LiveFlightHeader";
import LiveFlightMapLazy from "./LiveFlightMapLazy";
import LiveFlightProgressCard from "./LiveFlightProgressCard";
import LiveFlightStatsCard from "./LiveFlightStatsCard";
import FlightWeatherSection from "../weather/FlightWeatherSection";
import { effectiveProgressPercent } from "../FlightProgress";
import type { FlightDetail } from "../../lib/flightDetailsTypes";

type Props = {
  detail: FlightDetail;
  found: boolean;
};

export default function LiveFlightPageClient({ detail, found }: Props) {
  const pct = effectiveProgressPercent(detail);

  if (!found) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-[#04060d] px-4 py-[max(2rem,env(safe-area-inset-top))] pb-24 text-white">
        <div
          className="pointer-events-none fixed inset-0 opacity-50"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.25), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-md pt-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400/80">
            RouteWings
          </p>
          <h1 className="mt-4 text-2xl font-bold text-white">
            Flight not in demo set
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            We couldn&apos;t build a live map card for this flight number yet.
            Try a known demo flight or open the full detail page.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white transition hover:border-blue-400/35"
            >
              Search airports
            </Link>
            <Link
              href={`/flight/${encodeURIComponent(detail.flightNumber)}`}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/40"
            >
              Flight detail
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#04060d] text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.5]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -15%, rgba(37,99,235,0.28), transparent), radial-gradient(ellipse 50% 40% at 100% 90%, rgba(14,165,233,0.1), transparent)",
        }}
      />
      <main className="relative mx-auto max-w-lg px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href={`/flight/${encodeURIComponent(detail.flightNumber)}`}
            className="text-sm text-slate-500 transition hover:text-slate-200"
          >
            ← Flight detail
          </Link>
          <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-200">
            Home
          </Link>
        </div>

        <motion.div
          className="flex flex-col gap-5 sm:gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <LiveFlightHeader detail={detail} />
          <LiveFlightMapLazy
            departureAirportCode={detail.departureAirportCode}
            arrivalAirportCode={detail.arrivalAirportCode}
            progressPercent={pct}
          />
          <LiveFlightProgressCard detail={detail} />
          <LiveFlightStatsCard detail={detail} />
          <FlightWeatherSection
            compact
            departureAirportCode={detail.departureAirportCode}
            arrivalAirportCode={detail.arrivalAirportCode}
            departureLabel={
              detail.departureCity ?? detail.departureAirportName ?? undefined
            }
            arrivalLabel={
              detail.arrivalCity ?? detail.arrivalAirportName ?? undefined
            }
          />
          <p className="px-1 text-center text-[11px] leading-relaxed text-slate-600">
            Map position is simulated from schedule progress. Always confirm
            with {detail.airlineName ?? "the airline"}.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
