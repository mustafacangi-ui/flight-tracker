import type { SavedFlight } from "./quickAccessStorage";
import { savedFlightToDepartureTimestamptzMs } from "./savedFlightIdentity";

/** Row shape from `public.saved_flights` (Supabase). */
export type SavedFlightDbRow = {
  id: string;
  user_id: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  airline: string;
  status: string;
  searched_airport_code: string;
  arrival_time: string | null;
  family_shared: boolean;
  client_timestamp: number | null;
  created_at: string;
};

function formatSavedDepartureDisplay(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function savedFlightFromDbRow(row: SavedFlightDbRow): SavedFlight {
  const depMs = new Date(row.departure_time).getTime();
  const ts =
    typeof row.client_timestamp === "number" && Number.isFinite(row.client_timestamp)
      ? row.client_timestamp
      : Number.isFinite(depMs)
        ? depMs
        : Date.now();
  return {
    serverId: row.id,
    flightNumber: row.flight_number.trim(),
    departureAirport: row.departure_airport.trim() || "—",
    arrivalAirport: row.arrival_airport.trim() || "—",
    airline: row.airline.trim() || "—",
    scheduledTime: formatSavedDepartureDisplay(row.departure_time),
    status: row.status.trim() || "Scheduled",
    searchedAirportCode: row.searched_airport_code.trim() || "—",
    timestamp: ts,
    ...(Number.isFinite(depMs) ? { departureTimeKeyMs: depMs } : {}),
    ...(row.arrival_time?.trim() ? { arrivalTime: row.arrival_time.trim() } : {}),
    ...(row.family_shared ? { familyShared: true } : {}),
  };
}

export type SavedFlightInsertPayload = {
  user_id: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  airline: string;
  status: string;
  searched_airport_code: string;
  arrival_time: string | null;
  family_shared: boolean;
  client_timestamp: number;
};

export function bodyToSavedFlightInsert(
  body: Record<string, unknown>,
  userId: string
):
  | { ok: true; flight: SavedFlight; insert: SavedFlightInsertPayload }
  | { ok: false; error: string } {
  const flightNumber = String(body.flightNumber ?? "").trim();
  const departureAirport = String(body.departureAirport ?? "").trim() || "—";
  const arrivalAirport = String(body.arrivalAirport ?? "").trim() || "—";
  const scheduledTime = String(body.scheduledTime ?? "").trim() || "—";
  const airline = String(body.airline ?? "").trim() || "—";
  const status = String(body.status ?? "").trim() || "Scheduled";
  const searchedAirportCode = String(body.searchedAirportCode ?? "").trim() || "—";
  const tsRaw = body.timestamp;
  const timestamp =
    typeof tsRaw === "number" && Number.isFinite(tsRaw) ? tsRaw : Date.now();
  const arrivalTime =
    typeof body.arrivalTime === "string" ? body.arrivalTime.trim() : "";
  const familyShared = body.familyShared === true;

  if (!flightNumber) {
    return { ok: false, error: "flightNumber is required" };
  }

  const depMs = savedFlightToDepartureTimestamptzMs({
    scheduledTime,
    timestamp,
  } as Pick<SavedFlight, "scheduledTime" | "timestamp">);

  const flight: SavedFlight = {
    flightNumber,
    departureAirport,
    arrivalAirport,
    airline,
    scheduledTime,
    status,
    searchedAirportCode,
    timestamp,
    departureTimeKeyMs: depMs,
    ...(arrivalTime ? { arrivalTime } : {}),
    ...(familyShared ? { familyShared: true } : {}),
  };

  const departure_time = new Date(depMs).toISOString();

  return {
    ok: true,
    flight,
    insert: {
      user_id: userId,
      flight_number: flightNumber,
      departure_airport: departureAirport,
      arrival_airport: arrivalAirport,
      departure_time,
      airline,
      status,
      searched_airport_code: searchedAirportCode,
      arrival_time: arrivalTime || null,
      family_shared: familyShared,
      client_timestamp: timestamp,
    },
  };
}
