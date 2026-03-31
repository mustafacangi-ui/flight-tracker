"use client";

import Link from "next/link";

import FavoriteAirportPills from "./FavoriteAirportPills";
import RecentFlightsSection from "./RecentFlightsSection";
import SectionHeader from "./SectionHeader";
import type { FavoriteAirport } from "../lib/quickAccessStorage";
import { savedFlightRouteLabel } from "../lib/quickAccessStorage";
import { savedFlightIdentityKey } from "../lib/savedFlightIdentity";
import { useQuickAccess } from "../hooks/useQuickAccess";

type Props = {
  onOpenAirport: (a: FavoriteAirport) => void;
};

export default function HomeQuickWidgets({ onOpenAirport }: Props) {
  const { favoriteAirports, savedFlights } = useQuickAccess();

  return (
    <div className="flex w-full flex-col gap-4">
      <FavoriteAirportPills
        airports={favoriteAirports}
        onSelect={onOpenAirport}
      />

      <section id="quick-access" className="scroll-mt-4 space-y-1.5">
        <SectionHeader
          title="Saved flights"
          action={
            savedFlights.length > 0 ? (
              <Link
                href="/saved"
                className="text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                See all
              </Link>
            ) : null
          }
        />
        {savedFlights.length === 0 ? (
          <p className="text-xs text-gray-500">
            No saved flights yet. Save flights to quickly track delays, gates and boarding.
          </p>
        ) : (
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
            {savedFlights.slice(0, 8).map((f) => (
              <Link
                key={f.serverId ?? savedFlightIdentityKey(f)}
                href={`/flight/${encodeURIComponent(f.flightNumber)}`}
                className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-sm transition hover:border-white/20"
              >
                <p className="font-mono text-sm font-bold text-amber-200/90">
                  {f.flightNumber}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-gray-400">
                  {savedFlightRouteLabel(f)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <RecentFlightsSection embed />
    </div>
  );
}
