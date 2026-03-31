/**
 * OpenSky Network API Provider
 * Live aircraft tracking data
 * Free for non-commercial use, requires registration
 */

const OPENSKY_USERNAME = process.env.OPENSKY_USERNAME;
const OPENSKY_PASSWORD = process.env.OPENSKY_PASSWORD;
const OPENSKY_BASE_URL = "https://opensky-network.org/api";

// Types for OpenSky API responses
type OpenSkyState = {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  sensors: number[] | null;
  geo_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
  category: number | null;
};

type OpenSkyTrack = {
  icao24: string;
  callsign: string;
  startTime: number;
  endTime: number;
  path: Array<[number, number, number, number, number]>; // [time, latitude, longitude, baro_altitude, true_track]
};

export type AircraftPosition = {
  icao24: string;
  callsign: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null; // meters
  speed: number | null; // m/s
  heading: number | null; // degrees
  verticalSpeed: number | null; // m/s
  onGround: boolean;
  lastContact: Date;
  squawk: string | null;
  originCountry: string;
};

export type FlightTrack = {
  icao24: string;
  callsign: string;
  path: Array<{
    timestamp: Date;
    latitude: number;
    longitude: number;
    altitude: number | null;
    heading: number | null;
  }>;
};

// Cache for position data (60 second TTL)
const positionCache = new Map<string, { data: AircraftPosition; timestamp: number }>();
const POSITION_CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Get live aircraft position by callsign (flight number)
 */
export async function getAircraftPosition(callsign: string): Promise<AircraftPosition | null> {
  const normalizedCallsign = callsign.trim().toUpperCase();
  const cacheKey = `pos:${normalizedCallsign}`;
  
  // Check cache
  const cached = positionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < POSITION_CACHE_TTL) {
    return cached.data;
  }

  try {
    // Search for aircraft by callsign
    const params = new URLSearchParams({
      callsign: normalizedCallsign,
    });

    const url = `${OPENSKY_BASE_URL}/states/all?${params.toString()}`;
    
    const fetchOptions: RequestInit = {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 30 },
    };

    // Add authentication if credentials are available
    if (OPENSKY_USERNAME && OPENSKY_PASSWORD) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Basic ${Buffer.from(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`).toString("base64")}`,
      };
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`OpenSky API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.states || !Array.isArray(data.states) || data.states.length === 0) {
      return null;
    }

    // Convert first state to position
    const state = data.states[0] as OpenSkyState;
    const position: AircraftPosition = {
      icao24: state.icao24,
      callsign: state.callsign,
      latitude: state.latitude,
      longitude: state.longitude,
      altitude: state.baro_altitude,
      speed: state.velocity,
      heading: state.true_track,
      verticalSpeed: state.vertical_rate,
      onGround: state.on_ground,
      lastContact: new Date(state.last_contact * 1000),
      squawk: state.squawk,
      originCountry: state.origin_country,
    };

    // Cache the result
    positionCache.set(cacheKey, { data: position, timestamp: Date.now() });

    return position;
  } catch (error) {
    console.error("[OpenSky] Get position error:", error);
    return null;
  }
}

/**
 * Get aircraft track (path history) for a flight
 */
export async function getAircraftTrack(icao24: string, time: number): Promise<FlightTrack | null> {
  try {
    const url = `${OPENSKY_BASE_URL}/tracks/all?icao24=${icao24}&time=${time}`;
    
    const fetchOptions: RequestInit = {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    };

    if (OPENSKY_USERNAME && OPENSKY_PASSWORD) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Basic ${Buffer.from(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`).toString("base64")}`,
      };
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as OpenSkyTrack;

    return {
      icao24: data.icao24,
      callsign: data.callsign,
      path: data.path.map((point) => ({
        timestamp: new Date(point[0] * 1000),
        latitude: point[1],
        longitude: point[2],
        altitude: point[3] ?? null,
        heading: point[4] ?? null,
      })),
    };
  } catch (error) {
    console.error("[OpenSky] Get track error:", error);
    return null;
  }
}

/**
 * Get all aircraft in a bounding box
 */
export async function getAircraftInBoundingBox(
  lamin: number, // min latitude
  lomin: number, // min longitude
  lamax: number, // max latitude
  lomax: number // max longitude
): Promise<AircraftPosition[]> {
  try {
    const params = new URLSearchParams({
      lamin: lamin.toString(),
      lomin: lomin.toString(),
      lamax: lamax.toString(),
      lomax: lomax.toString(),
    });

    const url = `${OPENSKY_BASE_URL}/states/all?${params.toString()}`;
    
    const fetchOptions: RequestInit = {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    };

    if (OPENSKY_USERNAME && OPENSKY_PASSWORD) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Basic ${Buffer.from(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`).toString("base64")}`,
      };
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (!data.states || !Array.isArray(data.states)) {
      return [];
    }

    return data.states.map((state: OpenSkyState) => ({
      icao24: state.icao24,
      callsign: state.callsign,
      latitude: state.latitude,
      longitude: state.longitude,
      altitude: state.baro_altitude,
      speed: state.velocity,
      heading: state.true_track,
      verticalSpeed: state.vertical_rate,
      onGround: state.on_ground,
      lastContact: new Date(state.last_contact * 1000),
      squawk: state.squawk,
      originCountry: state.origin_country,
    }));
  } catch (error) {
    console.error("[OpenSky] Bounding box error:", error);
    return [];
  }
}

/**
 * Calculate flight progress percentage based on position
 */
export function calculateFlightProgress(
  position: AircraftPosition,
  departure: { lat: number; lon: number },
  arrival: { lat: number; lon: number }
): number {
  if (!position.latitude || !position.longitude) {
    return 0;
  }

  // Simple great circle distance calculation
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const R = 6371; // Earth's radius in km
  
  const dLat1 = toRad(departure.lat);
  const dLon1 = toRad(departure.lon);
  const dLat2 = toRad(position.latitude);
  const dLon2 = toRad(position.longitude);
  const dLat3 = toRad(arrival.lat);
  const dLon3 = toRad(arrival.lon);
  
  // Distance from departure to current position
  const a1 = Math.sin((dLat2 - dLat1) / 2) ** 2 +
             Math.cos(dLat1) * Math.cos(dLat2) * Math.sin((dLon2 - dLon1) / 2) ** 2;
  const c1 = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1));
  const d1 = R * c1;
  
  // Distance from departure to arrival
  const a2 = Math.sin((dLat3 - dLat1) / 2) ** 2 +
             Math.cos(dLat1) * Math.cos(dLat3) * Math.sin((dLon3 - dLon1) / 2) ** 2;
  const c2 = 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));
  const d2 = R * c2;
  
  if (d2 === 0) return 0;
  
  const progress = (d1 / d2) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

/**
 * Check OpenSky API health
 */
export async function getOpenSkyHealth(): Promise<{ ok: boolean; latencyMs: number; remaining?: number }> {
  const startTime = Date.now();
  
  try {
    const url = `${OPENSKY_BASE_URL}/states/all?limit=1`;
    
    const fetchOptions: RequestInit = {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    };

    if (OPENSKY_USERNAME && OPENSKY_PASSWORD) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Basic ${Buffer.from(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`).toString("base64")}`,
      };
    }

    const response = await fetch(url, fetchOptions);
    const latencyMs = Date.now() - startTime;

    return { ok: response.ok, latencyMs };
  } catch {
    return { ok: false, latencyMs: Date.now() - startTime };
  }
}
