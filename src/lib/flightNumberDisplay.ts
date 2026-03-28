/** Split operator + numeric for display (e.g. TK 1234). */
export function splitFlightNumberDisplay(raw: string): {
  code: string;
  digits: string;
  singleLine: boolean;
} {
  const t = raw.trim().toUpperCase();
  const spaced = t.match(/^([A-Z]{1,3})\s+(\d[\dA-Z]*)$/);
  if (spaced) {
    return { code: spaced[1], digits: spaced[2], singleLine: false };
  }
  const joined = t.match(/^([A-Z]{1,3})(\d[\dA-Z]*)$/);
  if (joined) {
    return { code: joined[1], digits: joined[2], singleLine: false };
  }
  return { code: "", digits: t, singleLine: true };
}
