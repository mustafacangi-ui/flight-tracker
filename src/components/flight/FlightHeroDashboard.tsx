"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import FlightSaveBookmark from "../FlightSaveBookmark";
import TrackFlightButton from "../TrackFlightButton";
import { DISPLAY_DASH } from "../../lib/displayConstants";
import type { FlightDetail } from "../../lib/flightDetailsTypes";
import { toneClassesFromFlightDetail } from "../../lib/flightDetailViewModel";
import { splitFlightNumberDisplay } from "../../lib/flightNumberDisplay";
import type { SavedFlight } from "../../lib/quickAccessStorage";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

function airlineMonogram(airlineName?: string, flightNumber?: string): string {
  const n = airlineName?.trim();
  if (n) {
    const words = n.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      const a = words[0][0];
      const b = words[1][0];
      if (a && b) return (a + b).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const m = flightNumber?.match(/^([A-Za-z]{2})/);
  return m ? m[1].toUpperCase() : "RW";
}

type Props = {
  flight: FlightDetail;
  payload: SavedFlight;
  copied: boolean;
  onShare: () => void;
  onOpenPrefs: () => void;
  onUnlockRouteHistory: () => void;
};

function cell(label: string, value: string | undefined) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-bold text-white sm:text-base">
        {value?.trim() ? value : DISPLAY_DASH}
      </p>
    </div>
  );
}

export default function FlightHeroDashboard({
  flight,
  payload,
  copied,
  onShare,
  onOpenPrefs,
  onUnlockRouteHistory,
}: Props) {
  const { code, digits, singleLine } = splitFlightNumberDisplay(
    flight.flightNumber
  );
  const depCode = flight.departureAirportCode ?? DISPLAY_DASH;
  const arrCode = flight.arrivalAirportCode ?? DISPLAY_DASH;
  const depName =
    flight.departureAirportName ?? flight.departureCity ?? "Departure";
  const arrName =
    flight.arrivalAirportName ?? flight.arrivalCity ?? "Arrival";
  const mono = airlineMonogram(flight.airlineName, flight.flightNumber);
  const schedDep = flight.departureTime;
  const estDep =
    flight.estimatedDepartureTime ?? flight.actualDepartureTime;
  const schedArr = flight.arrivalTime;
  const estArr =
    flight.estimatedArrivalTime ?? flight.actualArrivalTime;
  const depGate = flight.gate;
  const depTerminal =
    flight.departureTerminal ?? flight.terminal;
  const arrGate = flight.arrivalGate;
  const arrTerminal = flight.arrivalTerminal;
  const shareLabel = copied ? "Link copied" : "Copy link";

  return (
    <motion.section
      className={`${glassCard("overflow-hidden")} relative`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(56,189,248,0.08),transparent)]"
        aria-hidden
      />
      <div className="relative p-5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-slate-800/90 to-slate-950/90 text-lg font-bold tracking-tight text-cyan-100 shadow-inner ring-1 ring-cyan-500/20 sm:h-16 sm:w-16 sm:text-xl"
              aria-hidden
            >
              {mono}
            </div>
            <div className="min-w-0 space-y-2">
              {singleLine ? (
                <h1 className="font-mono text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {flight.flightNumber}
                </h1>
              ) : (
                <h1 className="flex flex-wrap items-baseline gap-2 font-mono text-3xl font-black tracking-tight text-white sm:text-4xl">
                  <span>{code}</span>
                  <span>{digits}</span>
                </h1>
              )}
              {flight.airlineName ? (
                <p className="text-sm text-gray-400 sm:text-base">
                  {flight.airlineName}
                </p>
              ) : null}
              <p className="font-mono text-xl font-bold tracking-[0.2em] text-white sm:text-2xl">
                <span className="text-cyan-200/95">{depCode}</span>
                <span className="mx-2 text-gray-600">→</span>
                <span className="text-cyan-200/95">{arrCode}</span>
              </p>
              <p className="text-xs text-gray-500 sm:text-sm">
                <span className="text-gray-400">{depName}</span>
                <span className="mx-1.5 text-gray-600">·</span>
                <span className="text-gray-400">{arrName}</span>
              </p>
              {flight.status ? (
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold sm:text-sm ${toneClassesFromFlightDetail(
                    flight.statusTone
                  )}`}
                >
                  {flight.status}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {cell("Scheduled departure", schedDep)}
          {cell("Estimated departure", estDep ?? schedDep)}
          {cell("Scheduled arrival", schedArr)}
          {cell("Estimated arrival", estArr ?? schedArr)}
          {cell("Departure gate", depGate)}
          {cell("Departure terminal", depTerminal)}
          {cell("Arrival gate", arrGate)}
          {cell("Arrival terminal", arrTerminal)}
          <div className="col-span-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 sm:col-span-3 lg:col-span-4 sm:px-4 sm:py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Aircraft type
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-white sm:text-base">
              {flight.aircraftType?.trim()
                ? flight.aircraftType
                : DISPLAY_DASH}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link
            href={`/share/${encodeURIComponent(flight.flightNumber)}`}
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-2xl border border-amber-500/35 bg-amber-500/10 px-3 text-center text-xs font-semibold text-amber-100 transition hover:bg-amber-500/15 sm:text-sm"
          >
            Share with family
          </Link>
          <FlightSaveBookmark
            payload={payload}
            className="min-h-[2.75rem] w-full justify-center rounded-2xl border border-white/12 bg-white/[0.07] px-3 text-xs font-semibold sm:text-sm"
          />
          <TrackFlightButton
            flightNumber={flight.flightNumber}
            onOpenPrefs={onOpenPrefs}
            className="min-h-[2.75rem] w-full justify-center rounded-2xl border border-white/12 bg-white/[0.07] px-3 text-xs font-semibold sm:text-sm"
          />
          <button
            type="button"
            onClick={onShare}
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-2xl border border-blue-500/35 bg-blue-500/10 px-3 text-xs font-semibold text-blue-100 transition hover:bg-blue-500/15 sm:text-sm"
          >
            {shareLabel}
          </button>
        </div>

        <button
          type="button"
          onClick={onUnlockRouteHistory}
          className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/15 to-cyan-500/10 px-4 py-3 text-left transition hover:border-violet-400/45 hover:from-violet-500/20 sm:py-3.5"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-200/90">
              RouteWings Pro
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              Unlock full route history
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Past legs, aircraft rotation, and delay patterns
            </p>
          </div>
          <span
            className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15"
            aria-hidden
          >
            →
          </span>
        </button>
      </div>
    </motion.section>
  );
}
