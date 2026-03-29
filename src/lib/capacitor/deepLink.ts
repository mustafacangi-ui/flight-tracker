/**
 * Maps RouteWings custom scheme URLs to in-app paths.
 *
 * Examples:
 * - routewings://flight/TK1234 → /flight/TK1234
 * - routewings://live/TK1234 → /live/TK1234
 * - routewings://family/ABC123 → /family/ABC123
 */
export function routewingsDeepLinkToPath(url: string): string | null {
  if (!url.startsWith("routewings://")) return null;
  let parsed: URL;
  try {
    parsed = new URL(url.replace(/^routewings:/, "https:"));
  } catch {
    return null;
  }
  const host = parsed.hostname;
  const segment = parsed.pathname.replace(/^\//, "").split("/")[0];
  if (!segment) return null;

  const id = decodeURIComponent(segment);

  if (host === "flight") return `/flight/${encodeURIComponent(id)}`;
  if (host === "live") return `/live/${encodeURIComponent(id)}`;
  if (host === "family") return `/family/${encodeURIComponent(id)}`;

  return null;
}
