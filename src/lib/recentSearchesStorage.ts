/** localStorage key for latest airport codes searched (IATA/ICAO). */
export const RECENT_SEARCHES_STORAGE_KEY = "recentSearches";

/** Unique airports ever opened (for stats). */
const UNIQUE_AIRPORTS_SEARCHED_KEY = "airportsSearchedUnique";

export const RECENT_SEARCHES_UPDATED_EVENT = "recentSearchesUpdated";

export const UNIQUE_AIRPORTS_SEARCHED_UPDATED_EVENT =
  "uniqueAirportsSearchedUpdated";

function loadUniqueAirportsSet(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(UNIQUE_AIRPORTS_SEARCHED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === "string")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function saveUniqueAirportsSet(codes: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    UNIQUE_AIRPORTS_SEARCHED_KEY,
    JSON.stringify([...new Set(codes)])
  );
  window.dispatchEvent(new Event(UNIQUE_AIRPORTS_SEARCHED_UPDATED_EVENT));
}

/** Count of distinct airport codes the user has searched. */
export function loadUniqueAirportsSearchedCount(): number {
  return loadUniqueAirportsSet().length;
}

/** Backfill unique set from `recentSearches` once (legacy users). */
export function ensureUniqueAirportsMigratedFromRecent(): void {
  if (typeof window === "undefined") return;
  if (loadUniqueAirportsSet().length > 0) return;
  const recent = loadRecentAirportCodes();
  if (recent.length === 0) return;
  saveUniqueAirportsSet(recent);
}

export function loadRecentAirportCodes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === "string")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 12);
  } catch {
    return [];
  }
}

export function recordRecentAirportSearch(code: string): void {
  if (typeof window === "undefined") return;
  const c = code.trim().toUpperCase();
  if (!c) return;
  const prev = loadRecentAirportCodes();
  const next = [c, ...prev.filter((x) => x !== c)].slice(0, 12);
  localStorage.setItem(
    RECENT_SEARCHES_STORAGE_KEY,
    JSON.stringify(next)
  );
  window.dispatchEvent(new Event(RECENT_SEARCHES_UPDATED_EVENT));

  const uniq = new Set(loadUniqueAirportsSet());
  if (!uniq.has(c)) {
    uniq.add(c);
    saveUniqueAirportsSet([...uniq]);
  }
}
