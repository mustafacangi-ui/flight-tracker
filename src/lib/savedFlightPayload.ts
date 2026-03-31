import type { FlightDetail } from "./flightDetailsTypes";
import {
  FLIGHT_TIME_MISSING,
  type DisplayFlight,
} from "./formatFlights";
import type { SavedFlight } from "./quickAccessStorage";
import {
  savedFlightToDepartureTimestamptzMs,
  utcDayStartMs,
} from "./savedFlightIdentity";

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

  const timestamp = utcDayStartMs(Date.now());
  const departureTimeKeyMs = savedFlightToDepartureTimestamptzMs({
    scheduledTime,
    timestamp,
  });

  return {
    flightNumber: f.number,
    departureAirport: dep,
    arrivalAirport: arr,
    airline,
    scheduledTime,
    status: f.statusLabel || "Scheduled",
    searchedAirportCode: code,
    timestamp,
    departureTimeKeyMs,
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
  const parsedDep = Date.parse(time);
  const timestamp = Number.isNaN(parsedDep)
    ? utcDayStartMs(Date.now())
    : utcDayStartMs(parsedDep);
  const departureTimeKeyMs = savedFlightToDepartureTimestamptzMs({
    scheduledTime: time,
    timestamp,
  });
  return {
    flightNumber: d.flightNumber,
    departureAirport: depName,
    arrivalAirport: arrName,
    airline: d.airlineName?.trim() || "—",
    scheduledTime: time,
    status: d.status?.trim() || "Scheduled",
    searchedAirportCode: dep,
    timestamp,
    departureTimeKeyMs,
    ...(arrTime ? { arrivalTime: arrTime } : {}),
  };
}
