export type AeroAirport = {
  name?: string;
  shortName?: string | null;
  municipalityName?: string | null;
  iata?: string | null;
  icao?: string | null;
  /** IANA zone when provided by AeroDataBox (airport search / nested objects). */
  timeZone?: string | null;
  /** Alternate field name in some payloads */
  ianaTimeZone?: string | null;
};

export type AeroAircraft = {
  model?: string | null;
  modelCode?: string | null;
  reg?: string | null;
};

export type AeroDateTime = {
  local?: string;
  utc?: string;
};

export type AeroMovement = {
  airport?: AeroAirport;
  scheduledTime?: AeroDateTime | null;
  revisedTime?: AeroDateTime | null;
  predictedTime?: AeroDateTime | null;
  /** Off-block / wheels-up / in-block when reported */
  actualTime?: AeroDateTime | null;
  gate?: string | null;
  terminal?: string | null;
};

export type AeroAirline = {
  name?: string | null;
  iata?: string | null;
  icao?: string | null;
};

export type AeroAirportFlight = {
  number: string;
  status: string;
  airline?: AeroAirline | null;
  /** Some payloads use carrier / operator instead of airline. */
  carrier?: AeroAirline | null;
  operator?: AeroAirline | null;
  departure?: AeroMovement | null;
  arrival?: AeroMovement | null;
  aircraft?: AeroAircraft | null;
};

export function parseAirportCode(raw: string): string {
  const t = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (/^[A-Z]{3}$/.test(t) || /^[A-Z]{4}$/.test(t)) return t;
  return "IST";
}
