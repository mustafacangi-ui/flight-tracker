/**
 * Approximate WGS84 centers for map routing. Fallbacks avoid crashes when codes are unknown.
 */

export type LatLng = [number, number];

/** Major hubs + common demo airports (IATA → [lat, lng]). */
const KNOWN: Record<string, LatLng> = {
  IST: [41.2753, 28.7519],
  SAW: [40.8986, 29.3092],
  ESB: [40.1281, 32.995],
  ADB: [38.2924, 27.157],
  AYT: [36.8987, 30.8005],
  DUS: [51.2895, 6.7668],
  MUC: [48.3538, 11.7861],
  FRA: [50.0379, 8.5622],
  BER: [52.3667, 13.5033],
  LHR: [51.47, -0.4543],
  LGW: [51.1537, -0.1821],
  CDG: [49.0097, 2.5479],
  AMS: [52.3105, 4.7683],
  MAD: [40.4983, -3.5676],
  BCN: [41.2974, 2.0833],
  FCO: [41.8003, 12.2389],
  ZRH: [47.4647, 8.5492],
  VIE: [48.1103, 16.5697],
  JFK: [40.6413, -73.7781],
  EWR: [40.6895, -74.1745],
  LAX: [33.9416, -118.4085],
  ORD: [41.9742, -87.9073],
  ATL: [33.6407, -84.4277],
  DXB: [25.2532, 55.3657],
  DOH: [25.273056, 51.608056],
  SIN: [1.3644, 103.9915],
  HKG: [22.308, 113.9185],
  NRT: [35.772, 140.3929],
  ICN: [37.4602, 126.4407],
  SYD: [-33.9461, 151.1772],
  CAI: [30.1219, 31.4056],
  TLV: [32.0005, 34.8707],
  ARN: [59.6498, 17.9238],
  OSL: [60.1975, 11.1004],
  CPH: [55.618, 12.6508],
  BRU: [50.901, 4.4844],
  WAW: [52.1657, 20.9671],
  PRG: [50.1008, 14.26],
  BUD: [47.4369, 19.2556],
  OTP: [44.5711, 26.085],
  SOF: [42.6952, 23.4062],
  SKG: [40.5197, 22.9709],
  ATH: [37.9364, 23.9445],
  LIS: [38.7813, -9.1357],
  OPO: [41.2481, -8.6814],
  DUB: [53.4213, -6.2701],
  MAN: [53.3537, -2.275],
  EDI: [55.95, -3.3725],
};

const DEFAULT_DEP: LatLng = [41.2753, 28.7519];
const DEFAULT_ARR: LatLng = [51.47, -0.4543];

function normalizeCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (t.length === 3 || t.length === 4) return t.slice(0, 4);
  return null;
}

/** Deterministic pseudo-coordinates for unknown IATA (keeps map stable). */
function hashCoords(iata: string): LatLng {
  let h = 0;
  for (let i = 0; i < iata.length; i += 1) {
    h = (h * 31 + iata.charCodeAt(i)) | 0;
  }
  const lat = 25 + (Math.abs(h) % 25) + (Math.abs(h >> 7) % 10) / 10;
  const lng = -40 + (Math.abs(h >> 14) % 100) + (Math.abs(h >> 22) % 10) / 10;
  return [Math.min(70, Math.max(-50, lat)), Math.max(-170, Math.min(170, lng))];
}

export function coordsForAirportCode(
  code: string | null | undefined
): LatLng | null {
  const c = normalizeCode(code);
  if (!c) return null;
  const hit = KNOWN[c] ?? KNOWN[c.slice(0, 3)];
  if (hit) return hit;
  return hashCoords(c.slice(0, 3));
}

export function resolveRouteLatLng(
  depCode: string | null | undefined,
  arrCode: string | null | undefined
): { dep: LatLng; arr: LatLng } {
  let dep = coordsForAirportCode(depCode) ?? DEFAULT_DEP;
  let arr = coordsForAirportCode(arrCode) ?? DEFAULT_ARR;
  const same =
    Math.abs(dep[0] - arr[0]) < 0.05 && Math.abs(dep[1] - arr[1]) < 0.05;
  if (same) {
    arr = [arr[0] + 1.2, arr[1] + 1.2];
  }
  return { dep, arr };
}
