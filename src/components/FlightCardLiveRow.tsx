"use client";

import Link from "next/link";
import { useCallback } from "react";

import {
  absoluteFlightCardUrl,
  familyShareWhatsAppUrl,
  type FlightCardSharePayload,
} from "../lib/flightCardLink";

type Props = {
  trackHref: string;
  flightNumber: string;
  originLabel: string;
  destLabel: string;
  estimatedArrivalHm: string;
  /** Dense board: icon-only controls */
  compact?: boolean;
  className?: string;
};

function PlaneIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

export default function FlightCardLiveRow({
  trackHref,
  flightNumber,
  originLabel,
  destLabel,
  estimatedArrivalHm,
  compact = false,
  className = "",
}: Props) {
  const openFamilyShare = useCallback(() => {
    if (typeof window === "undefined") return;
    const cardAbsoluteUrl = absoluteFlightCardUrl(
      window.location.origin,
      trackHref
    );
    const payload: FlightCardSharePayload = {
      flightNumber,
      originLabel,
      destLabel,
      estimatedArrivalHm,
      cardAbsoluteUrl,
    };
    window.open(familyShareWhatsAppUrl(payload), "_blank", "noopener,noreferrer");
  }, [
    trackHref,
    flightNumber,
    originLabel,
    destLabel,
    estimatedArrivalHm,
  ]);

  const stop = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (compact) {
    return (
      <div
        className={`flex items-center justify-end gap-1 ${className}`.trim()}
        onClick={stop}
      >
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            openFamilyShare();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/35 bg-emerald-500/10 text-emerald-200/95 transition hover:border-emerald-400/55 hover:bg-emerald-500/20"
          aria-label="Share with family on WhatsApp"
          title="Family"
        >
          <span className="text-sm" aria-hidden>
            💬
          </span>
        </button>
        <Link
          href={trackHref}
          onClick={stop}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/40 bg-gradient-to-br from-blue-600/90 to-sky-500/85 text-white shadow-[0_0_16px_rgba(37,99,235,0.35)] transition hover:border-blue-400/60 hover:shadow-[0_0_20px_rgba(56,189,248,0.45)]"
          aria-label="Live track"
          title="Live track"
        >
          <PlaneIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`.trim()}
      onClick={stop}
    >
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          openFamilyShare();
        }}
        className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.05] px-3 py-2 text-[11px] font-semibold text-gray-200 shadow-sm transition hover:border-emerald-500/35 hover:bg-emerald-500/10 hover:text-emerald-100 md:text-xs"
      >
        Share with Family
      </button>
      <Link
        href={trackHref}
        onClick={stop}
        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-600 to-sky-500 px-3 py-2 text-[11px] font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.35)] transition hover:border-blue-300/50 hover:shadow-[0_0_26px_rgba(56,189,248,0.45)] md:text-xs"
      >
        <PlaneIcon className="h-3.5 w-3.5 shrink-0" />
        Live Track
      </Link>
    </div>
  );
}
