/**
 * Open-Meteo Weather API Provider
 * Free weather data, no API key required
 */

const OPEN_METEO_BASE_URL = process.env.OPEN_METEO_BASE_URL || "https://api.open-meteo.com/v1";

// Types for Open-Meteo API responses
type OpenMeteoCurrent = {
  time: string;
  interval: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  cloud_cover: number;
  pressure_msl: number;
  surface_pressure: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  visibility?: number; // Not always available
};

type OpenMeteoHourly = {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
  visibility: number[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
  wind_gusts_10m: number[];
};

type OpenMeteoDaily = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  wind_direction_10m_dominant: number[];
};

type OpenMeteoAlerts = {
  event: string;
  start: number;
  end: number;
  description: string;
  sender: string;
};

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current?: OpenMeteoCurrent;
  hourly?: OpenMeteoHourly;
  daily?: OpenMeteoDaily;
  alerts?: { alert: OpenMeteoAlerts[] };
};

export type WeatherData = {
  temperature: number; // Celsius
  humidity: number; // Percentage
  windSpeed: number; // km/h
  windDirection: number; // degrees
  windGusts: number; // km/h
  precipitation: number; // mm
  visibility: number | null; // meters
  cloudCover: number; // percentage
  pressure: number; // hPa
  weatherCode: number;
  isDay: boolean;
  description: string;
  alerts: WeatherAlert[];
  timestamp: Date;
};

export type WeatherAlert = {
  event: string;
  description: string;
  start: Date;
  end: Date;
  sender: string;
};

export type HourlyForecast = {
  time: Date;
  temperature: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
};

// Weather code descriptions (WMO Weather interpretation codes)
const weatherCodeMap: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

// Cache for weather data (10 min TTL)
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const WEATHER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Get current weather for coordinates
 */
export async function getWeatherByCoordinates(
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  const cacheKey = `weather:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
  
  // Check cache
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL) {
    return cached.data;
  }

  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
      hourly: "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,visibility,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant",
      timezone: "auto",
    });

    const url = `${OPEN_METEO_BASE_URL}/forecast?${params.toString()}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 600 }, // 10 minutes
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json() as OpenMeteoResponse;
    
    if (!data.current) {
      return null;
    }

    const current = data.current;

    // Convert weather code to description
    const description = weatherCodeMap[current.weather_code] || "Unknown";

    // Build weather data
    const weather: WeatherData = {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      windGusts: current.wind_gusts_10m,
      precipitation: current.precipitation,
      visibility: current.visibility ? current.visibility * 1000 : null, // Convert km to meters if available
      cloudCover: current.cloud_cover,
      pressure: current.pressure_msl,
      weatherCode: current.weather_code,
      isDay: current.is_day === 1,
      description,
      alerts: data.alerts?.alert.map((a) => ({
        event: a.event,
        description: a.description,
        start: new Date(a.start * 1000),
        end: new Date(a.end * 1000),
        sender: a.sender,
      })) ?? [],
      timestamp: new Date(),
    };

    // Cache the result
    weatherCache.set(cacheKey, { data: weather, timestamp: Date.now() });

    return weather;
  } catch (error) {
    console.error("[Open-Meteo] Weather error:", error);
    return null;
  }
}

/**
 * Get weather by airport code (requires airport coordinates)
 */
export async function getWeatherByAirport(
  airportCode: string,
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  const weather = await getWeatherByCoordinates(latitude, longitude);
  if (weather) {
    // Could add airport-specific context here
    return weather;
  }
  return null;
}

/**
 * Get hourly forecast for next 24 hours
 */
export async function getHourlyForecast(
  latitude: number,
  longitude: number
): Promise<HourlyForecast[]> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      hourly: "temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m",
      timezone: "auto",
      forecast_days: "1",
    });

    const url = `${OPEN_METEO_BASE_URL}/forecast?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json() as OpenMeteoResponse;
    
    if (!data.hourly) {
      return [];
    }

    const hourly = data.hourly;
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return hourly.time
      .map((time, i) => ({
        time: new Date(time),
        temperature: hourly.temperature_2m[i],
        precipitationProbability: hourly.precipitation_probability[i],
        precipitation: hourly.precipitation[i],
        weatherCode: hourly.weather_code[i],
        windSpeed: hourly.wind_speed_10m[i],
      }))
      .filter((h) => h.time >= now && h.time <= next24Hours);
  } catch (error) {
    console.error("[Open-Meteo] Forecast error:", error);
    return [];
  }
}

/**
 * Check if weather conditions may cause flight delays
 */
export function getWeatherDelayRisk(weather: WeatherData): "low" | "medium" | "high" {
  // High risk conditions
  if (
    weather.weatherCode >= 95 || // Thunderstorm
    weather.weatherCode === 67 || // Heavy freezing rain
    weather.weatherCode === 75 || // Heavy snow
    weather.weatherCode === 82 || // Violent rain showers
    weather.weatherCode === 86 || // Heavy snow showers
    weather.windGusts > 50 || // Very strong winds
    weather.visibility !== null && weather.visibility < 1000 // Very low visibility
  ) {
    return "high";
  }

  // Medium risk conditions
  if (
    (weather.weatherCode >= 71 && weather.weatherCode <= 77) || // Snow
    (weather.weatherCode >= 61 && weather.weatherCode <= 65) || // Rain
    weather.weatherCode === 45 || // Fog
    weather.weatherCode === 48 || // Rime fog
    weather.windGusts > 30 || // Strong winds
    weather.visibility !== null && weather.visibility < 3000 // Low visibility
  ) {
    return "medium";
  }

  return "low";
}

/**
 * Get weather description with delay risk context
 */
export function getWeatherWithRiskDescription(weather: WeatherData): string {
  const risk = getWeatherDelayRisk(weather);
  const baseDesc = weather.description;
  
  if (risk === "high") {
    return `${baseDesc} - High delay risk`;
  } else if (risk === "medium") {
    return `${baseDesc} - Moderate delay risk`;
  }
  
  return baseDesc;
}

/**
 * Check Open-Meteo API health
 */
export async function getOpenMeteoHealth(): Promise<{ ok: boolean; latencyMs: number }> {
  const startTime = Date.now();
  
  try {
    const url = `${OPEN_METEO_BASE_URL}/forecast?latitude=52.52&longitude=13.41&current=temperature_2m`;
    
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    const latencyMs = Date.now() - startTime;

    return { ok: response.ok, latencyMs };
  } catch {
    return { ok: false, latencyMs: Date.now() - startTime };
  }
}
