import type { FlightBadgeItem } from "../../lib/flightDetailsTypes";

function variantClass(v: FlightBadgeItem["variant"]): string {
  switch (v) {
    case "success":
      return "bg-emerald-500/15 text-emerald-200 ring-emerald-500/35";
    case "warning":
      return "bg-amber-500/15 text-amber-200 ring-amber-500/35";
    case "danger":
      return "bg-red-500/15 text-red-200 ring-red-500/35";
    case "info":
      return "bg-sky-500/15 text-sky-200 ring-sky-500/35";
    case "neutral":
    default:
      return "bg-white/10 text-gray-200 ring-white/15";
  }
}

type Props = { items: FlightBadgeItem[] };

export default function FlightStatusBadges({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((b, i) => (
        <span
          key={`${b.text}-${i}`}
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${variantClass(
            b.variant
          )}`}
        >
          {b.text}
        </span>
      ))}
    </div>
  );
}
