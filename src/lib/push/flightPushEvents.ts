import { DISPLAY_DASH } from "../displayConstants";
import type { FlightDetailPayload } from "../flightDetail";
import { delayMinutesLabel } from "../flightDetail";

/** Persisted worker snapshot (JSON in tracked_flights.last_status). */
export type TrackedFlightSnapshotV1 = {
  v: 1;
  statusLabel: string;
  statusRaw: string;
  gate: string;
  terminal: string;
  delayMinutes: number | null;
};

export type NotificationPrefsEffective = {
  flight_delays: boolean;
  gate_changes: boolean;
  boarding_reminders: boolean;
  departures: boolean;
  arrivals: boolean;
  cancellations: boolean;
};

export type PushEventKind =
  | "delayed"
  | "gate_change"
  | "boarding"
  | "departure"
  | "arrival"
  | "cancellation";

export type ResolvedPushEvent = {
  kind: PushEventKind;
  title: string;
  body: string;
};

const ALL_PREFS_TRUE: NotificationPrefsEffective = {
  flight_delays: true,
  gate_changes: true,
  boarding_reminders: true,
  departures: true,
  arrivals: true,
  cancellations: true,
};

export function effectiveNotificationPrefs(
  row: Partial<Record<keyof NotificationPrefsEffective, boolean | null>> | null | undefined
): NotificationPrefsEffective {
  if (!row) return { ...ALL_PREFS_TRUE };
  return {
    flight_delays: row.flight_delays !== false,
    gate_changes: row.gate_changes !== false,
    boarding_reminders: row.boarding_reminders !== false,
    departures: row.departures !== false,
    arrivals: row.arrivals !== false,
    cancellations: row.cancellations !== false,
  };
}

function prefAllows(
  prefs: NotificationPrefsEffective,
  kind: PushEventKind
): boolean {
  switch (kind) {
    case "delayed":
      return prefs.flight_delays;
    case "gate_change":
      return prefs.gate_changes;
    case "boarding":
      return prefs.boarding_reminders;
    case "departure":
      return prefs.departures;
    case "arrival":
      return prefs.arrivals;
    case "cancellation":
      return prefs.cancellations;
  }
}

function gateIsComparable(g: string): boolean {
  const t = g.trim();
  return (
    t.length > 0 && t !== DISPLAY_DASH && t !== "-" && t.toLowerCase() !== "n/a"
  );
}

function boardingFromRaw(statusRaw: string): boolean {
  return /\bboard/i.test(statusRaw);
}

export function snapshotFromDetail(
  detail: FlightDetailPayload
): TrackedFlightSnapshotV1 {
  return {
    v: 1,
    statusLabel: detail.statusLabel,
    statusRaw: detail.statusRaw?.trim() ?? "",
    gate: detail.gate?.trim() || DISPLAY_DASH,
    terminal: detail.terminal?.trim() || DISPLAY_DASH,
    delayMinutes: delayMinutesLabel(detail),
  };
}

export function serializeSnapshot(s: TrackedFlightSnapshotV1): string {
  return JSON.stringify(s);
}

export function parseLastStatus(
  raw: string | null | undefined
): TrackedFlightSnapshotV1 | null {
  if (raw == null || !String(raw).trim()) return null;
  const t = String(raw).trim();
  try {
    const o = JSON.parse(t) as unknown;
    if (
      o &&
      typeof o === "object" &&
      (o as TrackedFlightSnapshotV1).v === 1 &&
      typeof (o as TrackedFlightSnapshotV1).statusLabel === "string"
    ) {
      const x = o as TrackedFlightSnapshotV1;
      return {
        v: 1,
        statusLabel: x.statusLabel,
        statusRaw: typeof x.statusRaw === "string" ? x.statusRaw : "",
        gate: typeof x.gate === "string" ? x.gate : DISPLAY_DASH,
        terminal: typeof x.terminal === "string" ? x.terminal : DISPLAY_DASH,
        delayMinutes:
          typeof x.delayMinutes === "number" || x.delayMinutes === null
            ? x.delayMinutes
            : null,
      };
    }
  } catch {
    /* legacy plain text */
  }
  return {
    v: 1,
    statusLabel: t,
    statusRaw: "",
    gate: DISPLAY_DASH,
    terminal: DISPLAY_DASH,
    delayMinutes: null,
  };
}

function fn(detail: FlightDetailPayload): string {
  return detail.flightNumber.trim().toUpperCase();
}

function depCode(detail: FlightDetailPayload): string {
  return detail.departure.code?.trim().toUpperCase() || "—";
}

function arrCode(detail: FlightDetailPayload): string {
  return detail.arrival.code?.trim().toUpperCase() || "—";
}

function gatePhrase(detail: FlightDetailPayload): string {
  const g = detail.gate?.trim();
  if (g && g !== DISPLAY_DASH) return `Gate ${g}`;
  return "gate";
}

/**
 * Emit push copy only when something meaningfully changed vs the previous snapshot.
 * First run (`prev` null): no notifications — caller still persists `next` snapshot.
 */
export function resolvePushEvents(args: {
  prev: TrackedFlightSnapshotV1 | null;
  next: TrackedFlightSnapshotV1;
  detail: FlightDetailPayload;
  prefs: NotificationPrefsEffective;
}): ResolvedPushEvent[] {
  const { prev, next, detail, prefs } = args;
  const f = fn(detail);
  const out: ResolvedPushEvent[] = [];

  if (prev == null) {
    return out;
  }

  const prevCancelled = prev.statusLabel === "Cancelled";
  const nextCancelled = next.statusLabel === "Cancelled";
  if (nextCancelled && !prevCancelled) {
    const ev: ResolvedPushEvent = {
      kind: "cancellation",
      title: "Flight Cancelled",
      body: `${f} has been cancelled.`,
    };
    if (prefAllows(prefs, ev.kind)) out.push(ev);
    return out;
  }

  const prevArrived = prev.statusLabel === "Arrived";
  const nextArrived = next.statusLabel === "Arrived";
  if (nextArrived && !prevArrived) {
    const ev: ResolvedPushEvent = {
      kind: "arrival",
      title: "Flight Landed",
      body: `${f} has landed at ${arrCode(detail)}.`,
    };
    if (prefAllows(prefs, ev.kind)) out.push(ev);
  }

  const prevDeparted = prev.statusLabel === "Departed";
  const nextDeparted = next.statusLabel === "Departed";
  if (nextDeparted && !prevDeparted) {
    const ev: ResolvedPushEvent = {
      kind: "departure",
      title: "Flight Departed",
      body: `${f} has departed from ${depCode(detail)}.`,
    };
    if (prefAllows(prefs, ev.kind)) out.push(ev);
  }

  const prevBoard = boardingFromRaw(prev.statusRaw);
  const nextBoard = boardingFromRaw(next.statusRaw);
  if (nextBoard && !prevBoard && !nextDeparted && !nextArrived && !nextCancelled) {
    const ev: ResolvedPushEvent = {
      kind: "boarding",
      title: "Boarding Soon",
      body: `${f} is boarding soon at ${gatePhrase(detail)}.`,
    };
    if (prefAllows(prefs, ev.kind)) out.push(ev);
  }

  if (
    gateIsComparable(prev.gate) &&
    gateIsComparable(next.gate) &&
    prev.gate !== next.gate &&
    !nextCancelled
  ) {
    const leg =
      detail.direction === "arrival" ? "arrival gate" : "departure gate";
    const ev: ResolvedPushEvent = {
      kind: "gate_change",
      title: "Gate Changed",
      body: `${f} ${leg} changed to ${next.gate}.`,
    };
    if (prefAllows(prefs, ev.kind)) out.push(ev);
  }

  const nextDelayed = next.statusLabel === "Delayed";
  const prevDelayed = prev.statusLabel === "Delayed";
  if (nextDelayed && !prevDelayed) {
    const mins = next.delayMinutes;
    const body =
      mins != null && mins > 0
        ? `${f} is now delayed by ${mins} minutes.`
        : `${f} is now delayed.`;
    const ev: ResolvedPushEvent = {
      kind: "delayed",
      title: "Flight Delayed",
      body,
    };
    if (prefAllows(prefs, ev.kind)) out.push(ev);
  }

  return out;
}
