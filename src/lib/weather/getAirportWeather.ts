/**
 * Airport weather & operational context.
 * Phase 1: deterministic mock from airport IATA. Replace `getAirportWeatherSnapshot`
 * internals with `fetchAirportWeatherFromApi` when a provider is wired.
 */

export type WeatherConditionCode =
  | "clear"
  | "partly_cloudy"
  | "cloudy"
  | "light_rain"
  | "heavy_rain"
  | "snow"
  | "storm"
  | "fog";

export type WeatherDelayRiskLevel = "low" | "moderate" | "high";

export type OperationalStatusKind =
  | "on_time"
  | "moderate_delays"
  | "severe_delays"
  | "runway_congestion"
  | "heavy_traffic"
  | "weather_warning";

export interface AirportWeatherSnapshot {
  airportCode: string;
  airportLabel?: string;
  temperatureC: number;
  conditionCode: WeatherConditionCode;
  conditionLabel: string;
  windSpeedKph: number;
  /** Meters; aviation-style */
  visibilityM: number;
  /** Last hour liquid equivalent, mm */
  precipitationMm: number;
  /** Local-style icon (emoji); swap for icon font / SVG when API returns codes */
  icon: string;
}

export interface WeatherImpactAlert {
  id: string;
  message: string;
  variant: "info" | "warning" | "danger";
  /** "departure" | "arrival" | "both" for analytics later */
  scope?: string;
}

export interface RouteWeatherInsights {
  departure: AirportWeatherSnapshot;
  arrival: AirportWeatherSnapshot;
  departureOperational: OperationalStatusKind;
  arrivalOperational: OperationalStatusKind;
  delayRisk: WeatherDelayRiskLevel;
  delayReasons: string[];
  banners: WeatherImpactAlert[];
}

const CONDITIONS: {
  code: WeatherConditionCode;
  label: string;
  icon: string;
}[] = [
  { code: "clear", label: "Clear", icon: "☀️" },
  { code: "partly_cloudy", label: "Partly cloudy", icon: "⛅" },
  { code: "cloudy", label: "Cloudy", icon: "☁️" },
  { code: "light_rain", label: "Light rain", icon: "🌧️" },
  { code: "heavy_rain", label: "Heavy rain", icon: "🌧️" },
  { code: "snow", label: "Snow", icon: "❄️" },
  { code: "storm", label: "Thunderstorms", icon: "⛈️" },
  { code: "fog", label: "Fog / mist", icon: "🌫️" },
];

const OPS_ORDER: OperationalStatusKind[] = [
  "on_time",
  "moderate_delays",
  "severe_delays",
  "runway_congestion",
  "heavy_traffic",
  "weather_warning",
];

function normalizeIata(raw: string | null | undefined): string {
  if (!raw) return "XXX";
  const t = raw.replace(/[^A-Za-z]/g, "").toUpperCase();
  return t.slice(0, 4) || "XXX";
}

/** Deterministic 0..n-1 from string */
function hashSlot(seed: string, salt: string, modulo: number): number {
  let h = 2166136261;
  const s = `${seed}|${salt}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % modulo;
}

function conditionFromHash(h: number): (typeof CONDITIONS)[number] {
  return CONDITIONS[h % CONDITIONS.length]!;
}

function baseTempForCode(code: string): number {
  const c = code.charCodeAt(0) ?? 65;
  return 8 + (c % 18);
}

/**
 * Mock snapshot for an airport. Stable for the same IATA across renders.
 */
export function getAirportWeatherSnapshot(
  airportCode: string | null | undefined,
  airportLabel?: string
): AirportWeatherSnapshot {
  const iata = normalizeIata(airportCode);
  const condIdx = hashSlot(iata, "cond", CONDITIONS.length);
  const cond = conditionFromHash(condIdx);
  const jitter = hashSlot(iata, "temp", 9) - 4;
  const base = baseTempForCode(iata);
  let temp = base + jitter;
  if (cond.code === "snow") temp = Math.min(temp, 2);
  if (cond.code === "clear") temp += 4;

  const wind = 6 + hashSlot(iata, "wind", 55);
  const visBase = 800 + hashSlot(iata, "vis", 9200);
  let visibilityM = visBase;
  if (cond.code === "fog") visibilityM = 400 + hashSlot(iata, "fogv", 1200);
  if (cond.code === "heavy_rain" || cond.code === "storm")
    visibilityM = Math.min(visibilityM, 3500);

  let precip = 0;
  if (
    cond.code === "light_rain" ||
    cond.code === "heavy_rain" ||
    cond.code === "storm"
  ) {
    precip = cond.code === "light_rain" ? 0.8 + hashSlot(iata, "p1", 8) / 10 : 0;
    if (cond.code === "heavy_rain") precip = 4 + hashSlot(iata, "p2", 25) / 5;
    if (cond.code === "storm") precip = 6 + hashSlot(iata, "p3", 40) / 4;
  }
  if (cond.code === "snow") precip = 0.5 + hashSlot(iata, "ps", 15) / 10;

  return {
    airportCode: iata,
    airportLabel,
    temperatureC: Math.round(temp * 10) / 10,
    conditionCode: cond.code,
    conditionLabel: cond.label,
    windSpeedKph: wind,
    visibilityM: Math.round(visibilityM),
    precipitationMm: Math.round(precip * 10) / 10,
    icon: cond.icon,
  };
}

export function getOperationalStatusForAirport(
  airportCode: string | null | undefined,
  weather: AirportWeatherSnapshot
): OperationalStatusKind {
  const iata = normalizeIata(airportCode);
  let idx = hashSlot(iata, "ops", OPS_ORDER.length);

  if (
    weather.conditionCode === "storm" ||
    weather.conditionCode === "heavy_rain"
  ) {
    idx = Math.max(idx, OPS_ORDER.indexOf("weather_warning"));
  }
  if (weather.visibilityM < 1500) {
    idx = Math.max(idx, OPS_ORDER.indexOf("moderate_delays"));
  }
  if (weather.windSpeedKph > 45) {
    idx = Math.max(idx, OPS_ORDER.indexOf("moderate_delays"));
  }

  const congestionBoost = hashSlot(iata, "cong", 100);
  if (congestionBoost < 18) {
    idx = Math.max(idx, OPS_ORDER.indexOf("runway_congestion"));
  } else if (congestionBoost < 30) {
    idx = Math.max(idx, OPS_ORDER.indexOf("heavy_traffic"));
  }

  return OPS_ORDER[Math.min(idx, OPS_ORDER.length - 1)]!;
}

function badWeather(w: AirportWeatherSnapshot): boolean {
  return (
    w.conditionCode === "heavy_rain" ||
    w.conditionCode === "storm" ||
    w.conditionCode === "snow" ||
    w.conditionCode === "fog"
  );
}

export function computeWeatherDelayRisk(
  dep: AirportWeatherSnapshot,
  arr: AirportWeatherSnapshot
): { level: WeatherDelayRiskLevel; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const consider = (w: AirportWeatherSnapshot, end: "departure" | "arrival") => {
    if (badWeather(w)) {
      score += 2;
      reasons.push(
        end === "departure"
          ? "Challenging weather at origin"
          : "Challenging weather at destination"
      );
    }
    if (w.visibilityM < 2000) {
      score += 2;
      reasons.push(
        end === "departure"
          ? "Low visibility near departure airport"
          : "Low visibility near arrival airport"
      );
    }
    if (w.windSpeedKph >= 40) {
      score += 1;
      reasons.push(
        end === "departure"
          ? "Strong winds at departure"
          : "Strong winds at destination"
      );
    }
    if (w.conditionCode === "snow") {
      score += 2;
      reasons.push(
        end === "departure" ? "Snow at origin" : "Snow at destination"
      );
    }
    if (w.conditionCode === "storm") {
      score += 2;
      reasons.push(
        end === "departure"
          ? "Storms reported at origin"
          : "Storms reported at destination"
      );
    }
  };

  consider(dep, "departure");
  consider(arr, "arrival");

  const deduped = [...new Set(reasons)];
  let level: WeatherDelayRiskLevel = "low";
  if (score >= 5) level = "high";
  else if (score >= 2) level = "moderate";

  return { level, reasons: deduped.slice(0, 6) };
}

function buildBanners(
  dep: AirportWeatherSnapshot,
  arr: AirportWeatherSnapshot,
  depOps: OperationalStatusKind,
  arrOps: OperationalStatusKind
): WeatherImpactAlert[] {
  const out: WeatherImpactAlert[] = [];

  if (
    dep.conditionCode === "heavy_rain" ||
    dep.precipitationMm >= 3
  ) {
    out.push({
      id: "dep-rain",
      message: "Heavy rain may affect departure times",
      variant: "warning",
      scope: "departure",
    });
  }

  if (arr.windSpeedKph >= 32 || dep.windSpeedKph >= 32) {
    const atDest = arr.windSpeedKph >= 32;
    out.push({
      id: "wind",
      message: atDest
        ? "Strong winds reported near destination airport"
        : "Strong winds reported near departure airport",
      variant: "warning",
      scope: atDest ? "arrival" : "departure",
    });
  }

  if (arr.visibilityM < 2500 || dep.visibilityM < 2500) {
    out.push({
      id: "vis",
      message: "Low visibility may increase arrival delays",
      variant: "warning",
      scope: "arrival",
    });
  }

  if (
    depOps === "runway_congestion" ||
    arrOps === "runway_congestion" ||
    depOps === "moderate_delays" ||
    arrOps === "moderate_delays"
  ) {
    out.push({
      id: "cong",
      message: "Airport currently experiencing moderate congestion",
      variant: "info",
      scope: "both",
    });
  }

  if (depOps === "severe_delays" || arrOps === "severe_delays") {
    out.push({
      id: "sev",
      message:
        "Severe delays reported at one or both airports — check airline advisories",
      variant: "danger",
      scope: "both",
    });
  }

  if (depOps === "weather_warning" || arrOps === "weather_warning") {
    out.push({
      id: "wx-warn",
      message: "Weather warning in effect for airport operations",
      variant: "danger",
      scope: "both",
    });
  }

  const seen = new Set<string>();
  return out.filter((b) => {
    if (seen.has(b.message)) return false;
    seen.add(b.message);
    return true;
  });
}

/**
 * Full route context for UI: two airports, ops, delay risk, banners.
 */
export function getRouteWeatherInsights(
  departureAirportCode: string | null | undefined,
  arrivalAirportCode: string | null | undefined,
  labels?: { departure?: string; arrival?: string }
): RouteWeatherInsights {
  const dep = getAirportWeatherSnapshot(
    departureAirportCode,
    labels?.departure
  );
  const arr = getAirportWeatherSnapshot(arrivalAirportCode, labels?.arrival);
  const departureOperational = getOperationalStatusForAirport(
    departureAirportCode,
    dep
  );
  const arrivalOperational = getOperationalStatusForAirport(
    arrivalAirportCode,
    arr
  );
  const { level, reasons } = computeWeatherDelayRisk(dep, arr);
  const banners = buildBanners(dep, arr, departureOperational, arrivalOperational);

  return {
    departure: dep,
    arrival: arr,
    departureOperational,
    arrivalOperational,
    delayRisk: level,
    delayReasons: reasons,
    banners,
  };
}

/**
 * Placeholder for a future HTTP weather API. Keep the same return shape as mock.
 */
export async function fetchAirportWeather(
  airportCode: string | null | undefined,
  airportLabel?: string
): Promise<AirportWeatherSnapshot> {
  // await fetch(`/api/weather?iata=...`)
  return getAirportWeatherSnapshot(airportCode, airportLabel);
}
