import type { FlightDetail } from "../../lib/flightDetailsTypes";

function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

type Row = { label: string; value: string };

function buildFunRows(detail: FlightDetail): Row[] {
  const rows: Row[] = [];
  const s = detail.stats;
  if (detail.progressPercent != null && detail.progressPercent > 0) {
    const pct = Math.max(0, Math.min(100, detail.progressPercent));
    rows.push(
      s?.distance
        ? {
            label: "Distance remaining (est.)",
            value: `~${100 - pct}% of route left`,
          }
        : {
            label: "Route progress",
            value: `${pct}% of route flown`,
          }
    );
  }
  if (detail.aircraftAgeYears != null && detail.aircraftAgeYears >= 0) {
    rows.push({
      label: "Aircraft age",
      value: `${detail.aircraftAgeYears.toFixed(1)} years`,
    });
    const approxFirstYear =
      new Date().getFullYear() - Math.round(detail.aircraftAgeYears);
    rows.push({
      label: "Approx. first flight",
      value: String(approxFirstYear),
    });
  }
  if (detail.registrationCountry?.trim()) {
    rows.push({
      label: "Registration",
      value: detail.registrationCountry.trim(),
    });
  }
  return rows;
}

function buildDidYouKnow(detail: FlightDetail): string[] {
  const facts: string[] = [];
  const type = detail.aircraftType?.trim();
  const age = detail.aircraftAgeYears;
  if (type && age != null && age >= 0) {
    const y = new Date().getFullYear() - Math.round(age);
    facts.push(`This ${type} may have entered service around ${y}.`);
  }
  const visited = detail.aircraftTailTracking?.usageStats?.airportsVisitedToday;
  if (visited != null && visited > 0) {
    facts.push(
      `This aircraft has visited ${visited} airport${visited === 1 ? "" : "s"} today.`
    );
  }
  const dist = detail.stats?.distance;
  if (dist) {
    const nm = dist.replace(/,/g, "").match(/([\d.]+)\s*nm/i);
    if (nm) {
      const km = Math.round(parseFloat(nm[1]) * 1.852);
      facts.push(`This route is about ${km.toLocaleString()} km long.`);
    } else {
      facts.push(`This route spans ${dist}.`);
    }
  }
  if (facts.length === 0 && type) {
    facts.push(`${type} — tap stats above for live position when in flight.`);
  }
  return facts.slice(0, 4);
}

type Props = { detail: FlightDetail };

export default function FlightAviationDelightSection({ detail }: Props) {
  const rows = buildFunRows(detail);
  const didYouKnow = buildDidYouKnow(detail);

  if (rows.length === 0 && didYouKnow.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {rows.length > 0 ? (
        <section className={glassCard("p-4 sm:p-5")}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Aviation details
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {rows.map((r) => (
              <div key={r.label} className="min-w-0">
                <dt className="text-[10px] uppercase tracking-wider text-gray-500">
                  {r.label}
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-100">
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {didYouKnow.length > 0 ? (
        <section className={glassCard("p-4 sm:p-5")}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500/80">
            Did you know?
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-300">
            {didYouKnow.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-400/90" aria-hidden>
                  ✦
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
