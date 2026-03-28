"use client";

import Link from "next/link";

import FlightSaveBookmark from "./FlightSaveBookmark";
import TrackFlightButton from "./TrackFlightButton";
import type { SavedFlight } from "../lib/quickAccessStorage";

type Props = {
  flightNumber: string;
  payload: SavedFlight;
  copied: boolean;
  onShare: () => void;
  onOpenPrefs: () => void;
  tracked: boolean;
};

const btnBase =
  "inline-flex min-h-[2.75rem] min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border border-white/12 bg-white/[0.07] px-2 py-2 text-[11px] font-semibold leading-tight text-white backdrop-blur-sm transition duration-200 hover:border-white/18 hover:bg-white/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-[0.98] sm:flex-none sm:px-3 sm:text-xs sm:leading-normal md:px-4";

export default function FlightDetailActionBar({
  flightNumber,
  payload,
  copied,
  onShare,
  onOpenPrefs,
  tracked,
}: Props) {
  const shareLabel = copied ? "Copied!" : "Share";

  return (
    <>
      {/* Desktop — top-right stack */}
      <div className="fixed right-4 top-20 z-[90] hidden w-[13.5rem] flex-col gap-2 rounded-3xl border border-white/10 bg-gray-950/92 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-md lg:flex">
            <FlightSaveBookmark
              payload={payload}
              className="w-full justify-center rounded-xl border border-white/12 bg-white/[0.06] py-2.5 text-xs font-semibold"
            />
            <TrackFlightButton
              flightNumber={flightNumber}
              onOpenPrefs={onOpenPrefs}
              className="w-full justify-center rounded-xl border border-white/12 py-2.5 text-xs font-semibold"
            />
            {tracked ? (
              <button
                type="button"
                onClick={onOpenPrefs}
                className="rounded-xl border border-white/10 bg-white/[0.04] py-2 text-[11px] font-medium text-amber-200/90 transition hover:bg-white/[0.08]"
              >
                Alert preferences
              </button>
            ) : null}
            <button
              type="button"
              onClick={onShare}
              className="rounded-xl border border-blue-500/35 bg-blue-500/10 py-2.5 text-xs font-semibold text-blue-100 transition hover:bg-blue-500/15"
            >
              {shareLabel}
            </button>
            <Link
              href={`/share/${encodeURIComponent(flightNumber)}`}
              className="rounded-xl border border-amber-500/35 bg-amber-500/10 py-2.5 text-center text-xs font-semibold text-amber-100 transition hover:bg-amber-500/15"
            >
              Share with family
            </Link>
      </div>

      {/* Mobile — sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-[90] border-t border-white/10 bg-gray-950/95 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden">
        <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-1.5">
          <FlightSaveBookmark
            payload={payload}
            className={`${btnBase} sm:min-w-0`}
          />
          <TrackFlightButton
            flightNumber={flightNumber}
            onOpenPrefs={onOpenPrefs}
            className={`${btnBase} sm:min-w-0`}
          />
          <button
            type="button"
            onClick={onShare}
            className={btnBase}
            aria-label={copied ? "Link copied" : "Copy or share flight link"}
          >
            {shareLabel}
          </button>
          <Link
            href={`/share/${encodeURIComponent(flightNumber)}`}
            className={btnBase}
            aria-label="Share flight with family"
          >
            Family share
          </Link>
        </div>
      </div>
    </>
  );
}
