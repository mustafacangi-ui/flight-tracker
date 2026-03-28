import { normalizeFlightNumberKey } from "./flightDetail";

/** Flightradar24 search for this flight number. */
export function flightRadar24Url(flightNumberRaw: string): string {
  const key = normalizeFlightNumberKey(flightNumberRaw).toLowerCase();
  return `https://www.flightradar24.com/data/flights/${key}`;
}
