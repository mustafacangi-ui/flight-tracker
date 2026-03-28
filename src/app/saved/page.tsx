"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import FavoriteAirportPills from "../../components/FavoriteAirportPills";
import RecentFlightsSection from "../../components/RecentFlightsSection";
import SectionHeader from "../../components/SectionHeader";
import { getEffectiveAirportTimeZone } from "../../lib/formatAirportTime";
import type { FavoriteAirport } from "../../lib/quickAccessStorage";
import {
  removeSavedFlight,
  savedFlightRouteLabel,
} from "../../lib/quickAccessStorage";
import { useQuickAccess } from "../../hooks/useQuickAccess";

export default function SavedFlightsPage() {
  const router = useRouter();
  const { savedFlights, favoriteAirports, refresh } = useQuickAccess();

  const openAirport = (a: FavoriteAirport) => {
    const tz = getEffectiveAirportTimeZone(a.code, null);
    sessionStorage.setItem(
      "pendingAirportOpen",
      JSON.stringify({
        code: a.code,
        name: [a.city, a.name].filter(Boolean).join(" - ") || a.code,
        ...(tz ? { timezone: tz } : {}),
      })
    );
    router.push("/");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-950 px-3 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-lg min-w-0 flex-col gap-8">
        <header>
          <Link
            href="/"
            className="text-sm text-gray-400 transition hover:text-white"
          >
            ← Home
          </Link>
          <h1 className="mt-4 text-2xl font-semibold">Saved</h1>
        </header>

        <section className="space-y-3">
          <SectionHeader title="Saved flights" />
          {savedFlights.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-8 text-center text-sm text-gray-400">
              <p className="font-medium text-gray-300">No saved flights yet</p>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                Save flights to access them quickly later
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {savedFlights.map((f) => (
                <li
                  key={f.flightNumber}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/35 hover:shadow-[0_18px_48px_rgba(59,130,246,0.12)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-lg font-bold text-amber-200/90">
                        {f.flightNumber}
                      </p>
                      <p className="mt-1 font-mono text-xs text-gray-300">
                        {savedFlightRouteLabel(f)}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">{f.airline}</p>
                      <p className="mt-1 font-mono text-sm text-white">
                        {f.scheduledTime}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{f.status}</p>
                      <p className="mt-1 text-[10px] text-gray-600">
                        From search: {f.searchedAirportCode}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      <Link
                        href={`/flight/${encodeURIComponent(f.flightNumber)}`}
                        className="rounded-lg border border-white/15 bg-white/[0.08] px-3 py-2 text-center text-xs font-medium text-white"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          removeSavedFlight(f.flightNumber);
                          refresh();
                        }}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-gray-200">
            Recently Viewed Flights
          </h2>
          <RecentFlightsSection />
        </section>

        <section className="space-y-3">
          <SectionHeader title="Favorite airports" />
          {favoriteAirports.length === 0 ? (
            <p className="text-sm text-gray-500">
              Star airports from the home page to see them here.
            </p>
          ) : (
            <FavoriteAirportPills
              airports={favoriteAirports}
              onSelect={(a) => openAirport(a)}
            />
          )}
        </section>
      </div>
    </div>
  );
}
