import type { FlightBadgeItem } from "../../lib/flightDetailsTypes";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

type Props = {
  phrase?: string;
  lines?: string[];
  badges?: FlightBadgeItem[];
};

export default function FlightLiveStatusSection({
  phrase,
  lines,
  badges = [],
}: Props) {
  const fromBadges = badges.map((b) => b.text).filter(Boolean);
  const merged = [...new Set([...(lines ?? []), ...fromBadges])].filter(
    (line) =>
      !phrase ||
      line.trim().toLowerCase() !== phrase.trim().toLowerCase()
  );
  if (!phrase && merged.length === 0) return null;

  return (
    <section className={glassCard("p-6")}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
        Live status
      </h2>
      {phrase ? (
        <p className="mt-4 text-lg font-semibold leading-snug text-white sm:text-xl">
          {phrase}
        </p>
      ) : null}
      {merged.length > 0 ? (
        <ul className={`space-y-2 ${phrase ? "mt-4" : "mt-4"}`}>
          {merged.map((line) => (
            <li
              key={line}
              className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-gray-200"
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/90"
                aria-hidden
              />
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
