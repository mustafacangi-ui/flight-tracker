import type { FlightMiniStats } from "../../lib/flightDetailsTypes";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

type Stat = { label: string; value: string };

type Props = { stats: FlightMiniStats };

export default function FlightStatsRow({ stats }: Props) {
  const rows: Stat[] = [
    ...(stats.distance ? [{ label: "Distance", value: stats.distance }] : []),
    ...(stats.duration ? [{ label: "Duration", value: stats.duration }] : []),
    ...(stats.speed ? [{ label: "Speed", value: stats.speed }] : []),
    ...(stats.altitude ? [{ label: "Altitude", value: stats.altitude }] : []),
    ...(stats.destinationWeather
      ? [{ label: "Dest. weather", value: stats.destinationWeather }]
      : []),
  ];

  if (rows.length === 0) return null;

  return (
    <section className={glassCard("p-4 sm:p-5")}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
        Flight stats
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <dt className="text-[10px] uppercase tracking-wider text-gray-500">
              {r.label}
            </dt>
            <dd className="mt-1 truncate text-sm font-medium text-gray-100">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
