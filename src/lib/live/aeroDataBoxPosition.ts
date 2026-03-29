import { getRapidApiHost, rapidApiHeaders } from "../server/rapidApiConfig";
import type { AircraftLivePosition } from "./types";

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return null;
}

function scoreLocationCandidate(o: Record<string, unknown>): number {
  let s = 0;
  if (num(o.latitude ?? o.lat) != null && num(o.longitude ?? o.lng ?? o.long) != null)
    s += 10;
  if (num(o.track ?? o.heading ?? o.trueTrack ?? o.direction) != null) s += 2;
  if (num(o.speed ?? o.groundSpeed ?? o.velocity ?? o.horizontalSpeed) != null)
    s += 2;
  if (num(o.altitude ?? o.baroAltitude ?? o.baro_altitude ?? o.geo_altitude) != null)
    s += 2;
  if (num(o.verticalSpeed ?? o.vertical_rate ?? o.vspeed) != null) s += 1;
  return s;
}

function pickBestLocationObject(root: unknown): Record<string, unknown> | null {
  let best: Record<string, unknown> | null = null;
  let bestScore = 0;

  const visit = (node: unknown, depth: number) => {
    if (depth > 14 || node == null) return;
    if (Array.isArray(node)) {
      for (const x of node) visit(x, depth + 1);
      return;
    }
    if (typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    const lat = num(o.latitude ?? o.lat);
    const lon = num(o.longitude ?? o.lng ?? o.long ?? o.lon);
    if (
      lat != null &&
      lon != null &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180
    ) {
      const sc = scoreLocationCandidate(o);
      if (sc > bestScore) {
        bestScore = sc;
        best = o;
      }
    }
    for (const v of Object.values(o)) visit(v, depth + 1);
  };

  visit(root, 0);
  return best;
}

function mapToPosition(
  o: Record<string, unknown>,
  source: string
): AircraftLivePosition | null {
  const lat = num(o.latitude ?? o.lat);
  const lon = num(o.longitude ?? o.lng ?? o.long ?? o.lon);
  if (lat == null || lon == null) return null;

  let altFt: number | null = num(
    o.altitude ?? o.baroAltitude ?? o.baro_altitude ?? o.geo_altitude
  );
  if (altFt != null && altFt < 500 && altFt > -200) {
    // likely meters from some providers
    altFt = altFt * 3.28084;
  } else if (altFt != null && altFt < 500) {
    altFt = altFt * 3.28084;
  }

  let speedKts = num(
    o.speed ?? o.groundSpeed ?? o.horizontalSpeed ?? o.velocity
  );
  if (speedKts != null && speedKts < 130 && speedKts > 3) {
    speedKts = speedKts * 1.94384;
  }

  const heading = num(o.track ?? o.heading ?? o.trueTrack ?? o.direction);
  let vsFpm = num(o.verticalSpeed ?? o.vertical_rate ?? o.vspeed);
  if (vsFpm != null && Math.abs(vsFpm) < 50) {
    vsFpm = vsFpm * 196.85;
  }

  const lastUpdated = new Date().toISOString();

  return {
    latitude: lat,
    longitude: lon,
    altitude: altFt != null ? Math.round(altFt) : null,
    speed: speedKts != null ? Math.round(speedKts) : null,
    heading: heading != null ? Math.round(heading % 360) : null,
    verticalSpeed: vsFpm != null ? Math.round(vsFpm) : null,
    lastUpdated,
    source,
    isLive: true,
  };
}

export async function tryAeroDataBoxLivePosition(
  flightNumber: string,
  apiKey: string
): Promise<AircraftLivePosition | null> {
  const host = getRapidApiHost();
  const numPart = flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const date = new Date().toISOString().slice(0, 10);
  const urls = [
    `https://${host}/flights/number/${encodeURIComponent(numPart)}/${date}?withLocation=true`,
    `https://${host}/flights/number/${encodeURIComponent(numPart)}/${date}/withLocation?withLocation=true`,
    `https://${host}/flights/number/${encodeURIComponent(numPart)}/${date}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: rapidApiHeaders(apiKey),
        cache: "no-store",
        next: { revalidate: 0 },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as unknown;
      const picked = pickBestLocationObject(data);
      if (!picked) continue;
      const pos = mapToPosition(picked, "AeroDataBox");
      if (pos) return pos;
    } catch {
      /* next url */
    }
  }
  return null;
}
