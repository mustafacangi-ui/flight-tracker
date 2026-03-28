export type SimplifiedAirport = {
  code: string;
  name: string;
  city: string;
  country: string;
  /** IANA zone, e.g. `Europe/Istanbul`, when provided by upstream. */
  timezone?: string;
};

export type AirportsApiResponse = {
  airports: SimplifiedAirport[];
  error?: string;
};
