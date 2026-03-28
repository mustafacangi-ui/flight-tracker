/**
 * Client-side favorite airports and saved flights (localStorage).
 */

import { removePrefsForFlight } from "./savedFlightNotifyPrefs";

export type FavoriteAirport = {
  code: string;
  name: string;
  city: string;
};

/** Rich saved flight row (PWA / tracking). Legacy objects are migrated on read. */
export type SavedFlight = {
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  airline: string;
  scheduledTime: string;
  status: string;
  searchedAirportCode: string;
  timestamp: number;
  /** Arrival wall time when known (e.g. from board/detail). */
  arrivalTime?: string;
  /** Saved from family share flow or explicitly tagged. */
  familyShared?: boolean;
};

export const FAVORITE_AIRPORTS_KEY = "favoriteAirports";
export const SAVED_FLIGHTS_KEY = "savedFlights";

export const QUICK_ACCESS_UPDATED_EVENT = "quickAccessUpdated";

export function savedFlightRouteLabel(f: SavedFlight): string {
  return `${f.departureAirport} → ${f.arrivalAirport}`;
}

function notifyQuickAccessChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(QUICK_ACCESS_UPDATED_EVENT));
}

function parseFavoriteAirports(raw: string | null): FavoriteAirport[] {
  if (raw == null || raw === "") return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is FavoriteAirport =>
          x != null &&
          typeof x === "object" &&
          typeof (x as FavoriteAirport).code === "string" &&
          typeof (x as FavoriteAirport).name === "string" &&
          typeof (x as FavoriteAirport).city === "string"
      )
      .map((a) => ({
        code: a.code.trim().toUpperCase(),
        name: a.name.trim(),
        city: a.city.trim(),
      }))
      .filter((a) => a.code.length > 0);
  } catch {
    return [];
  }
}

function migrateLegacySaved(o: Record<string, unknown>): SavedFlight | null {
  const flightNumber = String(o.flightNumber ?? "").trim();
  if (!flightNumber) return null;
  const route = String(o.route ?? "—");
  const parts = route.split("→").map((s) => s.trim());
  const departureAirport = parts[0] || "—";
  const arrivalAirport = parts[1] || "—";
  const scheduledTime = String(
    o.scheduledTime ?? o.departureTime ?? "—"
  ).trim();
  const status = String(o.status ?? "Scheduled").trim();
  const airline = String(o.airline ?? "—").trim();
  const searchedAirportCode = String(o.searchedAirportCode ?? "—").trim();
  const ts = o.timestamp;
  const timestamp =
    typeof ts === "number" && Number.isFinite(ts) ? ts : Date.now();
  const arrivalTime =
    typeof o.arrivalTime === "string" ? o.arrivalTime.trim() : undefined;
  const familyShared = o.familyShared === true;
  return {
    flightNumber,
    departureAirport,
    arrivalAirport,
    airline,
    scheduledTime,
    status,
    searchedAirportCode,
    timestamp,
    ...(arrivalTime ? { arrivalTime } : {}),
    ...(familyShared ? { familyShared: true } : {}),
  };
}

function parseSavedFlightOne(x: unknown): SavedFlight | null {
  if (x == null || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const flightNumber = String(o.flightNumber ?? "").trim();
  if (!flightNumber) return null;

  if (
    typeof o.timestamp === "number" &&
    typeof o.searchedAirportCode === "string" &&
    typeof o.departureAirport === "string" &&
    typeof o.arrivalAirport === "string"
  ) {
    const arrivalTime =
      typeof o.arrivalTime === "string" && o.arrivalTime.trim()
        ? o.arrivalTime.trim()
        : undefined;
    const familyShared = o.familyShared === true;
    return {
      flightNumber,
      departureAirport: String(o.departureAirport).trim() || "—",
      arrivalAirport: String(o.arrivalAirport).trim() || "—",
      airline: String(o.airline ?? "—").trim() || "—",
      scheduledTime: String(o.scheduledTime ?? "—").trim() || "—",
      status: String(o.status ?? "Scheduled").trim() || "Scheduled",
      searchedAirportCode: String(o.searchedAirportCode).trim() || "—",
      timestamp: o.timestamp,
      ...(arrivalTime ? { arrivalTime } : {}),
      ...(familyShared ? { familyShared: true } : {}),
    };
  }

  return migrateLegacySaved(o);
}

function parseSavedFlights(raw: string | null): SavedFlight[] {
  if (raw == null || raw === "") return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: SavedFlight[] = [];
    for (const x of parsed) {
      const f = parseSavedFlightOne(x);
      if (f) out.push(f);
    }
    return out;
  } catch {
    return [];
  }
}

export function loadFavoriteAirports(): FavoriteAirport[] {
  if (typeof window === "undefined") return [];
  return parseFavoriteAirports(localStorage.getItem(FAVORITE_AIRPORTS_KEY));
}

export function saveFavoriteAirports(list: FavoriteAirport[]): void {
  if (typeof window === "undefined") return;
  const dedup = new Map<string, FavoriteAirport>();
  for (const a of list) {
    const code = a.code.trim().toUpperCase();
    if (!code) continue;
    dedup.set(code, {
      code,
      name: a.name.trim() || code,
      city: a.city.trim() || code,
    });
  }
  localStorage.setItem(
    FAVORITE_AIRPORTS_KEY,
    JSON.stringify(Array.from(dedup.values()))
  );
  notifyQuickAccessChanged();
}

export function loadSavedFlights(): SavedFlight[] {
  if (typeof window === "undefined") return [];
  return parseSavedFlights(localStorage.getItem(SAVED_FLIGHTS_KEY));
}

export function saveSavedFlights(list: SavedFlight[]): void {
  if (typeof window === "undefined") return;
  const dedup = new Map<string, SavedFlight>();
  for (const f of list) {
    const flightNumber = f.flightNumber.trim();
    if (!flightNumber) continue;
    dedup.set(flightNumber.toUpperCase(), {
      flightNumber,
      departureAirport: f.departureAirport.trim() || "—",
      arrivalAirport: f.arrivalAirport.trim() || "—",
      airline: f.airline.trim() || "—",
      scheduledTime: f.scheduledTime.trim() || "—",
      status: f.status.trim() || "Scheduled",
      searchedAirportCode: f.searchedAirportCode.trim() || "—",
      timestamp: f.timestamp,
    });
  }
  localStorage.setItem(
    SAVED_FLIGHTS_KEY,
    JSON.stringify(Array.from(dedup.values()))
  );
  notifyQuickAccessChanged();
}

export function isFavoriteAirportCode(
  code: string,
  list?: FavoriteAirport[]
): boolean {
  const c = code.trim().toUpperCase();
  const arr = list ?? loadFavoriteAirports();
  return arr.some((a) => a.code === c);
}

export function toggleFavoriteAirport(
  airport: FavoriteAirport,
  list?: FavoriteAirport[]
): FavoriteAirport[] {
  const code = airport.code.trim().toUpperCase();
  const current = list ?? loadFavoriteAirports();
  const exists = current.some((a) => a.code === code);
  const next = exists
    ? current.filter((a) => a.code !== code)
    : [
        ...current,
        {
          code,
          name: airport.name.trim() || code,
          city: airport.city.trim() || code,
        },
      ];
  saveFavoriteAirports(next);
  return next;
}

export function favoriteAirportFromSimplified(a: {
  code: string;
  name: string;
  city: string;
}): FavoriteAirport {
  return {
    code: a.code.trim().toUpperCase(),
    name: a.name.trim() || a.code,
    city: a.city.trim() || a.code,
  };
}

export function favoriteAirportFromSelection(sel: {
  code: string;
  name: string;
}): FavoriteAirport {
  const code = sel.code.trim().toUpperCase();
  const raw = sel.name.trim();
  const parts = raw.split(" - ").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      code,
      city: parts[0],
      name: parts.slice(1).join(" - "),
    };
  }
  return { code, city: raw || code, name: raw || code };
}

export function isFlightSaved(
  flightNumber: string,
  list?: SavedFlight[]
): boolean {
  const n = flightNumber.trim().toUpperCase();
  const arr = list ?? loadSavedFlights();
  return arr.some((f) => f.flightNumber.trim().toUpperCase() === n);
}

export function upsertSavedFlight(
  flight: SavedFlight,
  list?: SavedFlight[]
): SavedFlight[] {
  const n = flight.flightNumber.trim();
  const current = list ?? loadSavedFlights();
  const upper = n.toUpperCase();
  const filtered = current.filter(
    (f) => f.flightNumber.trim().toUpperCase() !== upper
  );
  const row: SavedFlight = {
    flightNumber: n,
    departureAirport: flight.departureAirport.trim() || "—",
    arrivalAirport: flight.arrivalAirport.trim() || "—",
    airline: flight.airline.trim() || "—",
    scheduledTime: flight.scheduledTime.trim() || "—",
    status: flight.status.trim() || "Scheduled",
    searchedAirportCode: flight.searchedAirportCode.trim() || "—",
    timestamp: flight.timestamp,
  };
  const at = flight.arrivalTime?.trim();
  if (at) row.arrivalTime = at;
  if (flight.familyShared) row.familyShared = true;
  const next = [...filtered, row];
  saveSavedFlights(next);
  return next;
}

export function removeSavedFlight(
  flightNumber: string,
  list?: SavedFlight[]
): SavedFlight[] {
  const upper = flightNumber.trim().toUpperCase();
  const current = list ?? loadSavedFlights();
  const next = current.filter(
    (f) => f.flightNumber.trim().toUpperCase() !== upper
  );
  saveSavedFlights(next);
  removePrefsForFlight(flightNumber);
  return next;
}

export function toggleSavedFlight(
  flight: SavedFlight,
  list?: SavedFlight[]
): { saved: boolean; list: SavedFlight[] } {
  const current = list ?? loadSavedFlights();
  if (isFlightSaved(flight.flightNumber, current)) {
    return {
      saved: false,
      list: removeSavedFlight(flight.flightNumber, current),
    };
  }
  return { saved: true, list: upsertSavedFlight(flight, current) };
}
