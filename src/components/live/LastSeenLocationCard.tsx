type Props = {
  regionalLabel: string | null;
  lastUpdatedIso: string | null;
  isLive: boolean;
  className?: string;
};

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function LastSeenLocationCard({
  regionalLabel,
  lastUpdatedIso,
  isLive,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-slate-800/90 bg-slate-900/50 p-4 ring-1 ring-sky-500/10 backdrop-blur-md sm:p-5 ${className}`.trim()}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
        Position context
      </p>
      <p className="mt-3 text-lg font-semibold text-white">
        {isLive && regionalLabel ? regionalLabel : "Simulated along route"}
      </p>
      {isLive && lastUpdatedIso ? (
        <p className="mt-2 text-xs text-slate-500">
          Last updated{" "}
          <time dateTime={lastUpdatedIso} className="font-mono text-slate-400">
            {formatTime(lastUpdatedIso)}
          </time>
          <span className="text-slate-600"> · local time</span>
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-600">
          Enable data sources in .env for ADS-B-backed position when airborne.
        </p>
      )}
    </div>
  );
}
