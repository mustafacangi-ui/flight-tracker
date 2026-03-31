import { NextRequest, NextResponse } from "next/server";

import { getWeatherByCoordinates, type WeatherData } from "../../../lib/providers/openmeteo";
import { captureError } from "../../../lib/monitoring/captureError";

// Airport coordinates database (simplified - would be expanded)
const AIRPORT_COORDINATES: Record<string, { lat: number; lon: number; name: string }> = {
  IST: { lat: 41.2753, lon: 28.7519, name: "Istanbul Airport" },
  SAW: { lat: 40.8986, lon: 29.3092, name: "Sabiha Gokcen" },
  JFK: { lat: 40.6413, lon: -73.7781, name: "John F. Kennedy" },
  LHR: { lat: 51.47, lon: -0.4614, name: "Heathrow" },
  CDG: { lat: 49.0097, lon: 2.5479, name: "Charles de Gaulle" },
  FRA: { lat: 50.0379, lon: 8.5622, name: "Frankfurt" },
  AMS: { lat: 52.3105, lon: 4.7683, name: "Amsterdam Schiphol" },
  DXB: { lat: 25.2532, lon: 55.3657, name: "Dubai" },
  SIN: { lat: 1.3644, lon: 103.9915, name: "Changi" },
  HND: { lat: 35.5494, lon: 139.7798, name: "Haneda" },
  LAX: { lat: 33.9416, lon: -118.4085, name: "Los Angeles" },
  ORD: { lat: 41.9742, lon: -87.9073, name: "O'Hare" },
  MUC: { lat: 48.3538, lon: 11.7861, name: "Munich" },
  ZRH: { lat: 47.4647, lon: 8.5492, name: "Zurich" },
  MAD: { lat: 40.4983, lon: -3.5676, name: "Madrid" },
  BCN: { lat: 41.2974, lon: 2.0833, name: "Barcelona" },
  FCO: { lat: 41.8003, lon: 12.2389, name: "Rome Fiumicino" },
  MXP: { lat: 45.6301, lon: 8.7235, name: "Milan Malpensa" },
  DUS: { lat: 51.2895, lon: 6.7668, name: "Dusseldorf" },
  CGN: { lat: 50.8659, lon: 7.1427, name: "Cologne" },
};

export type WeatherApiResponse = {
  weather: WeatherData | null;
  airport: string;
  error?: string;
};

export async function GET(request: NextRequest) {
  const airportCode = request.nextUrl.searchParams.get("airport")?.trim().toUpperCase();
  
  if (!airportCode) {
    return NextResponse.json(
      { weather: null, airport: "", error: "Airport code required" },
      { status: 400 }
    );
  }

  // Get coordinates for airport
  const coords = AIRPORT_COORDINATES[airportCode];
  if (!coords) {
    return NextResponse.json(
      { weather: null, airport: airportCode, error: "Airport coordinates not available" },
      { status: 404 }
    );
  }

  try {
    const weather = await getWeatherByCoordinates(coords.lat, coords.lon);
    
    if (!weather) {
      return NextResponse.json(
        { weather: null, airport: airportCode, error: "Weather data unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      weather,
      airport: airportCode,
    });
  } catch (error) {
    captureError(error instanceof Error ? error : new Error(String(error)), {
      area: "api_weather",
      tags: { airport: airportCode },
      level: "warning",
    });
    
    return NextResponse.json(
      { weather: null, airport: airportCode, error: "Failed to fetch weather" },
      { status: 500 }
    );
  }
}
