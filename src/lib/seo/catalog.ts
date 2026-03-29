/** Curated entries for SSG + sitemap + richer SEO copy. Unknown codes still render with fallbacks. */

export type AirportSeoMeta = {
  name: string;
  city: string;
  country: string;
};

export type AirlineSeoMeta = {
  name: string;
  country: string;
  /** Short alliance hint for SEO copy */
  alliance?: string;
};

export type RouteSeoMeta = {
  /** Typical block time in hours (illustrative) */
  typicalHours: number;
  /** Airline IATA codes often used on this city pair (illustrative) */
  suggestedAirlines: string[];
};

export const SEO_AIRPORT_CODES = [
  "IST",
  "SAW",
  "JFK",
  "LAX",
  "LHR",
  "CDG",
  "FRA",
  "AMS",
  "DXB",
  "DOH",
  "SIN",
  "FCO",
  "MAD",
  "BCN",
  "ZRH",
  "VIE",
  "CPH",
  "ARN",
  "DUB",
] as const;

export const AIRPORT_SEO_META: Record<string, AirportSeoMeta> = {
  IST: { name: "Istanbul Airport", city: "Istanbul", country: "Türkiye" },
  SAW: { name: "Sabiha Gökçen", city: "Istanbul", country: "Türkiye" },
  JFK: { name: "John F. Kennedy International", city: "New York", country: "United States" },
  LAX: { name: "Los Angeles International", city: "Los Angeles", country: "United States" },
  LHR: { name: "Heathrow", city: "London", country: "United Kingdom" },
  CDG: { name: "Charles de Gaulle", city: "Paris", country: "France" },
  FRA: { name: "Frankfurt Airport", city: "Frankfurt", country: "Germany" },
  AMS: { name: "Schiphol", city: "Amsterdam", country: "Netherlands" },
  DXB: { name: "Dubai International", city: "Dubai", country: "UAE" },
  DOH: { name: "Hamad International", city: "Doha", country: "Qatar" },
  SIN: { name: "Changi", city: "Singapore", country: "Singapore" },
  FCO: { name: "Fiumicino", city: "Rome", country: "Italy" },
  MAD: { name: "Adolfo Suárez Madrid–Barajas", city: "Madrid", country: "Spain" },
  BCN: { name: "El Prat", city: "Barcelona", country: "Spain" },
  ZRH: { name: "Zurich Airport", city: "Zurich", country: "Switzerland" },
  VIE: { name: "Vienna International", city: "Vienna", country: "Austria" },
  CPH: { name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark" },
  ARN: { name: "Arlanda", city: "Stockholm", country: "Sweden" },
  DUB: { name: "Dublin Airport", city: "Dublin", country: "Ireland" },
};

export const SEO_AIRLINE_IATA = [
  "TK",
  "BA",
  "LH",
  "AF",
  "KL",
  "EK",
  "QR",
  "AA",
  "DL",
  "UA",
  "WY",
  "PC",
] as const;

export const AIRLINE_SEO_META: Record<string, AirlineSeoMeta> = {
  TK: { name: "Turkish Airlines", country: "Türkiye", alliance: "Star Alliance" },
  BA: { name: "British Airways", country: "United Kingdom", alliance: "oneworld" },
  LH: { name: "Lufthansa", country: "Germany", alliance: "Star Alliance" },
  AF: { name: "Air France", country: "France", alliance: "SkyTeam" },
  KL: { name: "KLM", country: "Netherlands", alliance: "SkyTeam" },
  EK: { name: "Emirates", country: "UAE" },
  QR: { name: "Qatar Airways", country: "Qatar", alliance: "oneworld" },
  AA: { name: "American Airlines", country: "United States", alliance: "oneworld" },
  DL: { name: "Delta Air Lines", country: "United States", alliance: "SkyTeam" },
  UA: { name: "United Airlines", country: "United States", alliance: "Star Alliance" },
  WY: { name: "Oman Air", country: "Oman", alliance: "oneworld" },
  PC: { name: "Pegasus Airlines", country: "Türkiye" },
};

/** Slugs: ORIG-DEST (IATA airport codes) */
export const SEO_ROUTE_SLUGS = [
  "IST-JFK",
  "IST-LHR",
  "IST-CDG",
  "IST-DXB",
  "IST-SAW",
  "JFK-LHR",
  "LHR-JFK",
  "LHR-DXB",
  "CDG-DXB",
  "FRA-IST",
  "AMS-JFK",
  "DXB-SIN",
  "IST-DOH",
  "SAW-FCO",
  "MAD-BCN",
] as const;

export const ROUTE_SEO_META: Record<string, RouteSeoMeta> = {
  "IST-JFK": { typicalHours: 11, suggestedAirlines: ["TK", "DL", "AA"] },
  "IST-LHR": { typicalHours: 4.5, suggestedAirlines: ["TK", "BA"] },
  "IST-CDG": { typicalHours: 3.5, suggestedAirlines: ["TK", "AF"] },
  "IST-DXB": { typicalHours: 4.5, suggestedAirlines: ["TK", "EK", "FZ"] },
  "IST-SAW": { typicalHours: 1, suggestedAirlines: ["PC", "TK"] },
  "JFK-LHR": { typicalHours: 7, suggestedAirlines: ["BA", "AA", "VS"] },
  "LHR-JFK": { typicalHours: 8, suggestedAirlines: ["BA", "AA", "VS"] },
  "LHR-DXB": { typicalHours: 7, suggestedAirlines: ["EK", "BA"] },
  "CDG-DXB": { typicalHours: 6.5, suggestedAirlines: ["EK", "AF"] },
  "FRA-IST": { typicalHours: 3, suggestedAirlines: ["TK", "LH"] },
  "AMS-JFK": { typicalHours: 8, suggestedAirlines: ["KL", "DL"] },
  "DXB-SIN": { typicalHours: 7.5, suggestedAirlines: ["EK", "SQ"] },
  "IST-DOH": { typicalHours: 4, suggestedAirlines: ["TK", "QR"] },
  "SAW-FCO": { typicalHours: 2.5, suggestedAirlines: ["PC"] },
  "MAD-BCN": { typicalHours: 1.2, suggestedAirlines: ["IB", "VY"] },
};

export function getAirportSeoMeta(code: string): AirportSeoMeta | null {
  const c = code.trim().toUpperCase();
  return AIRPORT_SEO_META[c] ?? null;
}

export function getAirlineSeoMeta(iata: string): AirlineSeoMeta | null {
  const x = iata.trim().toUpperCase();
  return AIRLINE_SEO_META[x] ?? null;
}

export function parseRouteSlug(slug: string): { origin: string; dest: string } | null {
  const s = slug.trim().toUpperCase();
  const m = /^([A-Z]{3,4})-([A-Z]{3,4})$/.exec(s);
  if (!m) return null;
  return { origin: m[1], dest: m[2] };
}

export function getRouteSeoMeta(origin: string, dest: string): RouteSeoMeta | null {
  const key = `${origin.toUpperCase()}-${dest.toUpperCase()}`;
  return ROUTE_SEO_META[key] ?? null;
}

export function routesTouchingAirport(code: string): string[] {
  const c = code.toUpperCase();
  return SEO_ROUTE_SLUGS.filter((slug) => {
    const p = parseRouteSlug(slug);
    return p && (p.origin === c || p.dest === c);
  }).map(String);
}

export function routesForAirline(iata: string): string[] {
  const x = iata.toUpperCase();
  return SEO_ROUTE_SLUGS.filter((slug) => {
    const meta = ROUTE_SEO_META[slug as keyof typeof ROUTE_SEO_META];
    return meta?.suggestedAirlines.includes(x);
  }).map(String);
}
