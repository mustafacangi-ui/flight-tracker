/**
 * Hybrid Flight Data Provider Architecture
 * Primary: AeroDataBox | Fallback: Multiple providers
 * Normalizes all responses to internal FlightDetail format
 */

import type { FlightDetail, FlightSearchResult } from "./aerodatabox";
import {
  getFlightByNumber as getAeroDataBoxFlight,
  getAirportFlights as getAeroDataBoxAirportFlights,
  searchFlights as searchAeroDataBoxFlights,
  normalizeFlightNumber,
  getFlightCache,
  setFlightCache,
  FLIGHT_CACHE_TTL,
} from "./aerodatabox";
import {
  getFlightByNumber as getAviationStackFlight,
  getAirportFlights as getAviationStackAirportFlights,
  searchFlights as searchAviationStackFlights,
  getAviationStackHealth,
} from "./providers/aviationstack";
import { getAircraftPosition, getOpenSkyHealth } from "./providers/opensky";
import { getWeatherByCoordinates, getOpenMeteoHealth } from "./providers/openmeteo";

// Provider type definitions
type ProviderName = "aerodatabox" | "aviationstack" | "flightaware" | "flightlabs" | "opensky" | "adsbexchange" | "cache" | "mock";

export type ProviderResult<T> =
  | { ok: true; data: T; provider: ProviderName; cached?: boolean }
  | { ok: false; error: string; provider: ProviderName; fallback?: boolean };

export type FlightProvider = {
  name: ProviderName;
  priority: number;
  enabled: boolean;
  searchFlights: (query: string) => Promise<FlightSearchResult>;
  getFlightByNumber: (flightNumber: string) => Promise<FlightDetail | null>;
  getAirportFlights?: (code: string) => Promise<{ departures: unknown[]; arrivals: unknown[]; timestamp: number; source: string }>;
  getHealth: () => Promise<{ ok: boolean; latencyMs: number; remaining?: number }>;
};

// Mock provider for testing or when all others fail
const mockProvider: FlightProvider = {
  name: "mock",
  priority: 999,
  enabled: true,
  searchFlights: async () => ({
    flights: [],
    query: "",
    source: "mock",
    timestamp: Date.now(),
  }),
  getFlightByNumber: async () => null,
  getHealth: async () => ({ ok: true, latencyMs: 0 }),
};

// Cache-as-provider for stale-while-revalidate
function createCacheProvider(): FlightProvider {
  return {
    name: "cache",
    priority: 0, // Highest priority - check cache first
    enabled: true,
    searchFlights: async (query: string) => {
      const cacheKey = `search:${normalizeFlightNumber(query)}`;
      const cached = getFlightCache<FlightSearchResult>(cacheKey);
      return cached ?? {
        flights: [],
        query,
        source: "cache",
        timestamp: Date.now(),
      };
    },
    getFlightByNumber: async (flightNumber: string) => {
      const cacheKey = `flight:${normalizeFlightNumber(flightNumber)}`;
      return getFlightCache<FlightDetail>(cacheKey);
    },
    getAirportFlights: async (code: string) => {
      const cacheKey = `airport:${code.toUpperCase()}`;
      const cached = getFlightCache<{ departures: unknown[]; arrivals: unknown[]; timestamp: number; source: string }>(cacheKey);
      if (cached) {
        return cached;
      }
      return {
        departures: [],
        arrivals: [],
        timestamp: Date.now(),
        source: "cache",
      };
    },
    getHealth: async () => ({ ok: true, latencyMs: 0 }),
  };
}

// Provider registry
class ProviderRegistry {
  private providers: Map<ProviderName, FlightProvider> = new Map();
  private defaultPriority = 100;

  constructor() {
    // Register default providers
    this.register(createAeroDataBoxProvider());
    this.register(createCacheProvider());
    this.register(createAviationStackProvider());
    this.register(mockProvider);
  }

  register(provider: FlightProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: ProviderName): FlightProvider | undefined {
    return this.providers.get(name);
  }

  getEnabled(): FlightProvider[] {
    return Array.from(this.providers.values())
      .filter((p) => p.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  async searchFlightsWithFallback(query: string): Promise<ProviderResult<FlightSearchResult>> {
    const normalizedQuery = normalizeFlightNumber(query);
    const providers = this.getEnabled();
    const errors: string[] = [];

    for (const provider of providers) {
      try {
        const startTime = Date.now();
        const result = await provider.searchFlights(normalizedQuery);
        const latencyMs = Date.now() - startTime;

        // Check if result has data
        if (result.flights.length > 0) {
          return {
            ok: true,
            data: result,
            provider: provider.name,
          };
        }

        // Empty result but no error - continue to next provider
        console.log(`[Provider] ${provider.name} returned empty results for ${normalizedQuery} (${latencyMs}ms)`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${provider.name}: ${message}`);
        console.warn(`[Provider] ${provider.name} failed for search "${normalizedQuery}": ${message}`);
      }
    }

    // All providers failed or returned empty
    return {
      ok: false,
      error: `All providers failed: ${errors.join("; ")}`,
      provider: "mock",
      fallback: true,
    };
  }

  async getFlightWithFallback(flightNumber: string): Promise<ProviderResult<FlightDetail>> {
    console.log('[getFlightWithFallback] input=', flightNumber)
    const normalizedNumber = normalizeFlightNumber(flightNumber);
    console.log('[getFlightWithFallback] normalized=', normalizedNumber)
    const providers = this.getEnabled().filter((p) => p.name !== "cache");
    console.log('[getFlightWithFallback] providers=', providers.map(p => p.name))
    const errors: string[] = [];

    for (const provider of providers) {
      console.log('[getFlightWithFallback] trying provider=', provider.name)
      try {
        const startTime = Date.now();
        const result = await provider.getFlightByNumber(normalizedNumber);
        const latencyMs = Date.now() - startTime;
        console.log(`[getFlightWithFallback] provider=${provider.name} result=${result ? 'FOUND' : 'NULL'} (${latencyMs}ms)`)

        if (result) {
          return {
            ok: true,
            data: result,
            provider: provider.name,
          };
        }

        console.log(`[Provider] ${provider.name} returned no flight for ${normalizedNumber} (${latencyMs}ms)`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${provider.name}: ${message}`);
        console.warn(`[Provider] ${provider.name} failed for flight "${normalizedNumber}": ${message}`);
      }
    }

    return {
      ok: false,
      error: `Flight not found. All providers failed: ${errors.join("; ")}`,
      provider: "mock",
      fallback: true,
    };
  }

  async getAirportFlightsWithFallback(code: string): Promise<{
    departures: unknown[];
    arrivals: unknown[];
    timestamp: number;
    source: string;
    provider: ProviderName;
  }> {
    const normalizedCode = code.trim().toUpperCase();
    const providers = this.getEnabled().filter((p) => p.getAirportFlights);
    
    // Check cache first
    const cacheKey = `airport:${normalizedCode}`;
    const cached = getFlightCache<{ departures: unknown[]; arrivals: unknown[] }>(cacheKey);
    if (cached) {
      return {
        ...cached,
        timestamp: Date.now(),
        source: "cache",
        provider: "cache",
      };
    }

    for (const provider of providers) {
      try {
        const startTime = Date.now();
        const result = await provider.getAirportFlights!(normalizedCode);
        const latencyMs = Date.now() - startTime;

        if (result && (result.departures.length > 0 || result.arrivals.length > 0)) {
          // Cache successful result
          setFlightCache(cacheKey, result, FLIGHT_CACHE_TTL.AIRPORT_BOARD);
          
          return {
            ...result,
            timestamp: Date.now(),
            source: result.source,
            provider: provider.name,
          };
        }

        console.log(`[Provider] ${provider.name} returned empty airport data for ${normalizedCode} (${latencyMs}ms)`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[Provider] ${provider.name} failed for airport "${normalizedCode}": ${message}`);
      }
    }

    return {
      departures: [],
      arrivals: [],
      timestamp: Date.now(),
      source: "mock",
      provider: "mock",
    };
  }

  async getHealthCheck(): Promise<Record<ProviderName, { ok: boolean; latencyMs: number }>> {
    const providers = this.getEnabled();
    const results: Record<ProviderName, { ok: boolean; latencyMs: number }> = {} as Record<ProviderName, { ok: boolean; latencyMs: number }>;

    for (const provider of providers) {
      try {
        const health = await provider.getHealth();
        results[provider.name] = { ok: health.ok, latencyMs: health.latencyMs };
      } catch {
        results[provider.name] = { ok: false, latencyMs: -1 };
      }
    }

    return results;
  }
}

// Create AeroDataBox provider instance
function createAeroDataBoxProvider(): FlightProvider {
  return {
    name: "aerodatabox",
    priority: 10,
    enabled: true,
    searchFlights: searchAeroDataBoxFlights,
    getFlightByNumber: getAeroDataBoxFlight,
    getAirportFlights: getAeroDataBoxAirportFlights,
    getHealth: async () => {
      const startTime = Date.now();
      try {
        const result = await searchAeroDataBoxFlights("TK1");
        return {
          ok: true,
          latencyMs: Date.now() - startTime,
        };
      } catch {
        return { ok: false, latencyMs: Date.now() - startTime };
      }
    },
  };
}

// Singleton registry instance
let globalRegistry: ProviderRegistry | null = null;

export function getProviderRegistry(): ProviderRegistry {
  if (!globalRegistry) {
    globalRegistry = new ProviderRegistry();
  }
  return globalRegistry;
}

// Convenience functions
export async function searchFlightsHybrid(query: string): Promise<FlightSearchResult> {
  const registry = getProviderRegistry();
  const result = await registry.searchFlightsWithFallback(query);

  if (result.ok) {
    return result.data;
  }

  // Return empty result on failure
  return {
    flights: [],
    query: normalizeFlightNumber(query),
    source: "mock",
    timestamp: Date.now(),
  };
}

export async function getFlightHybrid(flightNumber: string): Promise<FlightDetail | null> {
  console.log('[getFlightHybrid] input=', flightNumber)
  const registry = getProviderRegistry();
  const result = await registry.getFlightWithFallback(flightNumber);

  if (result.ok) {
    console.log('[getFlightHybrid] SUCCESS, provider=', result.provider)
    return result.data;
  }

  console.log('[getFlightHybrid] FAILED, error=', result.error)
  return null;
}

export async function getAirportFlightsHybrid(code: string): Promise<{
  departures: unknown[];
  arrivals: unknown[];
  timestamp: number;
  source: string;
}> {
  const registry = getProviderRegistry();
  const result = await registry.getAirportFlightsWithFallback(code);
  
  return {
    departures: result.departures,
    arrivals: result.arrivals,
    timestamp: result.timestamp,
    source: result.source,
  };
}

// Create AviationStack provider instance
function createAviationStackProvider(): FlightProvider {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  
  return {
    name: "aviationstack",
    priority: 20,
    enabled: !!apiKey, // Only enabled if API key is configured
    searchFlights: searchAviationStackFlights,
    getFlightByNumber: getAviationStackFlight,
    getAirportFlights: getAviationStackAirportFlights,
    getHealth: getAviationStackHealth,
  };
}

export function createFlightAwareProvider(): FlightProvider {
  return {
    name: "flightaware",
    priority: 30,
    enabled: false, // Disabled until configured
    searchFlights: async () => ({
      flights: [],
      query: "",
      source: "mock",
      timestamp: Date.now(),
    }),
    getFlightByNumber: async () => null,
    getHealth: async () => ({ ok: false, latencyMs: -1 }),
  };
}

export function createFlightLabsProvider(): FlightProvider {
  return {
    name: "flightlabs",
    priority: 40,
    enabled: false, // Disabled until configured
    searchFlights: async () => ({
      flights: [],
      query: "",
      source: "mock",
      timestamp: Date.now(),
    }),
    getFlightByNumber: async () => null,
    getHealth: async () => ({ ok: false, latencyMs: -1 }),
  };
}

export function createOpenSkyProvider(): FlightProvider {
  return {
    name: "opensky",
    priority: 50,
    enabled: false, // Disabled until configured
    searchFlights: async () => ({
      flights: [],
      query: "",
      source: "mock",
      timestamp: Date.now(),
    }),
    getFlightByNumber: async () => null,
    getHealth: async () => ({ ok: false, latencyMs: -1 }),
  };
}

export function createAdsbExchangeProvider(): FlightProvider {
  return {
    name: "adsbexchange",
    priority: 60,
    enabled: false, // Disabled until configured
    searchFlights: async () => ({
      flights: [],
      query: "",
      source: "mock",
      timestamp: Date.now(),
    }),
    getFlightByNumber: async () => null,
    getHealth: async () => ({ ok: false, latencyMs: -1 }),
  };
}

// Re-export types
export type { FlightDetail, FlightSearchResult } from "./aerodatabox";
