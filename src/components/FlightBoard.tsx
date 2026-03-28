"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import EmptyState from "./EmptyState";
import FlightCardLiveRow from "./FlightCardLiveRow";
import { FlightBoardSkeleton } from "./skeletons/LoadingSkeletons";
import { displayFlightTrackContext } from "../lib/flightCardLink";
import type { DisplayFlight } from "../lib/formatFlights";

type Props = {
  flights: DisplayFlight[];
  mode: "departure" | "arrival";
  loading?: boolean;
  airportLine: string;
  localTime: string;
  timeZoneAbbrev: string;
  dateLine: string;
  isLive: boolean;
  searchedAirportCode: string;
  airportTimeZone: string;
};

const COL_GRID =
  "grid grid-cols-[2.85rem_3.6rem_minmax(0,1.45fr)_1.85rem_2.85rem_minmax(4.25rem,1fr)_2.65rem] items-stretch gap-x-1 gap-y-1 px-1.5 sm:grid-cols-[3.25rem_4rem_minmax(0,1.55fr)_2.1rem_3.1rem_minmax(5rem,1fr)_2.75rem] sm:px-2 md:grid-cols-[4.75rem_5.75rem_minmax(0,2.35fr)_3.25rem_4.25rem_minmax(7rem,1.1fr)_3rem] md:gap-x-2 md:gap-y-2 md:px-4";

const FLAP_BODY =
  "flex w-full min-w-0 items-center justify-center overflow-hidden rounded-md border border-amber-500/15 bg-black/45 px-1 py-1 text-center text-[9px] text-amber-100/95 transition-all duration-200 [transform-style:preserve-3d] md:px-3 md:py-2 md:text-sm";

const FLAP_HEADER =
  "flex w-full min-w-0 items-center justify-center overflow-hidden rounded-md border border-amber-500/15 bg-black/45 px-1 py-1 text-center text-[7px] font-bold uppercase tracking-[0.18em] text-amber-400/95 transition-all duration-200 md:px-3 md:py-2 md:text-[11px] md:tracking-[0.32em]";

function FlapCell({
  children,
  align = "center",
  variant = "body",
  className = "",
}: {
  children: ReactNode;
  align?: "center" | "right" | "left";
  variant?: "header" | "body";
  className?: string;
}) {
  const justify =
    align === "right"
      ? "justify-end text-right"
      : align === "left"
        ? "justify-start text-left"
        : "justify-center text-center";
  const base = variant === "header" ? FLAP_HEADER : FLAP_BODY;
  return (
    <div className={`flex items-stretch ${justify}`}>
      <span className={`${base} ${justify} ${className}`.trim()}>
        {children}
      </span>
    </div>
  );
}

/** Brief split-flap motion when the displayed value changes. */
function FlapValue({
  valueKey,
  children,
  className = "",
}: {
  valueKey: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      key={valueKey}
      initial={{ opacity: 0.2, rotateX: -55 }}
      animate={{ opacity: 1, rotateX: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`inline-block ${className}`.trim()}
      style={{ transformOrigin: "center center" }}
    >
      {children}
    </motion.span>
  );
}

function boardStatusClass(statusLabel: string): string {
  const raw = statusLabel.trim();
  if (!raw) return "text-gray-500";
  const key = raw.toLowerCase();
  if (key.includes("cancel")) return "text-red-400";
  if (key.includes("delay")) return "text-yellow-300";
  if (
    key.includes("depart") ||
    key.includes("arriv") ||
    key.includes("land") ||
    key.includes("enroute") ||
    key.includes("approach")
  ) {
    return "text-green-400";
  }
  if (key === "unknown") return "text-gray-500";
  if (
    key.includes("schedul") ||
    key.includes("board") ||
    key.includes("check") ||
    key.includes("gateclosed")
  ) {
    return "text-amber-300";
  }
  return "text-amber-300";
}

function boardCell(value: string, missing: boolean): string {
  const t = value.trim();
  if (missing || value === "-" || t === "\u2014" || !t) return "--";
  return value.toUpperCase();
}

function BoardFooter() {
  return (
    <footer className="mt-4 border-t border-amber-500/10 px-4 pb-4 pt-5 text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.2em] text-amber-500/45 sm:text-[10px] sm:tracking-[0.25em]">
      <p>DATA REFRESHES EVERY 5 MINUTES</p>
      <p className="mt-1.5">LOCAL AIRPORT TIME</p>
    </footer>
  );
}

export default function FlightBoard({
  flights,
  mode,
  loading = false,
  airportLine,
  localTime,
  timeZoneAbbrev,
  dateLine,
  isLive,
  searchedAirportCode,
  airportTimeZone,
}: Props) {
  const router = useRouter();
  const boardKind =
    mode === "departure" ? "DEPARTURES BOARD" : "ARRIVALS BOARD";
  const zoneSuffix = timeZoneAbbrev.trim()
    ? ` ${timeZoneAbbrev.trim()}`
    : "";

  return (
    <div className="mx-auto w-full max-w-5xl px-0 shadow-[0_0_48px_rgba(245,158,11,0.06)]">
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-[#0b0b0b] py-4 shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)] md:py-6">
        {isLive ? (
          <div className="absolute right-2 top-2 z-10 flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-widest text-emerald-400 md:right-4 md:top-4 md:gap-1.5 md:text-xs">
            <span
              className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
              aria-hidden
            />
            <span>LIVE</span>
          </div>
        ) : null}

        <header className="relative z-0 mb-4 space-y-1.5 px-3 pt-1 text-center font-mono uppercase text-amber-200 md:mb-5 md:space-y-2 md:px-4 md:pt-2">
          <p className="text-sm font-black leading-snug tracking-[0.22em] text-amber-200 sm:text-base md:text-xl md:tracking-[0.38em]">
            {airportLine}
          </p>
          <p className="text-[9px] font-semibold tracking-[0.22em] text-amber-400/90 md:text-xs md:tracking-[0.3em]">
            {boardKind}
          </p>
          {dateLine ? (
            <p className="text-[9px] tracking-[0.2em] text-amber-500/55 md:text-xs md:tracking-[0.3em]">
              {dateLine}
            </p>
          ) : null}
          <p className="text-[10px] tracking-[0.25em] text-amber-200 md:text-sm md:tracking-[0.3em]">
            LOCAL TIME {localTime}
            {zoneSuffix}
          </p>
        </header>

        {loading && flights.length === 0 ? (
          <>
            <FlightBoardSkeleton rows={6} embedded />
            <BoardFooter />
          </>
        ) : flights.length === 0 ? (
          <>
            <div className="mx-auto max-w-md px-3 py-6">
              <EmptyState
                icon={<span aria-hidden>📋</span>}
                title="No flights on this board"
                description="Try another airport or switch between departures and arrivals."
                className="border-amber-500/15 bg-black/30 text-amber-100/90"
              />
            </div>
            <BoardFooter />
          </>
        ) : (
          <>
            <div
              className="max-h-[min(64vh,580px)] overflow-auto overscroll-x-contain scroll-smooth [-webkit-overflow-scrolling:touch]"
              style={{ touchAction: "pan-x pan-y" }}
              role="region"
              aria-label={`${boardKind} table`}
            >
              <div className="min-w-[26.5rem] sm:min-w-[28rem] md:min-w-[36rem]">
                <div
                  className={`${COL_GRID} sticky top-0 z-20 border-b border-amber-500/20 bg-[#0b0b0b]/95 pb-2 pt-1 backdrop-blur-md supports-[backdrop-filter]:bg-[#0b0b0b]/88`}
                >
                  <FlapCell variant="header">TIME</FlapCell>
                  <FlapCell variant="header">FLIGHT</FlapCell>
                  <FlapCell variant="header">CITY</FlapCell>
                  <FlapCell variant="header">GATE</FlapCell>
                  <FlapCell
                    variant="header"
                    className="text-[7px] tracking-[0.12em] md:text-[10px] md:tracking-[0.3em]"
                  >
                    TERMINAL
                  </FlapCell>
                  <FlapCell variant="header" align="right">
                    STATUS
                  </FlapCell>
                  <div className="flex items-center justify-center">
                    <span className="rounded-md border border-amber-500/15 bg-black/45 px-1 py-1 text-center text-[6px] font-bold uppercase tracking-[0.12em] text-amber-400/95 md:px-2 md:py-2 md:text-[9px] md:tracking-[0.2em]">
                      Live
                    </span>
                  </div>
                </div>

                <div className="perspective-[1000px] px-0 pb-2 pt-1.5 md:pt-3">
                  <div
                    className={`space-y-1.5 pr-1 md:space-y-2.5 ${loading ? "opacity-60" : ""}`}
                  >
                    {flights.map((f, index) => {
                      const gate = boardCell(f.gate, f.gateMissing);
                      const terminal = boardCell(
                        f.terminal,
                        f.terminalMissing
                      );
                      const statusCls = boardStatusClass(f.statusLabel || "");
                      const city = (f.destinationCity || "-").toUpperCase();
                      const statusText = (f.statusLabel || "UNKNOWN").toUpperCase();
                      const trackCtx = displayFlightTrackContext(
                        f,
                        searchedAirportCode,
                        airportTimeZone
                      );

                      return (
                        <motion.div
                          key={f.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Open flight ${f.number} to ${city}`}
                          initial={{ opacity: 0, rotateX: -90, y: -6 }}
                          animate={{ opacity: 1, rotateX: 0, y: 0 }}
                          transition={{
                            duration: 0.28,
                            delay: index * 0.055,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          whileHover={{
                            scale: 1.012,
                            backgroundColor: "rgba(59, 130, 246, 0.08)",
                            boxShadow:
                              "0 8px 28px rgba(0,0,0,0.32), 0 0 24px rgba(59,130,246,0.12)",
                          }}
                          whileTap={{ scale: 0.992 }}
                          style={{ transformOrigin: "center top" }}
                          className={`${COL_GRID} cursor-pointer rounded-lg border-b border-white/[0.06] py-1.5 font-mono text-[9px] uppercase tracking-wide text-amber-200 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0b] md:py-3.5 md:text-sm md:tracking-wider`}
                          onClick={() => {
                            router.push(trackCtx.trackHref);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(trackCtx.trackHref);
                            }
                          }}
                        >
                          <FlapCell className="tabular-nums normal-case">
                            <FlapValue valueKey={`${f.id}-t-${f.time}`}>
                              {f.time}
                            </FlapValue>
                          </FlapCell>
                          <FlapCell className="font-semibold">
                            <FlapValue valueKey={`${f.id}-n-${f.number}`}>
                              {f.number.toUpperCase()}
                            </FlapValue>
                          </FlapCell>
                          <FlapCell className="font-semibold text-amber-100">
                            <FlapValue valueKey={`${f.id}-c-${city}`}>
                              <span className="line-clamp-2">{city}</span>
                            </FlapValue>
                          </FlapCell>
                          <FlapCell className="tabular-nums">
                            <FlapValue valueKey={`${f.id}-g-${gate}`}>
                              {gate}
                            </FlapValue>
                          </FlapCell>
                          <FlapCell className="tabular-nums">
                            <FlapValue valueKey={`${f.id}-term-${terminal}`}>
                              {terminal}
                            </FlapValue>
                          </FlapCell>
                          <FlapCell
                            align="right"
                            className={`text-[0.55rem] font-semibold normal-case tracking-normal sm:text-[0.6rem] md:text-xs ${statusCls}`}
                          >
                            <FlapValue
                              valueKey={`${f.id}-s-${f.statusLabel}-${gate}`}
                            >
                              {statusText}
                            </FlapValue>
                          </FlapCell>
                          <div className="flex items-center justify-center py-0.5">
                            <FlightCardLiveRow
                              compact
                              trackHref={trackCtx.trackHref}
                              flightNumber={f.number}
                              originLabel={trackCtx.originLabel}
                              destLabel={trackCtx.destLabel}
                              estimatedArrivalHm={trackCtx.estimatedArrivalHm}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <BoardFooter />
          </>
        )}
      </div>
    </div>
  );
}
