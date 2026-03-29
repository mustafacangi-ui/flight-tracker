import {
  buildFlightDetailPayload,
  findFlightInFids,
  type FlightDetailPayload,
} from "../flightDetail";
import { getAirportFids } from "../server/airportFids";

/**
 * Resolves live FIDS detail for a tracked row by probing departure, arrival,
 * then IST as a fallback (same strategy as the flight detail API).
 */
export async function fetchFlightDetailForTracked(args: {
  flightNumber: string;
  departureAirport: string | null | undefined;
  arrivalAirport: string | null | undefined;
  apiKey: string;
}): Promise<FlightDetailPayload | null> {
  const { flightNumber, departureAirport, arrivalAirport, apiKey } = args;
  const raw = [departureAirport, arrivalAirport, "IST"]
    .map((x) => (x == null ? "" : String(x).trim().toUpperCase()))
    .filter((x) => x.length > 0);
  const airports = [...new Set(raw.length > 0 ? raw : ["IST"])];

  for (const ap of airports) {
    const result = await getAirportFids(ap, apiKey);
    if (!result.ok) continue;
    const { departures, arrivals } = result.data;
    const match = findFlightInFids(departures, arrivals, flightNumber, ap);
    if (match) {
      const allFlights = [...departures, ...arrivals];
      return buildFlightDetailPayload(match, ap, { allFlights });
    }
  }
  return null;
}
