import type { Metadata } from "next";
import { headers } from "next/headers";

import FamilyAirportCard from "../../../components/family/FamilyAirportCard";
import FamilyHeaderCard from "../../../components/family/FamilyHeaderCard";
import FamilyLiveMapSection from "../../../components/family/FamilyLiveMapSection";
import FamilyShareCard from "../../../components/family/FamilyShareCard";
import FamilyStatusCard from "../../../components/family/FamilyStatusCard";
import { mergeAircraftTailIntelligence } from "../../../lib/aircraftTailFallbacks";
import { mergeFlightDetailWithFallbacks } from "../../../lib/flightDetailFallbacks";
import { getMockFlightDetail } from "../../../lib/mockFlightDetails";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

function InvalidFamilyLink() {
  return (
    <div className="min-h-screen bg-[#05060a] px-4 py-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))] text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.45]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(14,165,233,0.12), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-md">
        <div className="rounded-3xl border border-blue-500/25 bg-slate-950/80 p-8 shadow-[0_0_48px_rgba(37,99,235,0.15),0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-10">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-blue-400/80">
            RouteWings
          </p>
          <h1 className="mt-4 text-center text-2xl font-bold text-white sm:text-3xl">
            Link unavailable
          </h1>
          <p className="mt-4 text-center text-base leading-relaxed text-slate-400">
            This family tracking link is invalid, expired, or has been revoked.
            Ask for a new link from the traveler.
          </p>
        </div>
      </div>
    </div>
  );
}

async function resolvePageUrl(token: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (!host) return `/family/${encodeURIComponent(token)}`;
  return `${proto}://${host}/family/${encodeURIComponent(token)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { title: "Family tracking · RouteWings" };
  }
  const { data, error } = await supabase.rpc("get_family_link_by_token", {
    p_token: token,
  });
  const row = !error && data?.[0] ? data[0] : null;
  if (!row) {
    return { title: "Link unavailable · RouteWings" };
  }
  const fn = String(row.flight_number ?? "Flight");
  return {
    title: `${fn} · Family tracking · RouteWings`,
    description: `Live-style flight updates for ${fn}. Shared securely — no sign-in required.`,
  };
}

export default async function FamilyTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return <InvalidFamilyLink />;
  }

  const { data, error } = await supabase.rpc("get_family_link_by_token", {
    p_token: token,
  });

  if (error || !data?.length) {
    return <InvalidFamilyLink />;
  }

  const row = data[0] as { flight_number: string };
  const flightNumber = row.flight_number;
  const base = getMockFlightDetail(flightNumber);
  const detail = mergeAircraftTailIntelligence(
    mergeFlightDetailWithFallbacks(base)
  );

  const pageUrl = await resolvePageUrl(token);
  const depCity =
    detail.departureCity || detail.departureAirportName || "Departure";
  const arrCity = detail.arrivalCity || detail.arrivalAirportName || "Arrival";
  const depCode = detail.departureAirportCode ?? "—";
  const arrCode = detail.arrivalAirportCode ?? "—";
  const hour = new Date().getHours();
  const isNight = hour >= 20 || hour < 6;

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.5]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -20%, rgba(37,99,235,0.28), transparent 55%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(14,165,233,0.1), transparent)",
        }}
      />
      <main className="relative mx-auto max-w-lg px-4 py-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-8">
        <div className="flex flex-col gap-5 sm:gap-6">
          <FamilyHeaderCard flight={detail} />
          <FamilyStatusCard variant="live" detail={detail} />
          <FamilyAirportCard flight={detail} />
          <FamilyLiveMapSection
            detail={detail}
            departureCity={depCity}
            arrivalCity={arrCity}
            isNight={isNight}
          />
          <FamilyShareCard
            pageUrl={pageUrl}
            flightNumber={detail.flightNumber}
            departureCode={depCode}
            arrivalCode={arrCode}
          />
          <p className="px-1 text-center text-[11px] leading-relaxed text-slate-600">
            Illustrative status for demo and fallback data. Always confirm with{" "}
            {detail.airlineName ?? "the airline"}.
          </p>
        </div>
      </main>
    </div>
  );
}
