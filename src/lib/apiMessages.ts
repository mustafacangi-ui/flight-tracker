export const RATE_LIMIT_MESSAGE =
  "Too many requests, using cached data...";

/** Matches `/api/flights` body when upstream returns 429 and server has no cache. */
export const RATE_LIMIT_EXCEEDED_MESSAGE = "Rate limit exceeded";

export function isRateLimitUiError(message: string | null): boolean {
  return (
    message === RATE_LIMIT_MESSAGE ||
    message === RATE_LIMIT_EXCEEDED_MESSAGE
  );
}
