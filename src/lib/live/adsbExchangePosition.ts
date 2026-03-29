import type { AircraftLivePosition } from "./types";

/**
 * ADS-B Exchange (RapidAPI or direct) — optional; many endpoints need ICAO24.
 * Placeholder: call RapidAPI "adsbexchange" search-by-flight if key present.
 */
export async function tryAdsbExchangeLivePosition(
  _flightNumber: string,
  _apiKey: string
): Promise<AircraftLivePosition | null> {
  void _flightNumber;
  void _apiKey;
  return null;
}
