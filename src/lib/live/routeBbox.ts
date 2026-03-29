import { coordsForAirportCode, type LatLng } from "../airportCoordinates";

/** Padding in degrees around dep–arr great-circle box for OpenSky bbox queries. */
export function openSkyBBoxForAirports(
  depCode: string | null | undefined,
  arrCode: string | null | undefined,
  padDeg = 3
): { lamin: number; lamax: number; lomin: number; lomax: number } | null {
  const dep = coordsForAirportCode(depCode);
  const arr = coordsForAirportCode(arrCode);
  if (!dep || !arr) return null;
  return expandBbox(dep, arr, padDeg);
}

export function expandBbox(
  dep: LatLng,
  arr: LatLng,
  padDeg: number
): { lamin: number; lamax: number; lomin: number; lomax: number } {
  let minLat = Math.min(dep[0], arr[0]) - padDeg;
  let maxLat = Math.max(dep[0], arr[0]) + padDeg;
  let minLon = Math.min(dep[1], arr[1]) - padDeg;
  let maxLon = Math.max(dep[1], arr[1]) + padDeg;
  minLat = Math.max(-85, minLat);
  maxLat = Math.min(85, maxLat);
  minLon = Math.max(-180, minLon);
  maxLon = Math.min(180, maxLon);
  return { lamin: minLat, lamax: maxLat, lomin: minLon, lomax: maxLon };
}
