const DEFAULT_RAPID_HOST = "aerodatabox.p.rapidapi.com";

export function getRapidApiHost(): string {
  const h = process.env.RAPIDAPI_HOST?.trim();
  return h && h.length > 0 ? h : DEFAULT_RAPID_HOST;
}

export function rapidApiHeaders(apiKey: string): Record<string, string> {
  return {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": getRapidApiHost(),
    Accept: "application/json",
  };
}
