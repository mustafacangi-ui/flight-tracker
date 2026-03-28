export const MOBILE_WAITLIST_KEY = "mobileAppWaitlist";

export type WaitlistEntry = {
  email: string;
  at: number;
};

function load(): WaitlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MOBILE_WAITLIST_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter(
      (x): x is WaitlistEntry =>
        x != null &&
        typeof x === "object" &&
        typeof (x as WaitlistEntry).email === "string" &&
        typeof (x as WaitlistEntry).at === "number"
    );
  } catch {
    return [];
  }
}

function save(items: WaitlistEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOBILE_WAITLIST_KEY, JSON.stringify(items.slice(-500)));
}

export function addWaitlistEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
  const prev = load();
  if (prev.some((x) => x.email === e)) return true;
  save([{ email: e, at: Date.now() }, ...prev]);
  return true;
}

export function waitlistCount(): number {
  return load().length;
}
