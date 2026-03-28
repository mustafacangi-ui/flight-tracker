"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  loadRecentFlights,
  RECENT_FLIGHTS_KEY,
  RECENT_FLIGHTS_UPDATED_EVENT,
  type RecentFlight,
} from "../lib/recentFlightsStorage";

type Props = {
  /** Omit outer heading (for use inside HomeQuickWidgets). */
  embed?: boolean;
};

export default function RecentFlightsSection({ embed = false }: Props) {
  const [items, setItems] = useState<RecentFlight[]>([]);

  const refresh = useCallback(() => {
    setItems(loadRecentFlights());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onCustom = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === RECENT_FLIGHTS_KEY || e.key === null) refresh();
    };
    window.addEventListener(RECENT_FLIGHTS_UPDATED_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(RECENT_FLIGHTS_UPDATED_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  if (items.length === 0) {
    return embed ? (
      <p className="text-xs text-gray-500">No recent flights yet.</p>
    ) : null;
  }

  const list = (
    <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin]">
      {items.map((f) => (
        <Link
          key={f.flightNumber}
          href={`/flight/${encodeURIComponent(f.flightNumber)}`}
          className="shrink-0 snap-start rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.07]"
        >
          <p className="font-mono text-base font-bold text-amber-200/90">
            {f.flightNumber}
          </p>
          <p className="mt-1 font-mono text-xs text-gray-300">{f.route}</p>
        </Link>
      ))}
    </div>
  );

  if (embed) return list;

  return (
    <section
      className="w-full space-y-3"
      aria-labelledby="recent-flights-heading"
    >
      <h2
        id="recent-flights-heading"
        className="text-sm font-semibold tracking-wide text-gray-200"
      >
        Recently Viewed
      </h2>
      {list}
    </section>
  );
}
