"use client";

import { Fragment, useMemo } from "react";

import SectionHeader from "../SectionHeader";
import type {
  AircraftHistoryDayGroup,
  AircraftHistoryItem,
  FlightDetail,
} from "../../lib/flightDetailsTypes";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

const GROUP_ORDER: AircraftHistoryDayGroup[] = ["today", "yesterday", "earlier"];
const GROUP_LABEL: Record<AircraftHistoryDayGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  earlier: "Earlier",
};

function groupHistoryItems(items: AircraftHistoryItem[]) {
  const map = new Map<AircraftHistoryDayGroup, AircraftHistoryItem[]>();
  const ungrouped: AircraftHistoryItem[] = [];
  for (const h of items) {
    const g = h.dayGroup;
    if (!g) {
      ungrouped.push(h);
      continue;
    }
    const list = map.get(g) ?? [];
    list.push(h);
    map.set(g, list);
  }
  return { map, ungrouped };
}

type Props = { detail: FlightDetail };

export default function AircraftActivitySection({ detail }: Props) {
  const tt = detail.aircraftTailTracking;
  const tail = detail.tailNumber?.trim();
  const acType = detail.aircraftType?.trim();

  const { sections, hasTimeline } = useMemo(() => {
    const items = detail.history ?? [];
    const { map, ungrouped } = groupHistoryItems(items);
    const ordered: { label: string; rows: AircraftHistoryItem[] }[] = [];
    for (const g of GROUP_ORDER) {
      const rows = map.get(g);
      if (rows?.length) {
        ordered.push({ label: GROUP_LABEL[g], rows });
      }
    }
    if (ungrouped.length > 0) {
      ordered.push({ label: "Recent", rows: ungrouped });
    }
    return { sections: ordered, hasTimeline: ordered.length > 0 };
  }, [detail.history]);

  if (!tail && !hasTimeline && !tt) {
    return null;
  }

  const stats = tt?.usageStats;
  const route = tt?.routeMapAirports ?? [];
  const legStart = tt?.activeRouteLegStartIndex;

  return (
    <section className={glassCard("p-6 sm:p-8")}>
      <SectionHeader
        title="Aircraft history"
        subtitle="Tail, position, and recent legs when available."
        className="mb-1"
      />

      {tail || acType ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
          {tail ? (
            <p className="font-mono text-sm text-gray-400">
              Aircraft:{" "}
              <span className="text-lg font-bold tracking-wide text-white">
                {tail}
              </span>
            </p>
          ) : null}
          {acType ? (
            <p className="mt-1 text-sm font-medium text-gray-300">{acType}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-500">
          Tail / registration not available for this flight.
        </p>
      )}

      {tt?.currentLocationLine ? (
        <div className="mt-5 rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.06] px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200/70">
            Current position
          </p>
          <p className="mt-2 text-base font-medium leading-snug text-white">
            {tt.currentLocationLine}
          </p>
        </div>
      ) : null}

      {tt?.inboundWarning ? (
        <div
          className="mt-5 rounded-2xl border border-amber-500/35 bg-amber-500/[0.08] px-4 py-4"
          role="status"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">
            Inbound aircraft
          </p>
          <p className="mt-2 text-sm leading-relaxed text-amber-50/95">
            {tt.inboundWarning.message}
          </p>
          {tt.inboundWarning.estimatedReadiness ? (
            <p className="mt-3 font-mono text-sm text-amber-200/90">
              Estimated readiness in {tt.inboundWarning.estimatedReadiness}.
            </p>
          ) : null}
        </div>
      ) : null}

      {stats &&
      (stats.flightsToday != null ||
        stats.airportsVisitedToday != null ||
        stats.totalFlightTimeToday ||
        stats.longestRouteToday) ? (
        <div className="mt-6">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Usage today (same aircraft)
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {stats.flightsToday != null ? (
              <div className="rounded-2xl border border-white/8 bg-black/30 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Flights today
                </p>
                <p className="mt-1 font-mono text-xl font-bold text-white">
                  {stats.flightsToday}
                </p>
              </div>
            ) : null}
            {stats.airportsVisitedToday != null ? (
              <div className="rounded-2xl border border-white/8 bg-black/30 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Airports visited today
                </p>
                <p className="mt-1 font-mono text-xl font-bold text-white">
                  {stats.airportsVisitedToday}
                </p>
              </div>
            ) : null}
            {stats.totalFlightTimeToday ? (
              <div className="rounded-2xl border border-white/8 bg-black/30 px-3 py-3 sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Total flight time today
                </p>
                <p className="mt-1 font-mono text-lg font-semibold text-amber-200/90">
                  {stats.totalFlightTimeToday}
                </p>
              </div>
            ) : null}
            {stats.longestRouteToday ? (
              <div className="rounded-2xl border border-white/8 bg-black/30 px-3 py-3 sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Longest route today
                </p>
                <p className="mt-1 font-mono text-base font-semibold text-gray-100">
                  {stats.longestRouteToday}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {route.length >= 2 ? (
        <div className="mt-6">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Today&apos;s route
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-2 rounded-2xl border border-white/8 bg-black/25 px-3 py-4 font-mono text-sm sm:px-4">
            {route.map((code, i) => {
              const inActiveLeg =
                legStart != null &&
                (i === legStart || i === legStart + 1);
              const arrowActive =
                legStart != null && i > 0 && i - 1 === legStart;
              return (
                <Fragment key={`${code}-${i}`}>
                  {i > 0 ? (
                    <span
                      className={
                        arrowActive
                          ? "mx-0.5 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
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
                        ? "rounded-lg bg-cyan-500/20 px-2 py-1 font-bold text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/40"
                        : "rounded-lg px-2 py-1 text-gray-400"
                    }
                  >
                    {code}
                  </span>
                </Fragment>
              );
            })}
          </div>
        </div>
      ) : null}

      {tt?.previousFlight ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Previous flight
          </p>
          <p className="mt-2 font-mono text-lg font-bold text-white">
            {tt.previousFlight.flightNumber}
          </p>
          <p className="mt-1 font-mono text-sm text-gray-300">
            {tt.previousFlight.from}{" "}
            <span className="text-gray-600">→</span> {tt.previousFlight.to}
          </p>
          {tt.previousFlight.landedAgo ? (
            <p className="mt-2 text-sm text-emerald-200/85">
              Landed {tt.previousFlight.landedAgo}
            </p>
          ) : null}
        </div>
      ) : null}

      {tt?.turnaround ? (
        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Turnaround
          </h3>
          {tt.turnaround.narrativeLine ? (
            <p className="text-sm leading-relaxed text-gray-200">
              {tt.turnaround.narrativeLine}
            </p>
          ) : null}
          {tt.turnaround.groundTimeBeforeNextDeparture ? (
            <p className="text-sm text-gray-300">
              Ground time before next departure:{" "}
              <span className="font-mono font-semibold text-amber-200/90">
                {tt.turnaround.groundTimeBeforeNextDeparture}
              </span>
            </p>
          ) : null}
          {tt.turnaround.lateInboundMessage ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200/95">
              {tt.turnaround.lateInboundMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      {hasTimeline ? (
        <div className="mt-8">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Same aircraft — recent legs
          </h3>
          <div className="mt-5 space-y-10">
            {sections.map(({ label, rows }) => (
              <div key={label}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  {label}
                </p>
                <ul className="relative space-y-0 pl-1">
                  {rows.map((h, idx) => {
                    const delayed = h.delayed === true;
                    const current = h.isCurrent === true;
                    const timeLead = h.departureTime
                      ? `${h.departureTime} `
                      : "";
                    const showOnTime =
                      h.onTime === true && h.delayed !== true;
                    const isLast = idx === rows.length - 1;
                    return (
                      <li
                        key={`${h.flightNumber}-${h.from}-${h.to}-${label}-${idx}`}
                        className="relative flex gap-0 pb-8 last:pb-0"
                      >
                        <div className="relative mr-4 flex w-5 shrink-0 flex-col items-center">
                          <span
                            className={`relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 ${
                              current
                                ? "border-cyan-300 bg-cyan-500/40 shadow-[0_0_14px_rgba(34,211,238,0.65)]"
                                : delayed
                                  ? "border-red-400/80 bg-red-500/30"
                                  : "border-white/35 bg-gray-900"
                            }`}
                            aria-hidden
                          />
                          {!isLast ? (
                            <span
                              className="absolute left-1/2 top-[1.125rem] bottom-[-0.5rem] w-px -translate-x-1/2 bg-gradient-to-b from-white/25 to-white/10"
                              aria-hidden
                            />
                          ) : null}
                        </div>
                        <div
                          className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 ${
                            current
                              ? "border-cyan-400/40 bg-cyan-500/[0.07] shadow-[0_0_24px_rgba(34,211,238,0.12)]"
                              : delayed
                                ? "border-red-500/25 bg-red-500/[0.04]"
                                : "border-white/8 bg-black/20"
                          }`}
                        >
                          <p
                            className={`font-mono text-base font-semibold tracking-wide ${
                              delayed ? "text-red-100" : "text-white"
                            }`}
                          >
                            <span
                              className={
                                delayed
                                  ? "text-red-300/90"
                                  : "text-cyan-200/90"
                              }
                            >
                              {timeLead}
                            </span>
                            <span className={delayed ? "text-red-50" : ""}>
                              {h.from}
                            </span>
                            <span className="mx-2 text-gray-600">→</span>
                            <span className={delayed ? "text-red-50" : ""}>
                              {h.to}
                            </span>
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-gray-500">
                              {h.flightNumber}
                            </span>
                            {current ? (
                              <span className="rounded-md bg-cyan-500/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-100 ring-1 ring-cyan-400/35">
                                This flight
                              </span>
                            ) : null}
                            {h.status ? (
                              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-300 ring-1 ring-white/15">
                                {h.status}
                              </span>
                            ) : null}
                            {delayed ? (
                              <span className="rounded-md bg-red-500/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-200 ring-1 ring-red-500/40">
                                Delayed
                              </span>
                            ) : showOnTime ? (
                              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200 ring-1 ring-emerald-500/30">
                                On time
                              </span>
                            ) : null}
                          </div>
                          {h.departureTime && h.arrivalTime ? (
                            <p className="mt-1.5 font-mono text-xs text-gray-500">
                              Block {h.departureTime} – {h.arrivalTime} local
                            </p>
                          ) : null}
                          {h.turnaroundFromPrevMinutes != null && idx > 0 ? (
                            <p className="mt-2 text-xs text-gray-500">
                              Ground after previous leg:{" "}
                              <span className="font-mono text-gray-400">
                                {h.turnaroundFromPrevMinutes} min
                              </span>
                            </p>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-gray-500">
          No recent legs recorded for this tail in the app.
        </p>
      )}
    </section>
  );
}
