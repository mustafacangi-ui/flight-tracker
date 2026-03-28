"use client";

import { motion } from "framer-motion";

import type { FlightDetail } from "../lib/flightDetailsTypes";
import { toneClassesFromFlightDetail } from "../lib/flightDetailViewModel";
import { splitFlightNumberDisplay } from "../lib/flightNumberDisplay";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

type Props = { flight: FlightDetail };

export default function FlightDetailHeader({ flight }: Props) {
  const { code, digits, singleLine } = splitFlightNumberDisplay(
    flight.flightNumber
  );
  const depCode = flight.departureAirportCode ?? "—";
  const arrCode = flight.arrivalAirportCode ?? "—";
  const depName =
    flight.departureAirportName ?? flight.departureCity ?? "Departure";
  const arrName =
    flight.arrivalAirportName ?? flight.arrivalCity ?? "Arrival";
  const duration =
    flight.stats?.duration?.replace(/\s*\(sched\.\)\s*/i, "").trim() ?? "—";

  const depLocal =
    flight.estimatedDepartureTime ?? flight.departureTime ?? "—";
  const arrLocal = flight.estimatedArrivalTime ?? flight.arrivalTime ?? "—";

  return (
    <motion.section
      className={glassCard("overflow-hidden p-6 sm:p-8")}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          {singleLine ? (
            <h1 className="font-mono text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              {flight.flightNumber}
            </h1>
          ) : (
            <h1 className="flex flex-wrap items-baseline gap-3 font-mono text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              <span>{code}</span>
              <span>{digits}</span>
            </h1>
          )}
          {flight.airlineName ? (
            <p className="text-lg text-gray-300 sm:text-xl">
              {flight.airlineName}
            </p>
          ) : null}
          <p className="font-mono text-2xl font-bold tracking-widest text-white/95 sm:text-3xl">
            {depCode} → {arrCode}
          </p>
          <p className="text-sm text-gray-400">
            <span className="text-gray-500">Route</span>
            <span className="mx-2 text-gray-600">·</span>
            <span className="text-gray-200">{depName}</span>
            <span className="mx-1.5 text-gray-600" aria-hidden>
              →
            </span>
            <span className="text-gray-200">{arrName}</span>
          </p>
          {flight.status ? (
            <span
              className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${toneClassesFromFlightDetail(
                flight.statusTone
              )}`}
            >
              {flight.status}
            </span>
          ) : null}
        </div>

        <div className="grid w-full shrink-0 gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[300px]">
          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Departure (local)
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-white">
              {depLocal}
            </p>
            {flight.departureTime &&
            flight.estimatedDepartureTime &&
            flight.estimatedDepartureTime !== flight.departureTime ? (
              <p className="mt-0.5 font-mono text-xs text-gray-500">
                Sched. {flight.departureTime}
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Arrival (local)
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-white">
              {arrLocal}
            </p>
            {flight.arrivalTime &&
            flight.estimatedArrivalTime &&
            flight.estimatedArrivalTime !== flight.arrivalTime ? (
              <p className="mt-0.5 font-mono text-xs text-gray-500">
                Sched. {flight.arrivalTime}
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 sm:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Duration
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-amber-200/90">
              {duration}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Aircraft type
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            {flight.aircraftType ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Tail number
          </p>
          <p className="mt-1 font-mono text-base font-semibold text-cyan-200/90">
            {flight.tailNumber ?? "—"}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
