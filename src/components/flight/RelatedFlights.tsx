import type { RelatedFlight } from "../../lib/flightDetailsTypes";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

type Props = {
  next: RelatedFlight | null;
};

export default function RelatedFlights({ next }: Props) {
  if (!next) return null;

  return (
    <section className={glassCard("p-6")}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
        Next flight after landing
      </h2>
      <p className="mt-4 text-lg font-medium text-white">
        <span className="font-mono text-cyan-200/90">{next.from}</span>
        <span className="mx-2 text-gray-600">→</span>
        <span className="font-mono text-cyan-200/90">{next.to}</span>
      </p>
      <p className="mt-2 font-mono text-sm text-gray-400">{next.flightNumber}</p>
      {next.departureTime ? (
        <p className="mt-1 font-mono text-xs text-gray-500">
          Departs {next.departureTime}
        </p>
      ) : null}
    </section>
  );
}
