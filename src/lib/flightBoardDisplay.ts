import { formatFlightsFromApi, type DisplayFlight } from "./formatFlights";
import type { AeroAirportFlight } from "./flightTypes";
import {
  filterUpcomingArrivals,
  filterUpcomingDepartures,
} from "./sortFidsFlights";

export type BoardFilterMode = "upcoming" | "all";

export type FlightBoardDisplayResult = {
  departures: DisplayFlight[];
  arrivals: DisplayFlight[];
  rawCounts: { dep: number; arr: number };
  upcomingOnlyEmptyDepartures: boolean;
  upcomingOnlyEmptyArrivals: boolean;
};

export function buildFlightBoardDisplay(
  rawDep: AeroAirportFlight[],
  rawArr: AeroAirportFlight[],
  airportTimeZone: string,
  filter: BoardFilterMode
): FlightBoardDisplayResult {
  const depFiltered =
    filter === "upcoming" ? filterUpcomingDepartures(rawDep) : rawDep;
  const arrFiltered =
    filter === "upcoming" ? filterUpcomingArrivals(rawArr) : rawArr;
  const fmt = { airportTimeZone };
  return {
    departures: formatFlightsFromApi(depFiltered, [], fmt),
    arrivals: formatFlightsFromApi([], arrFiltered, fmt),
    rawCounts: { dep: rawDep.length, arr: rawArr.length },
    upcomingOnlyEmptyDepartures:
      filter === "upcoming" && depFiltered.length === 0 && rawDep.length > 0,
    upcomingOnlyEmptyArrivals:
      filter === "upcoming" && arrFiltered.length === 0 && rawArr.length > 0,
  };
}
