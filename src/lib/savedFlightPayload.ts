import type { FlightDetail } from "./flightDetailsTypes";
import {
  FLIGHT_TIME_MISSING,
  type DisplayFlight,
} from "./formatFlights";
import type { SavedFlight } from "./quickAccessStorage";

export function savedFlightPayloadFromDisplay(
  f: DisplayFlight,
  searchedAirportCode: string
): SavedFlight {
  const dep =
    f.originCode?.trim() ||
    f.departureAirportCity?.trim() ||
    (f.direction === "departure" ? searchedAirportCode : "—") ||
    "—";
  const arr =
    f.destinationCode?.trim() ||
    f.arrivalAirportCity?.trim() ||
    f.destinationCity?.trim() ||
    "—";
  const scheduledTime =
    f.timeMissing || f.time === FLIGHT_TIME_MISSING ? "—" : f.time;
  const airline = f.airlineName?.trim() || "—";
  const code = searchedAirportCode.trim().toUpperCase() || "—";
  const arrWall =
    f.estimatedArrivalLocal?.trim() ||
    f.scheduledArrivalLocal?.trim() ||
    "";

  return {
    flightNumber: f.number,
    departureAirport: dep,
    arrivalAirport: arr,
    airline,
    scheduledTime,
    status: f.statusLabel || "Scheduled",
    searchedAirportCode: code,
    timestamp: Date.now(),
    ...(arrWall ? { arrivalTime: arrWall } : {}),
  };
}

export function savedFlightPayloadFromDetail(d: FlightDetail): SavedFlight {
  const dep = d.departureAirportCode?.trim() || "—";
  const arr = d.arrivalAirportCode?.trim() || "—";
  const depName =
    d.departureAirportName?.trim() || d.departureCity?.trim() || dep;
  const arrName =
    d.arrivalAirportName?.trim() || d.arrivalCity?.trim() || arr;
  const time =
    d.departureTime?.trim() ||
    d.estimatedDepartureTime?.trim() ||
    "—";
  const arrTime =
    d.estimatedArrivalTime?.trim() ||
    d.arrivalTime?.trim() ||
    "";
  return {
    flightNumber: d.flightNumber,
    departureAirport: depName,
    arrivalAirport: arrName,
    airline: d.airlineName?.trim() || "—",
    scheduledTime: time,
    status: d.status?.trim() || "Scheduled",
    searchedAirportCode: dep,
    timestamp: Date.now(),
    ...(arrTime ? { arrivalTime: arrTime } : {}),
  };
}
