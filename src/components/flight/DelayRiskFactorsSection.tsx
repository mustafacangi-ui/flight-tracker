function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

type Props = { factors: string[] };

export default function DelayRiskFactorsSection({ factors }: Props) {
  if (factors.length === 0) return null;

  return (
    <section className={glassCard("p-6")}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
        Possible delay risk factors
      </h2>
      <ul className="mt-4 space-y-3 text-sm text-gray-300">
        {factors.map((f, i) => (
          <li key={i} className="flex gap-3">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/80"
              aria-hidden
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
