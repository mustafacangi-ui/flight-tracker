"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import EmptyState from "./EmptyState";
import NotificationPrefsModal from "./NotificationPrefsModal";
import NotificationBadge from "./NotificationBadge";
import FlightSaveBookmark from "./FlightSaveBookmark";
import TrackFlightButton from "./TrackFlightButton";
import { FlightCardSkeletonList } from "./skeletons/LoadingSkeletons";
import { flightCountdownPillText } from "../lib/flightCountdown";
import { statusVisualBadgeClasses } from "../lib/flightStatusVisual";
import {
  MISSING_FIELD_TOOLTIP,
  type DisplayFlight,
} from "../lib/formatFlights";
import type { SavedFlight } from "../lib/quickAccessStorage";
import { savedFlightPayloadFromDisplay } from "../lib/savedFlightPayload";
import { useFlightTracking } from "../hooks/useFlightTracking";

type Props = {
  flights: DisplayFlight[];
  loading?: boolean;
  /** IATA/ICAO of the airport the user searched (hub). */
  searchedAirportCode: string;
  /** IANA timezone for countdown pills. */
  airportTimeZone: string;
};

function splitFlightNumber(raw: string): {
  code: string;
  digits: string;
  singleLine: boolean;
} {
  const t = raw.trim().toUpperCase();
  const spaced = t.match(/^([A-Z]{1,3})\s+(\d[\dA-Z]*)$/);
  if (spaced) {
    return { code: spaced[1], digits: spaced[2], singleLine: false };
  }
  const joined = t.match(/^([A-Z]{1,3})(\d[\dA-Z]*)$/);
  if (joined) {
    return { code: joined[1], digits: joined[2], singleLine: false };
  }
  return { code: "", digits: t, singleLine: true };
}

export default function FlightList({
  flights,
  loading = false,
  searchedAirportCode,
  airportTimeZone,
}: Props) {
  const router = useRouter();
  const { isFlightTracked } = useFlightTracking();
  const [prefsFor, setPrefsFor] = useState<string | null>(null);

  if (loading && flights.length === 0) {
    return <FlightCardSkeletonList count={4} />;
  }

  if (!loading && flights.length === 0) {
    return (
      <EmptyState
        icon={<span aria-hidden>🛫</span>}
        title="No flights to show"
        description="Switch airport, mode, or refresh — the board may be empty at this time."
      />
    );
  }

  const labelCls =
    "text-[10px] uppercase tracking-wider text-gray-500 md:text-[11px]";
  const valueCls =
    "text-sm font-semibold text-gray-100 md:text-base";

  const cardCls =
    "relative z-0 cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] p-4 pr-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md transition-[border-color,background-color,box-shadow,transform] duration-300 hover:z-[1] hover:-translate-y-0.5 hover:border-blue-500/50 hover:bg-white/[0.07] hover:shadow-[0_20px_56px_rgba(59,130,246,0.14),0_0_0_1px_rgba(59,130,246,0.08)] md:rounded-3xl md:p-6 md:pr-6";

  const listVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.055, delayChildren: 0.04 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  const goToFlight = (number: string) => {
    router.push(`/flight/${encodeURIComponent(number)}`);
  };

  const notificationPillForFlight = (f: DisplayFlight) => {
    const raw = `${f.statusRaw ?? ""} ${f.statusLabel ?? ""}`;
    const delayMin = raw.match(/(\d+)\s*(?:min|minutes?)/i)?.[1];
    switch (f.statusVisual) {
      case "boarding":
        if (/final/i.test(raw)) {
          return (
            <NotificationBadge label="Final call" variant="finalCall" />
          );
        }
        return <NotificationBadge label="Boarding" variant="boarding" />;
      case "delayed":
        return (
          <NotificationBadge
            label={delayMin ? `Delayed +${delayMin}m` : "Delayed"}
            variant="delayed"
          />
        );
      case "gate_changed":
        return <NotificationBadge label="Gate changed" variant="gate" />;
      case "landed":
        return <NotificationBadge label="Landed" variant="landed" />;
      default:
        return null;
    }
  };

  const payloadFor = (f: DisplayFlight): SavedFlight =>
    savedFlightPayloadFromDisplay(f, searchedAirportCode);

  return (
    <motion.ul
      className={`flex flex-col space-y-3 md:space-y-5 ${loading ? "opacity-70" : ""}`}
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      {flights.map((f) => {
        const { code, digits, singleLine } = splitFlightNumber(f.number);
        const city = f.destinationCity || "-";
        const isDep = f.direction === "departure";
        const tracked = isFlightTracked(f.number);
        const countdown = flightCountdownPillText(f, airportTimeZone);
        const notifyPill = notificationPillForFlight(f);

        return (
          <motion.li
            key={f.id}
            className="relative"
            variants={itemVariants}
            layout
          >
            <motion.article
              role="button"
              tabIndex={0}
              className={cardCls}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.996 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              onClick={() => goToFlight(f.number)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goToFlight(f.number);
                }
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 md:gap-4">
                <div className="min-w-0 flex-1 space-y-2 md:space-y-3">
                  <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
                    <span
                      className="select-none text-lg text-white/85 md:text-xl"
                      aria-hidden
                    >
                      ✈
                    </span>
                    {singleLine ? (
                      <p className="font-mono text-3xl font-black tracking-wide text-white md:text-4xl">
                        {f.number}
                      </p>
                    ) : (
                      <p className="flex flex-wrap items-baseline gap-2 font-mono text-3xl font-black tracking-wide text-white md:gap-4 md:text-4xl">
                        <span className="text-white">{code}</span>
                        <span className="text-white">{digits}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-gray-100 md:text-xl">
                      <span className="mr-2 text-gray-400" aria-hidden>
                        {isDep ? "→" : "←"}
                      </span>
                      {city}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-gray-500 md:mt-1 md:text-xs md:tracking-[0.25em]">
                      {isDep ? "Departure" : "Arrival"}
                    </p>
                  </div>
                </div>

                <div className="flex w-full min-w-0 max-w-full flex-[1_1_100%] flex-col items-stretch gap-1.5 text-right sm:max-w-[min(100%,18rem)] sm:flex-[0_1_auto] sm:items-end">
                  <div className="flex items-center justify-end gap-1.5">
                    <TrackFlightButton
                      flightNumber={f.number}
                      onOpenPrefs={() => setPrefsFor(f.number)}
                    />
                    {tracked ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPrefsFor(f.number);
                        }}
                        className="rounded-lg border border-white/10 bg-white/[0.06] p-2 text-amber-200/90 transition hover:bg-white/[0.1]"
                        aria-label="Tracking preferences"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden
                        >
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </button>
                    ) : null}
                    <FlightSaveBookmark payload={payloadFor(f)} />
                  </div>

                  {f.airlineName ? (
                    <p className="break-words text-xs font-medium leading-snug text-gray-300 md:text-sm">
                      {f.airlineName}
                    </p>
                  ) : null}

                  {notifyPill ? (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {notifyPill}
                    </div>
                  ) : null}

                  <span
                    className={`inline-flex self-end rounded-full px-3 py-1 text-xs font-semibold md:px-4 md:py-1.5 md:text-sm ${statusVisualBadgeClasses(
                      f.statusVisual
                    )}`}
                  >
                    {f.statusLabel || "Scheduled"}
                  </span>

                  {countdown ? (
                    <span className="inline-flex self-end rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 font-mono text-[10px] text-gray-300 md:text-[11px]">
                      {countdown}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="my-3 border-t border-white/5 md:my-4" aria-hidden />

              <dl className="grid grid-cols-2 gap-3 min-[400px]:grid-cols-3 md:gap-6">
                <div className="flex min-h-[3.5rem] flex-col items-center justify-center text-center md:min-h-[4.25rem]">
                  <dt className={labelCls}>TIME</dt>
                  <dd className={`mt-2 font-mono ${valueCls}`}>
                    {f.timeMissing ? (
                      <span
                        title={MISSING_FIELD_TOOLTIP}
                        className="cursor-help"
                      >
                        {f.time}
                      </span>
                    ) : (
                      f.time
                    )}
                  </dd>
                </div>

                <div className="flex min-h-[3.5rem] flex-col items-center justify-center text-center md:min-h-[4.25rem]">
                  <dt className={labelCls}>GATE</dt>
                  <dd className={`mt-2 ${valueCls}`}>
                    {f.gateMissing ? (
                      <span
                        title={MISSING_FIELD_TOOLTIP}
                        className="cursor-help"
                      >
                        {f.gate}
                      </span>
                    ) : (
                      f.gate
                    )}
                  </dd>
                </div>

                <div className="col-span-2 flex min-h-[3.5rem] flex-col items-center justify-center text-center min-[400px]:col-span-1 md:min-h-[4.25rem]">
                  <dt className={labelCls}>TERMINAL</dt>
                  <dd className={`mt-2 ${valueCls}`}>
                    {f.terminalMissing ? (
                      <span
                        title={MISSING_FIELD_TOOLTIP}
                        className="cursor-help"
                      >
                        {f.terminal}
                      </span>
                    ) : (
                      f.terminal
                    )}
                  </dd>
                </div>
              </dl>
            </motion.article>
          </motion.li>
        );
      })}

      <NotificationPrefsModal
        flightNumber={prefsFor ?? ""}
        open={prefsFor != null}
        onClose={() => setPrefsFor(null)}
      />
    </motion.ul>
  );
}
