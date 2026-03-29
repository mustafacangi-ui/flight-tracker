import { tryAdsbExchangeLivePosition } from "./adsbExchangePosition";
import { tryAeroDataBoxLivePosition } from "./aeroDataBoxPosition";
import { tryAviationStackLivePosition } from "./aviationStackPosition";
import { tryOpenSkyLivePosition } from "./openSkyPosition";
import { getRegionalLocationLabel } from "./regionalLabel";
import type { AircraftLivePositionApiResponse } from "./types";

export type { AircraftLivePosition, AircraftLivePositionApiResponse } from "./types";

export type GetAircraftLivePositionInput = {
  flightNumber: string;
  departureAirportCode?: string | null;
  arrivalAirportCode?: string | null;
};

/**
 * Resolves best available live position (server-only).
 * Priority: AeroDataBox → OpenSky → AviationStack → ADS-B Exchange stub.
 */
export async function getAircraftLivePosition(
  input: GetAircraftLivePositionInput
): Promise<AircraftLivePositionApiResponse> {
  const fn = input.flightNumber?.trim();
  if (!fn) {
    return { position: null, regionalLabel: null };
  }

  const rapidKey = process.env.RAPIDAPI_KEY?.trim();
  if (rapidKey) {
    const a = await tryAeroDataBoxLivePosition(fn, rapidKey);
    if (a) {
      return {
        position: a,
        regionalLabel: getRegionalLocationLabel(
          a.latitude,
          a.longitude,
          input.arrivalAirportCode
        ),
      };
    }
  }

  const o = await tryOpenSkyLivePosition(
    fn,
    input.departureAirportCode,
    input.arrivalAirportCode
  );
  if (o) {
    return {
      position: o,
      regionalLabel: getRegionalLocationLabel(
        o.latitude,
        o.longitude,
        input.arrivalAirportCode
      ),
    };
  }

  const avKey = process.env.AVIATIONSTACK_API_KEY?.trim();
  if (avKey) {
    const iata = fn.replace(/\s+/g, "").toUpperCase();
    const v = await tryAviationStackLivePosition(iata, avKey);
    if (v) {
      return {
        position: v,
        regionalLabel: getRegionalLocationLabel(
          v.latitude,
          v.longitude,
          input.arrivalAirportCode
        ),
      };
    }
  }

  const adsbKey = process.env.ADSBX_API_KEY?.trim();
  if (adsbKey) {
    const x = await tryAdsbExchangeLivePosition(fn, adsbKey);
    if (x) {
      return {
        position: x,
        regionalLabel: getRegionalLocationLabel(
          x.latitude,
          x.longitude,
          input.arrivalAirportCode
        ),
      };
    }
  }

  return { position: null, regionalLabel: null };
}
