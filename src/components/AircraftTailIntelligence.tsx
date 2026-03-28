"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";

import PremiumBadge from "./PremiumBadge";
import AircraftHistoryCard from "./AircraftHistoryCard";
import PreviousFlightsTimeline from "./PreviousFlightsTimeline";
import type {
  AircraftReadinessState,
  AircraftTailTracking,
  FlightDetail,
} from "../lib/flightDetailsTypes";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

function readinessRing(state?: AircraftReadinessState): string {
  switch (state) {
    case "ready":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
    case "cleaning":
    case "refueling":
    case "crew_boarding":
    case "awaiting_gate":
      return "border-amber-500/40 bg-amber-500/10 text-amber-100";
    case "delayed_inbound":
      return "border-red-500/45 bg-red-500/12 text-red-100";
    default:
      return "border-white/20 bg-white/[0.06] text-gray-200";
  }
}

type Props = { detail: FlightDetail };

export default function AircraftTailIntelligence({ detail }: Props) {
  const tt: AircraftTailTracking = detail.aircraftTailTracking ?? {};
  const history = detail.history ?? [];
  const dep = detail.departureAirportCode ?? "—";
  const arr = detail.arrivalAirportCode ?? "—";
  const route = tt.routeMapAirports ?? [];
  const legStart = tt.activeRouteLegStartIndex;
  const prev = tt.previousFlight;
  const readiness = tt.readinessState;
  const readinessLabel =
    tt.readinessLabel?.trim() ||
    (readiness === "ready"
      ? "Ready for boarding"
      : readiness === "cleaning"
        ? "Still cleaning"
        : readiness === "refueling"
          ? "Refueling"
          : readiness === "crew_boarding"
            ? "Crew boarding"
            : readiness === "delayed_inbound"
              ? "Delayed inbound aircraft"
              : readiness === "awaiting_gate"
                ? "Awaiting gate arrival"
                : "Status unknown");
  const stats = tt.usageStats;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex justify-end">
        <PremiumBadge variant="advanced" />
      </div>
      <AircraftHistoryCard
        tailNumber={detail.tailNumber}
        aircraftType={detail.aircraftType}
        airlineName={detail.airlineName}
        aircraftAgeYears={detail.aircraftAgeYears}
      />

      {tt.inboundDelayBadge ? (
        <motion.div
          className="rounded-2xl border border-orange-500/45 bg-gradient-to-br from-orange-500/15 to-red-500/10 px-4 py-3 shadow-[0_0_24px_rgba(251,146,60,0.12)]"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          role="status"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-orange-200">
            {tt.inboundDelayBadge.title}
          </p>
          {tt.inboundDelayBadge.detail ? (
            <p className="mt-1 text-sm text-orange-50/95">
              {tt.inboundDelayBadge.detail}
            </p>
          ) : null}
        </motion.div>
      ) : null}

      {tt.currentLocationLine ? (
        <motion.div
          className={glassCard("p-5")}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Where is my aircraft now?
          </h2>
          <p className="mt-3 text-base font-medium leading-snug text-white">
            {tt.currentLocationLine}
          </p>
        </motion.div>
      ) : null}

      <motion.div
        className={glassCard("p-5")}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.04 }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
          Aircraft readiness
        </h2>
        <p
          className={`mt-4 inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${readinessRing(readiness)}`}
        >
          {readinessLabel}
        </p>
      </motion.div>

      {prev ? (
        <motion.div
          className={glassCard("p-5")}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.06 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Inbound aircraft
          </h2>
          <p className="mt-3 text-sm text-gray-400">
            Your aircraft is currently operating:
          </p>
          <p className="mt-1 font-mono text-lg font-bold text-white">
            {prev.flightNumber}{" "}
            <span className="text-gray-500">{prev.from}</span>
            <span className="mx-1.5 text-gray-600">→</span>
            <span className="text-cyan-200/90">{prev.to}</span>
          </p>
          {prev.landedAgo ? (
            <p className="mt-4 text-sm text-gray-400">
              Status
              <span className="mt-1 block font-medium text-emerald-200/90">
                Landed {prev.landedAgo}
              </span>
            </p>
          ) : null}
          {tt.turnaround?.groundTimeBeforeNextDeparture ? (
            <p className="mt-4 text-sm text-gray-400">
              Ground time before your flight
              <span className="mt-1 block font-mono text-base font-semibold text-amber-200/90">
                {tt.turnaround.groundTimeBeforeNextDeparture}
              </span>
            </p>
          ) : null}
          {tt.turnaround?.narrativeLine ? (
            <p className="mt-4 text-xs leading-relaxed text-gray-500">
              {tt.turnaround.narrativeLine}
            </p>
          ) : null}
          {tt.turnaround?.lateInboundMessage ? (
            <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100/95">
              {tt.turnaround.lateInboundMessage}
            </p>
          ) : null}
        </motion.div>
      ) : null}

      {route.length >= 2 ? (
        <motion.div
          className={glassCard("p-5")}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.08 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Route chain
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-2 font-mono text-sm sm:text-base">
            {route.map((code, i) => {
              const inActiveLeg =
                legStart != null && (i === legStart || i === legStart + 1);
              const arrowActive =
                legStart != null && i > 0 && i - 1 === legStart;
              return (
                <Fragment key={`${code}-${i}`}>
                  {i > 0 ? (
                    <span
                      className={
                        arrowActive
                          ? "mx-0.5 text-blue-300 drop-shadow-[0_0_10px_rgba(96,165,250,0.55)]"
                          : "mx-0.5 text-gray-600"
                      }
                      aria-hidden
                    >
                      →
                    </span>
                  ) : null}
                  <span
                    className={
                      inActiveLeg
                        ? "rounded-lg bg-blue-500/25 px-2.5 py-1 font-bold text-blue-100 shadow-[0_0_16px_rgba(59,130,246,0.35)] ring-1 ring-blue-400/50"
                        : "rounded-lg px-2.5 py-1 text-gray-400"
                    }
                  >
                    {code}
                  </span>
                </Fragment>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-gray-600">
            Current leg ({dep} → {arr}) highlighted in blue.
          </p>
        </motion.div>
      ) : null}

      {stats ? (
        <motion.div
          className={glassCard("p-6")}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.1 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Aircraft usage (today)
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-black/30 px-3 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Flights today
              </dt>
              <dd className="mt-1 font-mono text-xl font-bold text-white">
                {stats.flightsToday ?? "—"}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/30 px-3 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Airports visited
              </dt>
              <dd className="mt-1 font-mono text-xl font-bold text-white">
                {stats.airportsVisitedToday ?? "—"}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/30 px-3 py-3 sm:col-span-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Total air time
              </dt>
              <dd className="mt-1 font-mono text-lg font-semibold text-amber-200/90">
                {stats.totalFlightTimeToday ?? "—"}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/30 px-3 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Avg. turnaround
              </dt>
              <dd className="mt-1 font-mono text-lg font-semibold text-white">
                {stats.averageTurnaroundMinutes != null
                  ? `${stats.averageTurnaroundMinutes} min`
                  : "—"}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/30 px-3 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Delays today
              </dt>
              <dd className="mt-1 font-mono text-lg font-semibold text-white">
                {stats.delaysToday ?? "—"}
              </dd>
            </div>
          </dl>
        </motion.div>
      ) : null}

      {tt.inboundWarning && !tt.inboundDelayBadge ? (
        <div
          className="rounded-2xl border border-amber-500/35 bg-amber-500/[0.08] px-4 py-4"
          role="status"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">
            Inbound aircraft
          </p>
          <p className="mt-2 text-sm leading-relaxed text-amber-50/95">
            {tt.inboundWarning.message}
          </p>
        </div>
      ) : null}

      <PreviousFlightsTimeline items={history} />
    </section>
  );
}
