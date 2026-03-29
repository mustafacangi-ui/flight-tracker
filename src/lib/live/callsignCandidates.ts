/**
 * OpenSky and similar ADS-B feeds use ICAO airline designator + flight number in callsign.
 */

const IATA_TO_ICAO: Record<string, string> = {
  TK: "THY",
  PC: "PGT",
  XQ: "SXS",
  LH: "DLH",
  EW: "EWG",
  BA: "BAW",
  AF: "AFR",
  KL: "KLM",
  EK: "UAE",
  QR: "QTR",
  AA: "AAL",
  DL: "DAL",
  UA: "UAL",
  WN: "SWA",
  FR: "RYR",
  U2: "EZY",
  W6: "WZZ",
  IB: "IBE",
  UX: "AEA",
  SK: "SAS",
  AY: "FIN",
  LX: "SWR",
  OS: "AUA",
  SN: "BEL",
  TP: "TAP",
  AZ: "ITY",
  MS: "MSR",
  SV: "SVA",
  ET: "ETH",
  AC: "ACA",
  NH: "ANA",
  JL: "JAL",
  SQ: "SIA",
  CX: "CPA",
};

/** Normalize "TK 123" → "TK123" */
export function normalizeFlightNumber(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/**
 * Returns padded OpenSky-style callsign guesses (8 chars with spaces).
 */
export function openskyCallsignCandidates(flightNumber: string): string[] {
  const norm = normalizeFlightNumber(flightNumber);
  const m = norm.match(/^([A-Z]{2,3})(\d{1,4}[A-Z]?)$/i);
  if (!m) return [];
  const iata = m[1].toUpperCase();
  const num = m[2].toUpperCase();
  const icao = IATA_TO_ICAO[iata] ?? iata.slice(0, 3);
  const core = `${icao}${num}`.replace(/\s+/g, "").slice(0, 8);
  const pad = (s: string) => s.padEnd(8, " ");
  const out = new Set<string>();
  out.add(pad(core));
  out.add(pad(`${iata}${num}`));
  if (icao !== iata) {
    out.add(pad(`${icao}${num}`));
  }
  return [...out];
}

export function callsignRoughMatch(
  openskyCallsign: string | null | undefined,
  candidates: string[]
): boolean {
  if (!openskyCallsign) return false;
  const a = openskyCallsign.replace(/\s+/g, "").toUpperCase();
  if (a.length < 3) return false;
  return candidates.some((c) => {
    const b = c.replace(/\s+/g, "").toUpperCase();
    return a.startsWith(b) || b.startsWith(a) || a.includes(b) || b.includes(a);
  });
}
