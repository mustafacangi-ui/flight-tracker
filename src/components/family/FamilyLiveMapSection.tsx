"use client";

import type { FlightDetail } from "../../lib/flightDetailsTypes";
import { useLiveAircraftPosition } from "../../hooks/useLiveAircraftPosition";
import LiveFlightMapLazy from "../live/LiveFlightMapLazy";
import LiveRadarStatusBadge from "../live/LiveRadarStatusBadge";
import FamilyMapCard from "./FamilyMapCard";
import { effectiveProgressPercent } from "../FlightProgress";

type Props = {
  detail: FlightDetail;
  departureCity: string;
  arrivalCity: string;
  isNight: boolean;
};

function hasUsableAirportCodes(d: FlightDetail): boolean {
  const dep = d.departureAirportCode?.replace(/[^\w]/g, "").toUpperCase() ?? "";
  const arr = d.arrivalAirportCode?.replace(/[^\w]/g, "").toUpperCase() ?? "";
  return dep.length >= 3 && arr.length >= 3;
}

export default function FamilyLiveMapSection({
  detail,
  departureCity,
  arrivalCity,
  isNight,
}: Props) {
  const pct = effectiveProgressPercent(detail);

  const radar = useLiveAircraftPosition({
    flightNumber: detail.flightNumber,
    departureAirportCode: detail.departureAirportCode,
    arrivalAirportCode: detail.arrivalAirportCode,
    enabled: hasUsableAirportCodes(detail),
    pollMs: 55_000,
  });

  if (hasUsableAirportCodes(detail)) {
    return (
      <div className="flex flex-col gap-2">
        <LiveRadarStatusBadge
          isLive={Boolean(radar.position)}
          loading={radar.loading}
          source={radar.position?.source}
        />
        <LiveFlightMapLazy
          departureAirportCode={detail.departureAirportCode}
          arrivalAirportCode={detail.arrivalAirportCode}
          progressPercent={pct}
          liveSample={radar.position}
          regionalLabel={radar.regionalLabel}
        />
      </div>
    );
  }

  return (
    <FamilyMapCard
      departureCity={departureCity}
      arrivalCity={arrivalCity}
      progressPercent={pct}
      familyMode
      isNight={isNight}
    />
  );
}
