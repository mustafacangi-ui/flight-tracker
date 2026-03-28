"use client";

import type { FlightDetail } from "../../lib/flightDetailsTypes";
import { toneClassesFromFlightDetail } from "../../lib/flightDetailViewModel";
import {
  estimatedArrivalDisplay,
  familyCityLine,
  familyModeHeroLine,
  familyRouteCodes,
  familyShareMinutesRemaining,
  familyShareStatusLine,
  formatFamilyFlightTitle,
} from "../../lib/familyShareView";
import PremiumBadge from "../PremiumBadge";

function card(familyMode: boolean, familyAccent: boolean) {
  const pad = familyMode ? "p-8 sm:p-10" : "p-6 sm:p-8";
  const border = familyAccent
    ? "border-rose-500/20 bg-rose-500/[0.06]"
    : "border-white/[0.08] bg-white/[0.04]";
  return `rounded-3xl border ${border} ${pad} shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-md`;
}

type Props = {
  detail: FlightDetail;
  familyMode: boolean;
  onToggleFamilyMode: () => void;
};

export default function FamilyFlightHeader({
  detail,
  familyMode,
  onToggleFamilyMode,
}: Props) {
  const { dep, arr } = familyRouteCodes(detail);
  const minutes = familyShareMinutesRemaining(detail);
  const heroLine = familyModeHeroLine(detail, minutes);
  const { status } = familyShareStatusLine(detail);
  const arrDisplay = estimatedArrivalDisplay(detail);
  const depTime = detail.estimatedDepartureTime ?? detail.departureTime ?? "—";

  const t = familyMode ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl";
  const body = familyMode
    ? "text-lg sm:text-xl leading-relaxed"
    : "text-base sm:text-lg";
  const small = familyMode ? "text-base sm:text-lg" : "text-sm sm:text-base";

  return (
    <>
      <div className="flex items-center justify-end gap-3">
        {familyMode ? <PremiumBadge variant="pro" /> : null}
        <span
          className={`text-white/50 ${familyMode ? "text-base" : "text-xs"}`}
        >
          Family mode
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={familyMode}
          aria-label={
            familyMode ? "Turn off family-friendly display" : "Turn on family-friendly display"
          }
          onClick={onToggleFamilyMode}
          className={`relative h-9 w-16 rounded-full border border-white/15 outline-none transition focus-visible:ring-2 focus-visible:ring-rose-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0c0f] ${
            familyMode ? "bg-rose-500/40" : "bg-white/10"
          }`}
        >
          <span
            className={`absolute top-1 left-1 h-7 w-7 rounded-full bg-white shadow-md transition-transform ${
              familyMode ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <header className={card(familyMode, familyMode)}>
        {familyMode ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-200/75">
              For family
            </p>
            <p className={`mt-5 font-medium leading-snug text-white ${t}`}>
              {heroLine}
            </p>
          </>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-200/70">
            Shared live tracking
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <h1
            className={`font-mono font-black tracking-tight text-white ${
              familyMode ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"
            }`}
          >
            {formatFamilyFlightTitle(detail.flightNumber)}
          </h1>
          {detail.status ? (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${toneClassesFromFlightDetail(
                detail.statusTone
              )}`}
            >
              {detail.status}
            </span>
          ) : null}
        </div>

        {detail.airlineName ? (
          <p
            className={`mt-3 text-gray-300 ${familyMode ? "text-2xl" : "text-xl"}`}
          >
            {detail.airlineName}
          </p>
        ) : null}

        <p
          className={`mt-5 font-medium leading-snug text-white/95 ${
            familyMode ? "text-2xl sm:text-3xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {dep} → {arr}
        </p>
        <p className={`mt-2 text-gray-400 ${small}`}>{familyCityLine(detail)}</p>

        <div className="mt-8 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Departure time
            </p>
            <p
              className={`mt-1 font-mono text-amber-200/90 ${familyMode ? "text-2xl" : "text-lg"}`}
            >
              {depTime}{" "}
              <span className="text-sm font-normal text-gray-500">local</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Arrival time
            </p>
            <p
              className={`mt-1 font-mono text-amber-200/90 ${familyMode ? "text-2xl" : "text-lg"}`}
            >
              {arrDisplay}{" "}
              <span className="text-sm font-normal text-gray-500">local</span>
            </p>
          </div>
        </div>

        {!familyMode ? (
          <div className="mt-6 border-t border-white/10 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
              Status
            </p>
            <p className="mt-2 text-xl font-semibold text-emerald-200/95 sm:text-2xl">
              {status}
            </p>
          </div>
        ) : (
          <div className="mt-6 border-t border-white/10 pt-6">
            <p className={`text-emerald-200/90 ${body}`}>{status}</p>
          </div>
        )}
      </header>
    </>
  );
}
