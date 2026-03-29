"use client";

import { useMemo } from "react";

import { getRouteWeatherInsights } from "../../lib/weather/getAirportWeather";
import AirportOperationalStatusCard from "./AirportOperationalStatusCard";
import AirportWeatherCard from "./AirportWeatherCard";
import FlightDelayRiskCard from "./FlightDelayRiskCard";
import WeatherImpactBanner from "./WeatherImpactBanner";

type Props = {
  departureAirportCode?: string | null;
  arrivalAirportCode?: string | null;
  departureLabel?: string;
  arrivalLabel?: string;
  /** Tighter spacing for family / live column */
  compact?: boolean;
  className?: string;
};

export default function FlightWeatherSection({
  departureAirportCode,
  arrivalAirportCode,
  departureLabel,
  arrivalLabel,
  compact = false,
  className = "",
}: Props) {
  const insights = useMemo(
    () =>
      getRouteWeatherInsights(departureAirportCode, arrivalAirportCode, {
        departure: departureLabel,
        arrival: arrivalLabel,
      }),
    [departureAirportCode, arrivalAirportCode, departureLabel, arrivalLabel]
  );

  const gap = compact ? "gap-4 sm:gap-5" : "gap-5 sm:gap-6";

  return (
    <section
      className={`flex flex-col ${gap} ${className}`.trim()}
      aria-labelledby="weather-section-heading"
    >
      <div>
        <h2
          id="weather-section-heading"
          className="text-[10px] font-bold uppercase tracking-[0.32em] text-blue-400/80"
        >
          Weather & airport ops
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Route conditions and illustrative operational status (demo).
        </p>
      </div>

      <WeatherImpactBanner alerts={insights.banners} />

      <div
        className={`grid grid-cols-1 ${compact ? "sm:grid-cols-1" : "sm:grid-cols-2"} gap-4`}
      >
        <AirportWeatherCard snapshot={insights.departure} role="departure" />
        <AirportWeatherCard snapshot={insights.arrival} role="arrival" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <AirportOperationalStatusCard
          status={insights.departureOperational}
          airportCode={insights.departure.airportCode}
          role="departure"
        />
        <AirportOperationalStatusCard
          status={insights.arrivalOperational}
          airportCode={insights.arrival.airportCode}
          role="arrival"
        />
      </div>

      <FlightDelayRiskCard
        level={insights.delayRisk}
        reasons={insights.delayReasons}
      />
    </section>
  );
}
