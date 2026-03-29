"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import EnablePushNotificationsCard from "../EnablePushNotificationsCard";
import FlightCardLiveRow from "../FlightCardLiveRow";
import FlightNotificationToggle from "../FlightNotificationToggle";
import { useQuickAccess } from "../../hooks/useQuickAccess";
import { usePremiumFlag } from "../../hooks/usePremiumFlag";
import { FREE_TIER } from "../../lib/premiumTier";
import type { SavedFlight } from "../../lib/quickAccessStorage";
import {
  removeSavedFlight,
} from "../../lib/quickAccessStorage";
import { savedFlightTrackContext } from "../../lib/flightCardLink";
import { useUpgradeModal } from "../UpgradeModalProvider";

type FilterId = "all" | "upcoming" | "past" | "delayed" | "family";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "delayed", label: "Delayed" },
  { id: "family", label: "Family shared" },
];

function airlineMonogram(airline: string): string {
  const letters = airline.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
  if (airline.trim().length >= 2) return airline.trim().slice(0, 2).toUpperCase();
  return "RW";
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("delay")) {
    return "bg-amber-500/12 text-amber-100 ring-1 ring-amber-500/25";
  }
  if (s.includes("cancel") || s.includes("divert")) {
    return "bg-rose-500/12 text-rose-100 ring-1 ring-rose-500/25";
  }
  if (
    s.includes("land") ||
    s.includes("arriv") ||
    s.includes("complete") ||
    s.includes("on time")
  ) {
    return "bg-emerald-500/12 text-emerald-100 ring-1 ring-emerald-500/20";
  }
  if (s.includes("board") || s.includes("gate") || s.includes("taxi")) {
    return "bg-sky-500/12 text-sky-100 ring-1 ring-sky-500/25";
  }
  return "bg-slate-600/40 text-slate-200 ring-1 ring-slate-500/20";
}

function isDelayedFlight(f: SavedFlight): boolean {
  return f.status.toLowerCase().includes("delay");
}

function isPastFlight(f: SavedFlight): boolean {
  const s = f.status.toLowerCase();
  if (
    /landed|arrived|complete|cancel|divert|closed|arriv/.test(s)
  ) {
    return true;
  }
  const age = Date.now() - f.timestamp;
  return age > 4 * 24 * 60 * 60 * 1000;
}

function isUpcomingFlight(f: SavedFlight): boolean {
  return !isPastFlight(f);
}

function matchesFilter(f: SavedFlight, filter: FilterId): boolean {
  switch (filter) {
    case "all":
      return true;
    case "upcoming":
      return isUpcomingFlight(f);
    case "past":
      return isPastFlight(f);
    case "delayed":
      return isDelayedFlight(f);
    case "family":
      return f.familyShared === true;
    default:
      return true;
  }
}

function matchesSearch(f: SavedFlight, q: string): boolean {
  if (!q.trim()) return true;
  const n = q.trim().toLowerCase();
  return (
    f.flightNumber.toLowerCase().includes(n) ||
    f.airline.toLowerCase().includes(n) ||
    f.departureAirport.toLowerCase().includes(n) ||
    f.arrivalAirport.toLowerCase().includes(n)
  );
}

function SavedFlightCard({
  f,
  onRemove,
  shareUrl,
}: {
  f: SavedFlight;
  onRemove: () => void;
  shareUrl: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const delayed = isDelayedFlight(f);
  const mono = airlineMonogram(f.airline);
  const arrDisplay = f.arrivalTime?.trim() || "—";
  const tctx = savedFlightTrackContext(f);

  const copyShare = useCallback(() => {
    void (async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    })();
  }, [shareUrl]);

  const stop = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => router.push(tctx.trackHref)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(tctx.trackHref);
        }
      }}
      className="group cursor-pointer rounded-2xl border border-slate-800/90 bg-slate-900/40 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md transition duration-300 hover:scale-[1.02] hover:border-blue-500/35 hover:shadow-[0_20px_50px_rgba(59,130,246,0.14)] sm:rounded-3xl sm:p-5"
    >
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-sm font-bold tracking-tight text-blue-300 ring-1 ring-white/10">
          {mono}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-lg font-bold tracking-tight text-white">
              {f.flightNumber}
            </span>
            <span
              className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(f.status)}`}
            >
              {f.status}
            </span>
            {delayed ? (
              <span className="rounded-lg bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200 ring-1 ring-amber-400/35">
                Delayed
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">{f.airline}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                From
              </p>
              <p className="mt-0.5 text-sm font-medium text-slate-200">
                {f.departureAirport}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-400">
                Dep {f.scheduledTime}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                To
              </p>
              <p className="mt-0.5 text-sm font-medium text-slate-200">
                {f.arrivalAirport}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-400">
                Arr {arrDisplay}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-4">
        <FlightCardLiveRow
          trackHref={tctx.trackHref}
          flightNumber={f.flightNumber}
          originLabel={tctx.originLabel}
          destLabel={tctx.destLabel}
          estimatedArrivalHm={tctx.estimatedArrivalHm}
        />
        <FlightNotificationToggle flight={f} />
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            copyShare();
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-blue-500/40 hover:bg-slate-800"
        >
          <svg
            className="h-3.5 w-3.5 text-blue-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 10v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10M7 10l4-4m-4 4 4 4m6-8V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
            />
          </svg>
          {copied ? "Copied" : "Copy share link"}
        </button>
        <Link
          href={`/flight/${encodeURIComponent(f.flightNumber)}`}
          onClick={stop}
          className="rounded-xl border border-slate-700 bg-slate-800/30 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800/60"
        >
          Full detail
        </Link>
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            onRemove();
          }}
          className="ml-auto inline-flex items-center gap-1 rounded-xl p-2 text-amber-300/90 transition hover:bg-amber-500/10 hover:text-amber-200"
          aria-label="Remove from saved"
          title="Saved — tap to remove"
        >
          <svg
            className="h-5 w-5 fill-current"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      </div>
    </article>
  );
}

export default function SavedFlightsDashboard() {
  const { savedFlights, refresh } = useQuickAccess();
  const { openUpgrade } = useUpgradeModal();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const premium = usePremiumFlag();

  const shareBase =
    typeof window !== "undefined" ? window.location.origin : "";

  const filtered = useMemo(() => {
    return savedFlights.filter(
      (f) => matchesSearch(f, query) && matchesFilter(f, filter)
    );
  }, [savedFlights, query, filter]);

  return (
    <div className="space-y-6">
      {savedFlights.length > 0 ? (
        <EnablePushNotificationsCard variant="inline" />
      ) : null}
      <div>
        <label htmlFor="saved-flights-search" className="sr-only">
          Search saved flights
        </label>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            id="saved-flights-search"
            type="search"
            autoComplete="off"
            placeholder="Search flight, airline, airport…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none ring-0 transition focus:border-blue-500/50 focus:bg-slate-900"
          />
        </div>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {FILTERS.map(({ id, label }) => {
          const on = filter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                on
                  ? "border-blue-500/50 bg-blue-600/20 text-white ring-1 ring-blue-500/30"
                  : "border-slate-700/90 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {!premium ? (
        <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-slate-900/50 to-blue-600/[0.1] p-4 sm:rounded-3xl sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80">
                RouteWings Pro
              </p>
              <p className="mt-1 text-base font-semibold text-white">
                Free plan: up to {FREE_TIER.maxSavedFlights} saved flights
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Upgrade for unlimited saves, private family links, live map, and
                full push alerts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openUpgrade()}
              className="shrink-0 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500"
            >
              View Pro
            </button>
          </div>
        </div>
      ) : null}

      {savedFlights.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-14 text-center sm:rounded-3xl sm:py-16">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-500 ring-1 ring-slate-700">
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="M6 4h12v16l-6-3-6 3V4z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-white">No saved flights yet</p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">
            Save flights to quickly track them later
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Browse flights
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-12 text-center sm:rounded-3xl">
          <p className="font-medium text-slate-300">No flights match this filter</p>
          <p className="mt-2 text-sm text-slate-500">
            Try another filter or clear your search.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setQuery("");
            }}
            className="mt-4 text-sm font-semibold text-blue-400 hover:text-blue-300"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((f) => (
            <li key={f.flightNumber}>
              <SavedFlightCard
                f={f}
                shareUrl={`${shareBase}/share/${encodeURIComponent(f.flightNumber)}`}
                onRemove={() => {
                  removeSavedFlight(f.flightNumber);
                  refresh();
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
