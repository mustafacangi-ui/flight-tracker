/**
 * Privacy-first, client-only usage aggregates (post-launch insights).
 * Replace with server analytics (PostHog, Plausible, etc.) when ready.
 */

export const ANALYTICS_STORAGE_KEY = "flightApp_localAnalytics";

export type AnalyticsEventName =
  | "page_view"
  | "airport_search_success"
  | "view_mode_cards"
  | "view_mode_board"
  | "flight_mode_departure"
  | "flight_mode_arrival"
  | "flight_detail_open"
  | "family_share_view"
  | "save_flight"
  | "save_airport_favorite"
  | "track_flight_on"
  | "track_flight_off"
  | "alert_emitted"
  | "upgrade_modal_open";

type Counters = Record<string, number>;

type Store = {
  /** pathname or event key → count */
  pageViews: Counters;
  /** airport IATA → count */
  airportSearches: Counters;
  /** flight number → save count */
  savedFlights: Counters;
  /** airport IATA → favorite-add count */
  favoriteAirports: Counters;
  /** alert kind → count */
  alertKinds: Counters;
  /** feature flags usage */
  modes: Counters;
  lastEventAt: number;
};

const emptyStore = (): Store => ({
  pageViews: {},
  airportSearches: {},
  savedFlights: {},
  favoriteAirports: {},
  alertKinds: {},
  modes: {},
  lastEventAt: 0,
});

function load(): Store {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return emptyStore();
    const p = JSON.parse(raw) as Partial<Store>;
    return {
      ...emptyStore(),
      ...p,
      pageViews: p.pageViews ?? {},
      airportSearches: p.airportSearches ?? {},
      savedFlights: p.savedFlights ?? {},
      favoriteAirports: p.favoriteAirports ?? {},
      alertKinds: p.alertKinds ?? {},
      modes: p.modes ?? {},
    };
  } catch {
    return emptyStore();
  }
}

function save(s: Store): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* quota */
  }
}

function bump(obj: Counters, key: string, n = 1): void {
  obj[key] = (obj[key] ?? 0) + n;
}

export function trackEvent(
  name: AnalyticsEventName,
  payload?: Record<string, string | undefined>
): void {
  if (typeof window === "undefined") return;
  const s = load();
  s.lastEventAt = Date.now();

  switch (name) {
    case "page_view": {
      const path = payload?.path ?? window.location.pathname;
      bump(s.pageViews, path);
      break;
    }
    case "airport_search_success": {
      const code = payload?.airport?.trim().toUpperCase() ?? "UNKNOWN";
      bump(s.airportSearches, code);
      break;
    }
    case "view_mode_board":
      bump(s.modes, "board");
      break;
    case "view_mode_cards":
      bump(s.modes, "cards");
      break;
    case "flight_mode_departure":
      bump(s.modes, "departure");
      break;
    case "flight_mode_arrival":
      bump(s.modes, "arrival");
      break;
    case "save_flight": {
      const fn = payload?.flightNumber?.trim().toUpperCase() ?? "UNKNOWN";
      bump(s.savedFlights, fn);
      break;
    }
    case "save_airport_favorite": {
      const code = payload?.airport?.trim().toUpperCase() ?? "UNKNOWN";
      bump(s.favoriteAirports, code);
      break;
    }
    case "alert_emitted": {
      const k = payload?.kind ?? "unknown";
      bump(s.alertKinds, k);
      break;
    }
    default:
      bump(s.modes, name);
  }

  save(s);
}

export function getAnalyticsSnapshot(): Store {
  return load();
}

export function topKeys(obj: Counters, n = 5): { key: string; count: number }[] {
  return Object.entries(obj)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}
