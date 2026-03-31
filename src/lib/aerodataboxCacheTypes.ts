import type { AeroAircraft, AeroAirline, AeroMovement } from "./flightTypes";

/** Normalized flight detail shape (AeroDataBox + autocomplete-derived). */
export type FlightDetail = {
  number: string;
  airline: AeroAirline;
  departure?: AeroMovement | null;
  arrival?: AeroMovement | null;
  aircraft?: AeroAircraft | null;
  status: string;
  scheduledDeparture: string | null;
  scheduledArrival: string | null;
  estimatedDeparture: string | null;
  estimatedArrival: string | null;
  actualDeparture: string | null;
  actualArrival: string | null;
  delayMinutes: number;
  gate: string | null;
  terminal: string | null;
  baggageBelt: string | null;
};

export type FlightSearchItem = {
  number: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureCity?: string;
  arrivalCity?: string;
  status: string;
  scheduledTime?: string;
  score: number;
};

export type FlightSearchResult = {
  flights: FlightSearchItem[];
  query: string;
  source: "api" | "cache" | "mock" | "aviationstack" | "aerodatabox";
  timestamp: number;
};
