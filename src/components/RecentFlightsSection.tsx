"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import FlightCardLiveRow from "./FlightCardLiveRow";
import { recentFlightTrackContext } from "../lib/flightCardLink";
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
  const router = useRouter();
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
      {items.map((f) => {
        const ctx = recentFlightTrackContext(f.flightNumber, f.route);
        return (
          <div
            key={f.flightNumber}
            role="button"
            tabIndex={0}
            onClick={() => router.push(ctx.trackHref)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(ctx.trackHref);
              }
            }}
            className="w-[min(100%,17rem)] shrink-0 snap-start cursor-pointer rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md transition hover:scale-[1.02] hover:border-blue-500/35 hover:bg-white/[0.07] hover:shadow-[0_0_28px_rgba(59,130,246,0.15)]"
          >
            <p className="font-mono text-base font-bold text-amber-200/90">
              {f.flightNumber}
            </p>
            <p className="mt-1 font-mono text-xs text-gray-300">{f.route}</p>
            <FlightCardLiveRow
              className="mt-3 border-t border-white/10 pt-3"
              trackHref={ctx.trackHref}
              flightNumber={f.flightNumber}
              originLabel={ctx.originLabel}
              destLabel={ctx.destLabel}
              estimatedArrivalHm={ctx.estimatedArrivalHm}
            />
          </div>
        );
      })}
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
