import type { LatLng } from "../airportCoordinates";
import { coordsForAirportCode } from "../airportCoordinates";

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const h =
    s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

type Box = { name: string; minLat: number; maxLat: number; minLon: number; maxLon: number };

const BOXES: Box[] = [
  { name: "Over Turkey", minLat: 35.8, maxLat: 42.3, minLon: 25.5, maxLon: 45.2 },
  { name: "Over Germany", minLat: 47.2, maxLat: 55.2, minLon: 5.5, maxLon: 15.5 },
  { name: "Near Frankfurt", minLat: 49.8, maxLat: 50.6, minLon: 8.0, maxLon: 9.2 },
  { name: "Crossing the Alps", minLat: 44.5, maxLat: 47.8, minLon: 5.5, maxLon: 17.2 },
  { name: "Over France", minLat: 41.2, maxLat: 51.2, minLon: -5.5, maxLon: 9.8 },
  { name: "Over the UK", minLat: 49.5, maxLat: 58.8, minLon: -8.2, maxLon: 2.0 },
  { name: "Over the North Atlantic", minLat: 50.0, maxLat: 65.0, minLon: -60.0, maxLon: -10.0 },
  { name: "Over the United States", minLat: 24.5, maxLat: 49.5, minLon: -125.0, maxLon: -66.0 },
  { name: "Over the Middle East", minLat: 12.0, maxLat: 32.0, minLon: 34.0, maxLon: 56.0 },
];

function inBox(lat: number, lon: number, b: Box): boolean {
  return (
    lat >= b.minLat &&
    lat <= b.maxLat &&
    lon >= b.minLon &&
    lon <= b.maxLon
  );
}

/**
 * Human-friendly region line for map UI (not navigation-grade).
 */
export function getRegionalLocationLabel(
  lat: number,
  lon: number,
  arrivalAirportCode?: string | null
): string {
  const arr = coordsForAirportCode(arrivalAirportCode);
  if (arr) {
    const d = haversineKm([lat, lon], arr);
    if (d < 85) {
      return "Approaching destination";
    }
    if (d < 220) {
      return "Near destination";
    }
  }

  for (const b of BOXES) {
    if (inBox(lat, lon, b)) {
      return b.name;
    }
  }

  return "En route";
}
