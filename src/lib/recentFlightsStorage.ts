/**
 * Recently opened flight detail pages (localStorage).
 */

export type RecentFlight = {
  flightNumber: string;
  route: string;
  viewedAt: number;
};

export const RECENT_FLIGHTS_KEY = "recentFlights";

export const RECENT_FLIGHTS_UPDATED_EVENT = "recentFlightsUpdated";

const MAX_ITEMS = 12;

function notify(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(RECENT_FLIGHTS_UPDATED_EVENT));
}

function parse(raw: string | null): RecentFlight[] {
  if (raw == null || raw === "") return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (x): x is RecentFlight =>
          x != null &&
          typeof x === "object" &&
          typeof (x as RecentFlight).flightNumber === "string" &&
          typeof (x as RecentFlight).route === "string" &&
          typeof (x as RecentFlight).viewedAt === "number"
      )
      .map((x) => ({
        flightNumber: x.flightNumber.trim(),
        route: x.route.trim(),
        viewedAt: x.viewedAt,
      }))
      .filter((x) => x.flightNumber.length > 0);
  } catch {
    return [];
  }
}

export function loadRecentFlights(): RecentFlight[] {
  if (typeof window === "undefined") return [];
  return parse(localStorage.getItem(RECENT_FLIGHTS_KEY)).sort(
    (a, b) => b.viewedAt - a.viewedAt
  );
}

export function saveRecentFlights(list: RecentFlight[]): void {
  if (typeof window === "undefined") return;
  const trimmed = list.slice(0, MAX_ITEMS);
  localStorage.setItem(RECENT_FLIGHTS_KEY, JSON.stringify(trimmed));
  notify();
}

export function recordRecentFlight(flightNumber: string, route: string): void {
  const n = flightNumber.trim();
  if (!n) return;
  const r = route.trim() || "—";
  const now = Date.now();
  const current = loadRecentFlights().filter(
    (x) => x.flightNumber.toUpperCase() !== n.toUpperCase()
  );
  saveRecentFlights([{ flightNumber: n, route: r, viewedAt: now }, ...current]);
}
