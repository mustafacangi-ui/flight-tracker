export function alertKindIcon(kind: string): string {
  switch (kind) {
    case "gate":
    case "grouped":
      return "🚪";
    case "delayed":
      return "⏱";
    case "boarding":
      return "🎫";
    case "departed":
      return "🛫";
    case "landed":
      return "🛬";
    case "atGate":
      return "🅿";
    case "cancelled":
      return "⛔";
    case "baggage":
      return "🧳";
    case "reminder1h":
    case "reminder30m":
      return "⏰";
    default:
      return "✈";
  }
}

export function alertKindRingClass(kind: string): string {
  switch (kind) {
    case "delayed":
      return "ring-amber-500/40 bg-amber-500/15 text-amber-200";
    case "gate":
    case "grouped":
      return "ring-violet-500/40 bg-violet-500/15 text-violet-200";
    case "boarding":
      return "ring-sky-500/40 bg-sky-500/15 text-sky-200";
    case "departed":
      return "ring-emerald-500/40 bg-emerald-500/15 text-emerald-200";
    case "landed":
      return "ring-teal-500/40 bg-teal-500/15 text-teal-200";
    case "atGate":
      return "ring-cyan-500/40 bg-cyan-500/15 text-cyan-200";
    case "cancelled":
      return "ring-red-500/40 bg-red-500/15 text-red-200";
    case "baggage":
      return "ring-orange-500/40 bg-orange-500/15 text-orange-200";
    case "reminder1h":
    case "reminder30m":
      return "ring-cyan-500/40 bg-cyan-500/15 text-cyan-200";
    default:
      return "ring-white/20 bg-white/10 text-gray-200";
  }
}

export function formatRelativeAlertTime(at: number): string {
  const sec = Math.floor((Date.now() - at) / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
