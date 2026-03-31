"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import AircraftTailIntelligence from "../../../components/AircraftTailIntelligence";
import FlightAviationDelightSection from "../../../components/flight/FlightAviationDelightSection";
import DelayRiskCard from "../../../components/flight/DelayRiskCard";
import DelayRiskFactorsSection from "../../../components/flight/DelayRiskFactorsSection";
import FlightAlertsCard from "../../../components/flight/FlightAlertsCard";
import FlightLiveStatusSection from "../../../components/flight/FlightLiveStatusSection";
import FlightShareSection from "../../../components/flight/FlightShareSection";
import FlightStatsRow from "../../../components/flight/FlightStatsRow";
import FlightStatusBadges from "../../../components/flight/FlightStatusBadges";
import RelatedFlights from "../../../components/flight/RelatedFlights";
import FlightDetailNotificationTimeline from "../../../components/flight/FlightDetailNotificationTimeline";
import AircraftInfoCard from "../../../components/AircraftInfoCard";
import AirportInfoCard from "../../../components/AirportInfoCard";
import DataProvenanceBadge from "../../../components/DataProvenanceBadge";
import FlightDetailActionBar from "../../../components/FlightDetailActionBar";
import PremiumBadge from "../../../components/PremiumBadge";
import FlightHeroDashboard from "../../../components/flight/FlightHeroDashboard";
import FlightLiveRouteMapSection from "../../../components/flight/FlightLiveRouteMapSection";
import PremiumLiveMapTeaser from "../../../components/flight/PremiumLiveMapTeaser";
import FlightWeatherSection from "../../../components/weather/FlightWeatherSection";
import FlightWalletEventTimeline from "../../../components/flight/FlightWalletEventTimeline";
import FlightProgress from "../../../components/FlightProgress";
import FlightTimeline from "../../../components/FlightTimeline";
import NotificationPrefsModal from "../../../components/NotificationPrefsModal";
import { useUpgradeModal } from "../../../components/UpgradeModalProvider";
import { usePremiumFlag } from "../../../hooks/usePremiumFlag";
import { useFlightTracking } from "../../../hooks/useFlightTracking";
import { mergeAircraftTailIntelligence } from "../../../lib/aircraftTailFallbacks";
import { mergeFlightDetailWithFallbacks } from "../../../lib/flightDetailFallbacks";
import type { FlightDetail } from "../../../lib/flightDetailsTypes";
import { trackEvent } from "../../../lib/localAnalytics";
import { recordRecentFlight } from "../../../lib/recentFlightsStorage";
import { savedFlightPayloadFromDetail } from "../../../lib/savedFlightPayload";
import { adaptAeroFlightToLegacy } from "../../../lib/flightAdapter";
import type { FlightDetail as AeroFlightDetail } from "../../../lib/aerodatabox";

type Props = {
  flight: AeroFlightDetail | null;
  found: boolean;
};

export default function FlightDetailClient({ flight, found }: Props) {
  console.log('[FlightDetailClient] props received:', { flight: flight ? flight.number : null, found })
  
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const { isFlightTracked } = useFlightTracking();
  const { openUpgrade } = useUpgradeModal();
  const mapPremium = usePremiumFlag();

  // Convert AeroDataBox flight to legacy format
  const legacyFlight = useMemo(() => {
    console.log('[FlightDetailClient] adaptAeroFlightToLegacy input:', flight ? flight.number : null)
    const result = adaptAeroFlightToLegacy(flight);
    console.log('[FlightDetailClient] adaptAeroFlightToLegacy output:', result ? 'SUCCESS' : 'NULL')
    return result;
  }, [flight]);

  const flightDetail = useMemo(() => {
    console.log('[FlightDetailClient] building flightDetail, legacyFlight:', legacyFlight ? 'EXISTS' : 'NULL')
    if (!legacyFlight) return null;
    const result = mergeAircraftTailIntelligence(mergeFlightDetailWithFallbacks(legacyFlight));
    console.log('[FlightDetailClient] flightDetail result:', result ? 'EXISTS' : 'NULL')
    return result;
  }, [legacyFlight]);

  const detailPayload = useMemo(() => {
    console.log('[FlightDetailClient] building detailPayload, flightDetail:', flightDetail ? 'EXISTS' : 'NULL')
    if (!flightDetail) return null;
    const result = savedFlightPayloadFromDetail(flightDetail);
    console.log('[FlightDetailClient] detailPayload result:', result ? 'EXISTS' : 'NULL')
    return result;
  }, [flightDetail]);
  
  const flightNumber = flight?.number ?? "—";
  const tracked = isFlightTracked(flightNumber);

  const shareUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [shareUrl]);

  useEffect(() => {
    if (!found || !flight) return;
    trackEvent("flight_detail_open", { flightNumber: flightDetail?.flightNumber ?? flightNumber });
  }, [found, flight, flightDetail?.flightNumber, flightNumber]);

  useEffect(() => {
    if (!found || !flight) return;
    const dep = flightDetail?.departureAirportCode ?? "—";
    const arr = flightDetail?.arrivalAirportCode ?? "—";
    recordRecentFlight(flightNumber, `${dep} → ${arr}`);
  }, [
    found,
    flight,
    flightNumber,
    flightDetail?.departureAirportCode,
    flightDetail?.arrivalAirportCode,
  ]);

  useEffect(() => {
    if (!found || !flight) return;
    const scrollToAlerts = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash !== "#flight-alerts") return;
      window.requestAnimationFrame(() => {
        document
          .getElementById("flight-alerts")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    scrollToAlerts();
    window.addEventListener("hashchange", scrollToAlerts);
    return () => window.removeEventListener("hashchange", scrollToAlerts);
  }, [found]);

  // Don't render flight details if we don't have flight data
  console.log('[FlightDetailClient] checking !found || !flight:', { found, hasFlight: !!flight })
  if (!found || !flight) {
    console.log('[FlightDetailClient] RENDERING NOT FOUND STATE')
    return (
      <div className="min-h-screen bg-gray-950 px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-xl font-semibold text-white">Flight not found</h1>
          <p className="mt-2 text-sm text-gray-400">
            This flight may no longer be available or has not been scheduled yet.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:bg-white/[0.06]"
          >
            Back to tracker
          </Link>
        </div>
      </div>
    );
  }

  // Ensure we have processed flight data before rendering
  console.log('[FlightDetailClient] checking !flightDetail || !detailPayload:', { hasFlightDetail: !!flightDetail, hasDetailPayload: !!detailPayload })
  if (!flightDetail || !detailPayload) {
    console.log('[FlightDetailClient] RENDERING LOADING STATE')
    return (
      <div className="min-h-screen bg-gray-950 px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-xl font-semibold text-white">{flight.number}</h1>
          <p className="mt-2 text-sm text-gray-400">
            Loading flight details...
          </p>
        </div>
      </div>
    );
  }

  console.log('[FlightDetailClient] RENDERING FULL FLIGHT DETAIL')

  const badges = flightDetail.badges ?? [];
  const riskFactors = flightDetail.delayRiskFactors ?? [];
  const timelineEvents = flightDetail.timelineEvents ?? [];

  return (
    <motion.div
      className="relative min-h-screen overflow-x-hidden bg-[#060910] px-4 py-8 text-white sm:px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(37,99,235,0.14),transparent)]"
        aria-hidden
      />
      <FlightDetailActionBar
        flightNumber={flightNumber}
        payload={detailPayload}
        copied={copied}
        onShare={() => void copyLink()}
        onOpenPrefs={() => setPrefsOpen(true)}
        tracked={tracked}
      />

      <div className="relative z-[1] mx-auto w-full max-w-6xl pb-28 lg:pb-10 lg:pr-[15rem]">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <DataProvenanceBadge kind="real_api" />
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 text-sm text-gray-400 transition hover:text-white"
        >
          ← Back to flights
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_360px] lg:items-start">
          <div className="flex min-w-0 flex-col gap-6">
            <FlightHeroDashboard
              flight={flightDetail}
              payload={detailPayload}
              copied={copied}
              onShare={() => void copyLink()}
              onOpenPrefs={() => setPrefsOpen(true)}
              onUnlockRouteHistory={() =>
                openUpgrade({ blockedFeature: "route_history" })
              }
            />

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.32 }}
            >
              <FlightStatusBadges items={badges} />
            </motion.div>

            {mapPremium ? (
              <FlightLiveRouteMapSection detail={flightDetail} />
            ) : (
              <PremiumLiveMapTeaser
                onUnlock={() =>
                  openUpgrade({ blockedFeature: "live_map_detail" })
                }
              />
            )}

            <FlightProgress detail={flightDetail} />

            <FlightWalletEventTimeline flight={flightDetail} />

            {flightDetail.stats ? (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.35 }}
              >
                <FlightStatsRow stats={flightDetail.stats} />
              </motion.div>
            ) : null}

            <FlightAviationDelightSection detail={flightDetail} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AirportInfoCard
                variant="departure"
                airportCode={flightDetail.departureAirportCode ?? "—"}
                airportName={flightDetail.departureAirportName ?? "—"}
                city={flightDetail.departureCity}
                scheduledTime={flightDetail.departureTime}
                estimatedTime={
                  flightDetail.estimatedDepartureTime ?? flightDetail.departureTime
                }
                actualTime={flightDetail.actualDepartureTime}
                terminal={flightDetail.departureTerminal ?? flightDetail.terminal}
                gate={flightDetail.gate}
                timeZoneIana={flightDetail.departureTimeZone}
                motionIndex={0}
              />
              <AirportInfoCard
                variant="arrival"
                airportCode={flightDetail.arrivalAirportCode ?? "—"}
                airportName={flightDetail.arrivalAirportName ?? "—"}
                city={flightDetail.arrivalCity}
                scheduledTime={flightDetail.arrivalTime}
                estimatedTime={
                  flightDetail.estimatedArrivalTime ?? flightDetail.arrivalTime
                }
                actualTime={flightDetail.actualArrivalTime}
                terminal={flightDetail.arrivalTerminal}
                gate={flightDetail.arrivalGate}
                timeZoneIana={flightDetail.arrivalTimeZone}
                motionIndex={1}
              />
            </div>

            <FlightWeatherSection
              departureAirportCode={flightDetail.departureAirportCode}
              arrivalAirportCode={flightDetail.arrivalAirportCode}
              departureLabel={
                flightDetail.departureCity ?? flightDetail.departureAirportName ?? undefined
              }
              arrivalLabel={
                flightDetail.arrivalCity ?? flightDetail.arrivalAirportName ?? undefined
              }
            />

            <AircraftInfoCard
              aircraftType={flightDetail.aircraftType}
              tailNumber={flightDetail.tailNumber}
              aircraftAgeYears={flightDetail.aircraftAgeYears}
              seatCount={flightDetail.seatCount}
              seatLayout={flightDetail.seatLayout}
              registrationCountry={flightDetail.registrationCountry}
              airlineName={flightDetail.airlineName}
              motionIndex={2}
            />

            <FlightTimeline events={timelineEvents} />

            <FlightDetailNotificationTimeline
              flightNumber={flightNumber}
              detail={flightDetail}
            />

            <AircraftTailIntelligence detail={flightDetail} />

            <DelayRiskFactorsSection factors={riskFactors} />

            <FlightLiveStatusSection
              phrase={flightDetail.liveStatusPhrase}
              lines={flightDetail.liveStatusLines}
              badges={badges}
            />

            <FlightShareSection
              flightNumber={flightNumber}
              copied={copied}
              onCopyLink={() => void copyLink()}
            />
          </div>

          <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.36 }}
              className="space-y-2"
            >
              <div className="flex justify-end">
                <PremiumBadge variant="pro" />
              </div>
              <DelayRiskCard level={flightDetail.delayRiskLevel ?? "low"} />
            </motion.div>
            <RelatedFlights next={flightDetail.nextFlight ?? null} />
            <div id="flight-alerts" className="scroll-mt-4">
              <FlightAlertsCard flightNumber={flightNumber} />
            </div>
          </aside>
        </div>
      </div>

      <NotificationPrefsModal
        flightNumber={flightNumber}
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
      />
    </motion.div>
  );
}
