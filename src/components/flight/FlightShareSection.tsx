"use client";

import { useCallback, useState } from "react";

import { useUpgradeModal } from "../UpgradeModalProvider";
import {
  AnalyticsEvents,
  trackProductEvent,
} from "../../lib/analytics/telemetry";
import { flightRadar24Url } from "../../lib/externalFlightLinks";
import { usePremiumFlag } from "../../hooks/usePremiumFlag";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

const btn =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.1] min-w-[140px]";

type Props = {
  flightNumber: string;
  copied: boolean;
  onCopyLink: () => void;
};

function IconLink({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconExternal({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function FlightShareSection({
  flightNumber,
  copied,
  onCopyLink,
}: Props) {
  const [familyCopied, setFamilyCopied] = useState(false);
  const { openUpgrade } = useUpgradeModal();
  const premium = usePremiumFlag();
  const trackUrl = flightRadar24Url(flightNumber);

  const copyFamilyLink = useCallback(async () => {
    trackProductEvent(AnalyticsEvents.family_share_clicked, {
      channel: "family_link_clipboard",
      flight_number: flightNumber,
    });
    if (!premium) {
      openUpgrade({ blockedFeature: "family_link" });
      return;
    }
    try {
      const res = await fetch("/api/family/links", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flightNumber }),
      });
      if (res.status === 403) {
        openUpgrade({ blockedFeature: "family_link" });
        return;
      }
      if (res.ok) {
        const body = (await res.json()) as { shareUrl?: string };
        if (body.shareUrl) {
          trackProductEvent(AnalyticsEvents.family_link_created, {
            flight_number: flightNumber,
          });
          await navigator.clipboard.writeText(body.shareUrl);
          setFamilyCopied(true);
          window.setTimeout(() => setFamilyCopied(false), 2800);
          return;
        }
      }
    } catch {
      /* fall through */
    }
    const slug = flightNumber.replace(/\s+/g, "").toLowerCase();
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/share/${encodeURIComponent(slug)}`
        : "";
    try {
      await navigator.clipboard.writeText(url);
      setFamilyCopied(true);
      window.setTimeout(() => setFamilyCopied(false), 2800);
    } catch {
      /* ignore */
    }
  }, [flightNumber]);

  return (
    <section className={glassCard("p-6")}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
        Share & tracking
      </h2>
      <p className="mt-3 text-sm text-gray-400">
        Copy this page, send a{" "}
        <span className="text-sky-200/90">private family tracking link</span>{" "}
        (Premium), or open live tracking on Flightradar24.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={onCopyLink} className={btn}>
          <IconLink className="text-cyan-300/90" />
          {copied ? "Copied" : "Copy link"}
        </button>
        <button type="button" onClick={() => void copyFamilyLink()} className={btn}>
          <IconUsers className="text-rose-200/90" />
          {familyCopied ? "Family link copied" : "Share with family"}
        </button>
        <a
          href={trackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
          onClick={() =>
            trackProductEvent(AnalyticsEvents.live_track_clicked, {
              channel: "external_fr24",
              flight_number: flightNumber,
            })
          }
        >
          <IconExternal className="text-amber-200/90" />
          Open live tracking
        </a>
      </div>
    </section>
  );
}
