/** Live ADS-B / API sample (shared server + client shape). */

export type AircraftLivePosition = {
  latitude: number;
  longitude: number;
  /** Feet MSL / baro when known */
  altitude: number | null;
  /** Ground speed, knots */
  speed: number | null;
  /** True track, degrees 0–360 */
  heading: number | null;
  /** Feet per minute, positive up */
  verticalSpeed: number | null;
  /** ISO 8601 */
  lastUpdated: string;
  /** e.g. AeroDataBox, OpenSky, AviationStack */
  source: string;
  isLive: boolean;
};

export type AircraftLivePositionApiResponse = {
  position: AircraftLivePosition | null;
  regionalLabel: string | null;
};
