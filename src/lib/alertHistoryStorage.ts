/**
 * In-app notification center timeline (localStorage).
 */

export type AlertTimelineItem = {
  id: string;
  at: number;
  flightNumber: string;
  /** Summary line (or "FN — N updates" when grouped) */
  text: string;
  kind: string;
  /** Card title e.g. "Gate changed" */
  title?: string;
  /** Grouped bullet lines (newest first) */
  detailLines?: string[];
};

export const ALERT_TIMELINE_KEY = "flightAlertTimeline";
export const ALERT_TIMELINE_UPDATED_EVENT = "flightAlertTimelineUpdated";

const MAX_ITEMS = 200;
const MERGE_WINDOW_MS = 4 * 60 * 1000;
const LIVE_WINDOW_MS = 45 * 60 * 1000;

function notify(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ALERT_TIMELINE_UPDATED_EVENT));
}

function parse(raw: string | null): AlertTimelineItem[] {
  if (raw == null || raw === "") return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (x): x is AlertTimelineItem =>
          x != null &&
          typeof x === "object" &&
          typeof (x as AlertTimelineItem).id === "string" &&
          typeof (x as AlertTimelineItem).at === "number" &&
          typeof (x as AlertTimelineItem).flightNumber === "string" &&
          typeof (x as AlertTimelineItem).text === "string" &&
          typeof (x as AlertTimelineItem).kind === "string"
      )
      .sort((a, b) => b.at - a.at);
  } catch {
    return [];
  }
}

export function loadAlertTimeline(): AlertTimelineItem[] {
  if (typeof window === "undefined") return [];
  return parse(localStorage.getItem(ALERT_TIMELINE_KEY));
}

export function saveAlertTimeline(items: AlertTimelineItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    ALERT_TIMELINE_KEY,
    JSON.stringify(items.slice(0, MAX_ITEMS))
  );
  notify();
}

function titleForKind(kind: string): string {
  switch (kind) {
    case "gate":
      return "Gate changed";
    case "delayed":
      return "Delayed";
    case "boarding":
      return "Boarding";
    case "departed":
      return "Departed";
    case "landed":
      return "Landed";
    case "atGate":
      return "Arrived at gate";
    case "cancelled":
      return "Cancelled";
    case "baggage":
      return "Baggage";
    case "reminder1h":
      return "Departure soon";
    case "reminder30m":
      return "Departure soon";
    case "grouped":
      return "Flight updates";
    default:
      return "Update";
  }
}

/**
 * Merge rapid updates for the same flight into one card.
 */
export function addAlertTimelineEntry(entry: {
  flightNumber: string;
  text: string;
  kind: string;
}): AlertTimelineItem {
  const fn = entry.flightNumber.trim();
  const fnKey = fn.toUpperCase();
  const items = loadAlertTimeline();
  const head = items[0];
  const now = Date.now();

  if (
    head &&
    head.flightNumber.toUpperCase() === fnKey &&
    now - head.at < MERGE_WINDOW_MS
  ) {
    const prevLines = head.detailLines?.length
      ? head.detailLines
      : [head.text.replace(/^\s*[^:]+:\s*/i, "").trim() || head.text];
    const nextLines = [entry.text, ...prevLines].slice(0, 10);
    const updated: AlertTimelineItem = {
      ...head,
      at: now,
      kind: "grouped",
      title: `${fn} updates`,
      text: `${fn} — ${nextLines.length} updates`,
      detailLines: nextLines,
    };
    saveAlertTimeline([updated, ...items.slice(1)]);
    return updated;
  }

  const item: AlertTimelineItem = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${now}-${Math.random().toString(36).slice(2)}`,
    at: now,
    flightNumber: fn,
    text: entry.text.trim(),
    kind: entry.kind,
    title: titleForKind(entry.kind),
  };
  const next = [item, ...items].slice(0, MAX_ITEMS);
  saveAlertTimeline(next);
  return item;
}

export function groupAlertsByDay(
  items: AlertTimelineItem[]
): { label: string; items: AlertTimelineItem[] }[] {
  const now = new Date();
  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const startYesterday = startToday - 86400000;

  const today: AlertTimelineItem[] = [];
  const yesterday: AlertTimelineItem[] = [];
  const earlier: AlertTimelineItem[] = [];

  for (const it of items) {
    if (it.at >= startToday) today.push(it);
    else if (it.at >= startYesterday) yesterday.push(it);
    else earlier.push(it);
  }

  const out: { label: string; items: AlertTimelineItem[] }[] = [];
  if (today.length) out.push({ label: "Today", items: today });
  if (yesterday.length) out.push({ label: "Yesterday", items: yesterday });
  if (earlier.length) out.push({ label: "Earlier", items: earlier });
  return out;
}

export function groupAlertsForCenter(items: AlertTimelineItem[]): {
  live: AlertTimelineItem[];
  today: AlertTimelineItem[];
  yesterday: AlertTimelineItem[];
  older: AlertTimelineItem[];
} {
  const now = Date.now();
  const startToday = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  ).getTime();
  const startYesterday = startToday - 86400000;

  const live: AlertTimelineItem[] = [];
  const today: AlertTimelineItem[] = [];
  const yesterday: AlertTimelineItem[] = [];
  const older: AlertTimelineItem[] = [];

  for (const it of items) {
    if (now - it.at <= LIVE_WINDOW_MS) {
      live.push(it);
      continue;
    }
    if (it.at >= startToday) today.push(it);
    else if (it.at >= startYesterday) yesterday.push(it);
    else older.push(it);
  }

  return { live, today, yesterday, older };
}

export function alertsForFlight(
  items: AlertTimelineItem[],
  flightNumber: string
): AlertTimelineItem[] {
  const k = flightNumber.trim().toUpperCase();
  return items.filter((x) => x.flightNumber.toUpperCase() === k);
}
