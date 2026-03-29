import { captureError } from "../monitoring/captureError";
import type { AircraftLivePosition } from "./types";

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return null;
}

export async function tryAviationStackLivePosition(
  flightIata: string,
  accessKey: string
): Promise<AircraftLivePosition | null> {
  const date = new Date().toISOString().slice(0, 10);
  const params = new URLSearchParams({
    access_key: accessKey,
    flight_iata: flightIata.replace(/\s+/g, "").toUpperCase(),
    flight_date: date,
  });
  const url = `https://api.aviationstack.com/v1/flights?${params.toString()}`;

  try {
    const res = await fetch(url, { cache: "no-store", next: { revalidate: 0 } });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      data?: Array<{ live?: Record<string, unknown> | null }>;
    };
    const row = body.data?.[0];
    const live = row?.live;
    if (!live || typeof live !== "object") return null;

    const lat = num(live.latitude);
    const lon = num(live.longitude);
    if (lat == null || lon == null) return null;

    const alt = num(live.altitude);
    const speed = num(live.speed_horizontal ?? live.speed);
    const dir = num(live.direction);
    const vs = num(live.speed_vertical);

    return {
      latitude: lat,
      longitude: lon,
      altitude: alt != null ? Math.round(alt) : null,
      speed: speed != null ? Math.round(speed) : null,
      heading: dir != null ? Math.round(dir % 360) : null,
      verticalSpeed: vs != null ? Math.round(vs) : null,
      lastUpdated: new Date().toISOString(),
      source: "AviationStack",
      isLive: true,
    };
  } catch (e) {
    captureError(e, {
      area: "aviationstack_live_position",
      tags: { flight: flightIata.replace(/\s+/g, "").toUpperCase().slice(0, 12) },
      level: "warning",
    });
    return null;
  }
}
