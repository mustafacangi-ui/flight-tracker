import { promises as fs } from "fs";
import { join } from "path";

import type { FlightDetail, FlightSearchResult } from "./aerodataboxCacheTypes";

/** Default on-disk cache directory (JSON files). */
const CACHE_DIR = join(process.cwd(), ".flight-cache");

const TTL_MS = 24 * 60 * 60 * 1000;

const memoryCache = new Map<string, CacheEntry>();

type CacheEntry<T = unknown> = {
  data: T;
  timestamp: number;
};

type CacheMetadata = Record<
  string,
  { key: string; timestamp: number; type: "flight" | "search" }
>;

function getCacheFilePath(key: string): string {
  const sanitized = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  return join(CACHE_DIR, `${sanitized}.json`);
}

function getMetadataFilePath(): string {
  return join(CACHE_DIR, "metadata.json");
}

async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch {
    /* exists */
  }
}

async function loadMetadata(): Promise<CacheMetadata> {
  try {
    const raw = await fs.readFile(getMetadataFilePath(), "utf-8");
    return JSON.parse(raw) as CacheMetadata;
  } catch {
    return {};
  }
}

async function saveMetadata(meta: CacheMetadata): Promise<void> {
  try {
    await ensureCacheDir();
    await fs.writeFile(getMetadataFilePath(), JSON.stringify(meta, null, 2), "utf-8");
  } catch {
    /* ignore */
  }
}

function isFresh(entry: CacheEntry, now: number): boolean {
  return now - entry.timestamp <= TTL_MS;
}

async function readFileEntry<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const raw = await fs.readFile(getCacheFilePath(key), "utf-8");
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

/**
 * Fresh cache: memory Map, then JSON under `.flight-cache`. TTL 24h.
 */
export async function getPersistentCache<T>(
  key: string,
  _type: "flight" | "search"
): Promise<T | null> {
  const now = Date.now();
  const mem = memoryCache.get(key);
  if (mem && isFresh(mem, now)) {
    console.log(`[cache-hit] ${key} (memory)`);
    return mem.data as T;
  }
  if (mem && !isFresh(mem, now)) {
    memoryCache.delete(key);
    console.log(`[cache-miss] ${key} (memory expired)`);
  }

  const disk = await readFileEntry<T>(key);
  if (disk && isFresh(disk, now)) {
    memoryCache.set(key, disk);
    console.log(`[cache-hit] ${key} (disk)`);
    return disk.data;
  }
  if (disk && !isFresh(disk, now)) {
    console.log(`[cache-miss] ${key} (disk expired)`);
  } else if (!disk) {
    console.log(`[cache-miss] ${key} (no entry)`);
  }
  return null;
}

export async function setPersistentCache<T>(
  key: string,
  data: T,
  type: "flight" | "search"
): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };
  memoryCache.set(key, entry);
  try {
    await ensureCacheDir();
    await fs.writeFile(getCacheFilePath(key), JSON.stringify(entry, null, 2), "utf-8");
    console.log(`[cache-save] ${key} (${type}, 24h TTL)`);
  } catch (e) {
    console.log(`[cache-save] failed to write ${key}`, e);
  }
  const meta = await loadMetadata();
  meta[key] = { key, timestamp: entry.timestamp, type };
  await saveMetadata(meta);
}

/**
 * Returns last cached payload regardless of TTL (for 429 / outage fallback).
 */
export async function getStaleCache<T>(key: string): Promise<T | null> {
  const mem = memoryCache.get(key);
  if (mem) {
    console.log(`[429-fallback] ${key} (stale memory)`);
    return mem.data as T;
  }
  const disk = await readFileEntry<T>(key);
  if (disk) {
    console.log(`[429-fallback] ${key} (stale disk)`);
    return disk.data;
  }
  return null;
}

function normFlightNum(s: string): string {
  return s.trim().toUpperCase().replace(/\s+/g, "");
}

function extractAirlineCode(flightNumber: string): string {
  const n = normFlightNum(flightNumber);
  return n.match(/^([A-Z]{2,3})/)?.[1] ?? "";
}

function scoreItemMatch(itemNumber: string, target: string): number {
  const f = normFlightNum(itemNumber);
  const q = normFlightNum(target);
  if (f === q) return 100;
  const fa = extractAirlineCode(f);
  const qa = extractAirlineCode(q);
  const fn = f.replace(/^[A-Z]+/, "");
  const qn = q.replace(/^[A-Z]+/, "");
  if (fa === qa && fn === qn) return 90;
  if (fa === qa && parseInt(fn, 10) === parseInt(qn, 10)) return 80;
  if (fa === qa) return 50;
  if (f.includes(qn) && qn.length > 0) return 30;
  return 0;
}

/**
 * Pick best autocomplete row and build a minimal {@link FlightDetail}.
 */
export function buildFlightDetailFromAutocomplete(
  searchResult: FlightSearchResult,
  flightNumber: string
): FlightDetail | null {
  const target = normFlightNum(flightNumber);
  if (!target || !searchResult.flights?.length) return null;

  let best: (typeof searchResult.flights)[0] | null = null;
  let bestScore = 0;
  for (const f of searchResult.flights) {
    const s = scoreItemMatch(f.number, target);
    if (s > bestScore) {
      bestScore = s;
      best = f;
    }
  }
  if (!best || bestScore < 50) return null;

  const st = best.scheduledTime?.trim() || null;
  return {
    number: best.number,
    airline: { name: best.airline, iata: null, icao: null },
    departure: {
      airport: {
        iata: best.departureAirport,
        icao: null,
        municipalityName: best.departureCity ?? null,
      },
      scheduledTime: st ? { local: st, utc: st } : undefined,
    },
    arrival: {
      airport: {
        iata: best.arrivalAirport,
        icao: null,
        municipalityName: best.arrivalCity ?? null,
      },
    },
    aircraft: null,
    status: best.status || "Scheduled",
    scheduledDeparture: st,
    scheduledArrival: null,
    estimatedDeparture: null,
    estimatedArrival: null,
    actualDeparture: null,
    actualArrival: null,
    delayMinutes: 0,
    gate: null,
    terminal: null,
    baggageBelt: null,
  };
}
