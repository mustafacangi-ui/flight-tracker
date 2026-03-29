import { openskyCallsignCandidates, callsignRoughMatch } from "./callsignCandidates";
import { openSkyBBoxForAirports } from "./routeBbox";
import type { AircraftLivePosition } from "./types";

type OpenSkyState = (string | number | boolean | null)[];

function openskyAuthHeader(): Record<string, string> {
  const u = process.env.OPENSKY_USERNAME?.trim();
  const p = process.env.OPENSKY_PASSWORD?.trim();
  if (!u || !p) return {};
  const token = Buffer.from(`${u}:${p}`, "utf8").toString("base64");
  return { Authorization: `Basic ${token}` };
}

function stateToPosition(s: OpenSkyState): AircraftLivePosition | null {
  const lat = s[6] as number | null | undefined;
  const lon = s[5] as number | null | undefined;
  if (
    lat == null ||
    lon == null ||
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return null;
  }
  const baroM = s[7] as number | null | undefined;
  const velocityMs = s[9] as number | null | undefined;
  const track = s[10] as number | null | undefined;
  const vertMs = s[11] as number | null | undefined;
  const timePos = s[3] as number | null | undefined;
  const lastContact = s[4] as number | null | undefined;

  const t = timePos ?? lastContact;
  const lastUpdated =
    typeof t === "number" && t > 0
      ? new Date(t * 1000).toISOString()
      : new Date().toISOString();

  const altFt =
    typeof baroM === "number" && Number.isFinite(baroM)
      ? Math.round(baroM * 3.28084)
      : null;
  const speedKts =
    typeof velocityMs === "number" && Number.isFinite(velocityMs)
      ? Math.round(velocityMs * 1.94384)
      : null;
  const heading =
    typeof track === "number" && Number.isFinite(track)
      ? Math.round(track % 360)
      : null;
  const vsFpm =
    typeof vertMs === "number" && Number.isFinite(vertMs)
      ? Math.round(vertMs * 196.85)
      : null;

  return {
    latitude: lat,
    longitude: lon,
    altitude: altFt,
    speed: speedKts,
    heading,
    verticalSpeed: vsFpm,
    lastUpdated,
    source: "OpenSky Network",
    isLive: true,
  };
}

export async function tryOpenSkyLivePosition(
  flightNumber: string,
  depCode?: string | null,
  arrCode?: string | null
): Promise<AircraftLivePosition | null> {
  const bbox = openSkyBBoxForAirports(depCode, arrCode, 4);
  if (!bbox) return null;

  const params = new URLSearchParams({
    lamin: String(bbox.lamin),
    lamax: String(bbox.lamax),
    lomin: String(bbox.lomin),
    lomax: String(bbox.lomax),
  });
  const url = `https://opensky-network.org/api/states/all?${params.toString()}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { ...openskyAuthHeader() },
      cache: "no-store",
      next: { revalidate: 0 },
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  let data: { states?: OpenSkyState[] | null };
  try {
    data = (await res.json()) as { states?: OpenSkyState[] | null };
  } catch {
    return null;
  }
  const states = data.states;
  if (!Array.isArray(states) || states.length === 0) return null;

  const candidates = openskyCallsignCandidates(flightNumber);
  if (candidates.length === 0) return null;

  for (const raw of states) {
    if (!Array.isArray(raw) || raw.length < 11) continue;
    const cs = raw[1];
    if (typeof cs !== "string") continue;
    if (!callsignRoughMatch(cs, candidates)) continue;
    const onGround = raw[8];
    if (onGround === true) continue;
    return stateToPosition(raw);
  }

  return null;
}
