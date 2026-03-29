"use client";

import type { FlightDetail } from "../../lib/flightDetailsTypes";
import LiveFlightMapLazy from "../live/LiveFlightMapLazy";
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

  if (hasUsableAirportCodes(detail)) {
    return (
      <LiveFlightMapLazy
        departureAirportCode={detail.departureAirportCode}
        arrivalAirportCode={detail.arrivalAirportCode}
        progressPercent={pct}
      />
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
