export type TrafficLevel = "low" | "moderate" | "heavy";

export type OperationalStatus =
  | "normal"
  | "minor_delays"
  | "heavy_delays"
  | "ground_stop";

/** Shape for UI cards until a live weather API is wired. */
export type AirportWeatherPlaceholder = {
  temperature: string;
  condition: string;
  wind: string;
  delayRisk: string;
};

export function weatherPlaceholderFromMock(
  m: AirportInsightMock
): AirportWeatherPlaceholder {
  return {
    temperature: `${m.temperatureC}°C`,
    condition: m.condition,
    wind: m.wind,
    delayRisk: m.arrivalDelayRisk,
  };
}

export interface AirportInsightMock {
  temperatureC: number;
  condition: string;
  wind: string;
  /** Human wind feel, e.g. "Windy" */
  windDescriptor: string;
  /** e.g. "10 km" */
  visibility: string;
  /** One-line delay risk for arrivals/ops */
  arrivalDelayRisk: string;
  weatherDelayHint: string;
  traffic: TrafficLevel;
  operational: OperationalStatus;
}

const DEFAULT: AirportInsightMock = {
  temperatureC: 18,
  condition: "Partly cloudy",
  wind: "12 kt NW",
  windDescriptor: "Breezy",
  visibility: "10 km",
  arrivalDelayRisk: "Low arrival delay risk",
  weatherDelayHint: "Low weather impact expected.",
  traffic: "moderate",
  operational: "normal",
};

const OVERRIDES: Record<string, Partial<AirportInsightMock>> = {
  IST: {
    temperatureC: 14,
    condition: "Light rain",
    wind: "18 kt NE",
    windDescriptor: "Windy",
    visibility: "6 km",
    arrivalDelayRisk: "Minor arrival delay risk",
    weatherDelayHint: "Possible arrival delay due to weather.",
    traffic: "heavy",
    operational: "minor_delays",
  },
  SAW: {
    temperatureC: 15,
    condition: "Cloudy",
    wind: "14 kt E",
    windDescriptor: "Breezy",
    visibility: "9 km",
    arrivalDelayRisk: "Low arrival delay risk",
    weatherDelayHint: "Brief holds possible; monitor arrivals.",
    traffic: "moderate",
    operational: "normal",
  },
  DUS: {
    temperatureC: 12,
    condition: "Cloudy",
    wind: "22 kt W",
    windDescriptor: "Windy",
    visibility: "8 km",
    arrivalDelayRisk: "Minor arrival delay risk",
    weatherDelayHint: "Possible arrival delay due to weather.",
    traffic: "low",
    operational: "normal",
  },
  CGK: {
    temperatureC: 29,
    condition: "Thunderstorms nearby",
    wind: "8 kt S",
    windDescriptor: "Gusty",
    visibility: "5 km",
    arrivalDelayRisk: "Elevated arrival delay risk",
    weatherDelayHint: "Convective weather may cause ground delays.",
    traffic: "heavy",
    operational: "minor_delays",
  },
  LHR: {
    temperatureC: 11,
    condition: "Fog patches",
    wind: "6 kt SW",
    windDescriptor: "Calm",
    visibility: "3 km",
    arrivalDelayRisk: "Moderate arrival delay risk",
    weatherDelayHint: "Reduced visibility may slow runway ops.",
    traffic: "heavy",
    operational: "heavy_delays",
  },
  DXB: {
    temperatureC: 32,
    condition: "Hazy sunshine",
    wind: "10 kt NW",
    windDescriptor: "Breezy",
    visibility: "7 km",
    arrivalDelayRisk: "Low arrival delay risk",
    weatherDelayHint: "Heat haze; minor ATC spacing possible.",
    traffic: "moderate",
    operational: "normal",
  },
  SIN: {
    temperatureC: 30,
    condition: "Scattered clouds",
    wind: "11 kt NE",
    windDescriptor: "Breezy",
    visibility: "10+ km",
    arrivalDelayRisk: "Low arrival delay risk",
    weatherDelayHint: "Typical afternoon build-ups; low delay risk.",
    traffic: "moderate",
    operational: "normal",
  },
};

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Illustrative only — not live METAR/ATFM data. */
export function getAirportInsightsMock(code: string): AirportInsightMock {
  const key = code.trim().toUpperCase();
  const o = OVERRIDES[key];
  if (o) return { ...DEFAULT, ...o };

  const h = hashCode(key);
  const temps = [8, 11, 15, 19, 24, 28];
  const conditions = [
    "Clear",
    "Cloudy",
    "Partly cloudy",
    "Light showers",
    "Windy",
  ];
  const winds = ["6 kt N", "14 kt SW", "18 kt W", "9 kt SE", "11 kt NE"];
  const feels = ["Calm", "Breezy", "Windy", "Gusty"] as const;
  const vis = ["4 km", "6 km", "8 km", "10 km", "10+ km"];
  const risks = [
    "Low arrival delay risk",
    "Minor arrival delay risk",
    "Moderate arrival delay risk",
  ];
  const trafficCycle: TrafficLevel[] = ["low", "moderate", "heavy"];
  const opsCycle: OperationalStatus[] = [
    "normal",
    "minor_delays",
    "heavy_delays",
    "ground_stop",
  ];

  return {
    temperatureC: temps[h % temps.length],
    condition: conditions[h % conditions.length],
    wind: winds[h % winds.length],
    windDescriptor: feels[h % feels.length],
    visibility: vis[h % vis.length],
    arrivalDelayRisk: risks[h % risks.length],
    weatherDelayHint:
      h % 4 === 0
        ? "Possible arrival delay due to weather."
        : "Low weather impact expected.",
    traffic: trafficCycle[h % trafficCycle.length],
    operational: opsCycle[h % opsCycle.length],
  };
}

export function trafficLabel(level: TrafficLevel): string {
  switch (level) {
    case "low":
      return "Low Traffic";
    case "moderate":
      return "Moderate Traffic";
    case "heavy":
      return "Heavy Traffic";
    default:
      return "Traffic";
  }
}

export function trafficBadgeClass(level: TrafficLevel): string {
  switch (level) {
    case "low":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-200";
    case "moderate":
      return "border-amber-500/40 bg-amber-500/15 text-amber-200";
    case "heavy":
      return "border-red-500/40 bg-red-500/15 text-red-200";
    default:
      return "border-white/20 bg-white/10 text-gray-200";
  }
}

export function operationalLabel(status: OperationalStatus): string {
  switch (status) {
    case "normal":
      return "Normal Operations";
    case "minor_delays":
      return "Minor Delays";
    case "heavy_delays":
      return "Heavy Delays";
    case "ground_stop":
      return "Ground Stop";
    default:
      return "Unknown";
  }
}

export function operationalBadgeClass(status: OperationalStatus): string {
  switch (status) {
    case "normal":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-100";
    case "minor_delays":
      return "border-amber-500/35 bg-amber-500/10 text-amber-100";
    case "heavy_delays":
      return "border-red-500/45 bg-red-500/15 text-red-100";
    case "ground_stop":
      return "border-red-500/45 bg-red-500/15 text-red-100";
    default:
      return "border-white/20 bg-white/10 text-gray-200";
  }
}
