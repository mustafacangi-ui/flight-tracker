"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import FavoriteAirportPills from "../../components/FavoriteAirportPills";
import RecentFlightsSection from "../../components/RecentFlightsSection";
import SectionHeader from "../../components/SectionHeader";
import SavedFlightsDashboard from "../../components/saved/SavedFlightsDashboard";
import { getEffectiveAirportTimeZone } from "../../lib/formatAirportTime";
import type { FavoriteAirport } from "../../lib/quickAccessStorage";
import { useQuickAccess } from "../../hooks/useQuickAccess";

export default function SavedFlightsPage() {
  const router = useRouter();
  const { favoriteAirports } = useQuickAccess();

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
    <div className="min-h-screen overflow-x-hidden bg-[#070a0f] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)]" />
      <div className="relative mx-auto flex w-full max-w-xl min-w-0 flex-col gap-10 lg:max-w-2xl">
        <header>
          <Link
            href="/"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← Home
          </Link>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Saved Flights
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your personal board — Notion calm, airline clarity.
          </p>
        </header>

        <SavedFlightsDashboard />

        <section className="space-y-3 border-t border-slate-800/80 pt-8">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300">
            Recently viewed
          </h2>
          <RecentFlightsSection />
        </section>

        <section className="space-y-3 pb-8">
          <SectionHeader title="Favorite airports" />
          {favoriteAirports.length === 0 ? (
            <p className="text-sm text-slate-500">
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
