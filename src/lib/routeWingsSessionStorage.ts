const STORAGE_KEY = "routewings_session_v1";

export const ROUTE_WINGS_SESSION_EVENT = "routewings-session-change";

export type RouteWingsSession = {
  email: string;
  displayName: string;
};

function parse(raw: string | null): RouteWingsSession | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<RouteWingsSession>;
    if (!p?.email || typeof p.email !== "string") return null;
    return {
      email: p.email,
      displayName:
        typeof p.displayName === "string" ? p.displayName : p.email.split("@")[0] ?? "",
    };
  } catch {
    return null;
  }
}

export function getRouteWingsSession(): RouteWingsSession | null {
  if (typeof window === "undefined") return null;
  return parse(localStorage.getItem(STORAGE_KEY));
}

export function setRouteWingsSession(session: RouteWingsSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(ROUTE_WINGS_SESSION_EVENT));
}

export function clearRouteWingsSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(ROUTE_WINGS_SESSION_EVENT));
}
