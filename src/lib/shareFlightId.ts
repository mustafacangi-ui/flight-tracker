/**
 * Resolves a share path segment like `tk1234`, `TK1234`, or legacy `tk1234-demo` to a flight number key for mock lookup.
 */
export function flightNumberFromShareId(shareId: string): string {
  let raw = shareId.trim();
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* use raw */
  }
  const withoutDemo = raw.replace(/-demo$/i, "");
  const firstSegment = withoutDemo.split("-")[0] ?? withoutDemo;
  return firstSegment.replace(/\s+/g, "").toUpperCase();
}
