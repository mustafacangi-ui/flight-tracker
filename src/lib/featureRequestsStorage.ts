export const FEATURE_REQUESTS_KEY = "featureRequests";

export const FEATURE_REQUESTS_UPDATED_EVENT = "featureRequestsUpdated";

export type FeatureRequest = {
  id: string;
  text: string;
  at: number;
};

function notify(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FEATURE_REQUESTS_UPDATED_EVENT));
}

function load(): FeatureRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FEATURE_REQUESTS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter(
      (x): x is FeatureRequest =>
        x != null &&
        typeof x === "object" &&
        typeof (x as FeatureRequest).id === "string" &&
        typeof (x as FeatureRequest).text === "string" &&
        typeof (x as FeatureRequest).at === "number"
    );
  } catch {
    return [];
  }
}

function save(items: FeatureRequest[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    FEATURE_REQUESTS_KEY,
    JSON.stringify(items.slice(-200))
  );
  notify();
}

export function loadFeatureRequests(): FeatureRequest[] {
  return load().sort((a, b) => b.at - a.at);
}

export function addFeatureRequest(text: string): FeatureRequest {
  const trimmed = text.trim();
  const item: FeatureRequest = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text: trimmed,
    at: Date.now(),
  };
  save([item, ...load()]);
  return item;
}
