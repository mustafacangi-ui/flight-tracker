/**
 * Smart status styling for flight cards (semantic colors).
 */

export type StatusVisual =
  | "scheduled"
  | "boarding"
  | "gate_changed"
  | "departed"
  | "delayed"
  | "cancelled"
  | "landed"
  | "unknown";

export function inferStatusVisual(
  rawStatus?: string | null,
  label?: string | null
): StatusVisual {
  const s = (rawStatus ?? "").toLowerCase();
  const l = (label ?? "").toLowerCase();

  if (s.includes("cancel") || s.includes("divert") || l.includes("cancel")) {
    return "cancelled";
  }
  if (s.includes("delay") || l.includes("delay")) {
    return "delayed";
  }
  if (
    s.includes("arriv") ||
    s.includes("land") ||
    l.includes("arriv") ||
    l.includes("land")
  ) {
    return "landed";
  }
  if (
    s.includes("depart") ||
    s.includes("enroute") ||
    s.includes("approach") ||
    l.includes("depart")
  ) {
    return "departed";
  }
  if (s.includes("gate") && (s.includes("chang") || s.includes("move"))) {
    return "gate_changed";
  }
  if (s.includes("board") || l.includes("board")) {
    return "boarding";
  }
  if (
    s.includes("schedul") ||
    s.includes("expected") ||
    s.includes("checkin") ||
    s.includes("gateclosed") ||
    l.includes("schedul")
  ) {
    return "scheduled";
  }
  if (s === "unknown" || l === "unknown") {
    return "unknown";
  }
  return "scheduled";
}

export function statusVisualBadgeClasses(v: StatusVisual): string {
  switch (v) {
    case "scheduled":
      return "bg-blue-500/15 text-blue-200 ring-1 ring-blue-500/35";
    case "boarding":
      return "bg-orange-500/15 text-orange-200 ring-1 ring-orange-500/40";
    case "gate_changed":
      return "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/40";
    case "departed":
      return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/35";
    case "delayed":
      return "bg-red-500/15 text-red-200 ring-1 ring-red-500/40";
    case "cancelled":
      return "bg-zinc-600/25 text-zinc-300 ring-1 ring-red-500/25";
    case "landed":
      return "bg-teal-500/15 text-teal-200 ring-1 ring-teal-500/40";
    default:
      return "bg-gray-500/15 text-gray-300 ring-1 ring-gray-500/35";
  }
}
