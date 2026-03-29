type Props = {
  isLive: boolean;
  loading?: boolean;
  source?: string | null;
  className?: string;
};

export default function LiveRadarStatusBadge({
  isLive,
  loading = false,
  source,
  className = "",
}: Props) {
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 ${className}`.trim()}
    >
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
          isLive
            ? "border-emerald-500/45 bg-emerald-500/15 text-emerald-200/95 shadow-[0_0_24px_rgba(52,211,153,0.2)]"
            : "border-slate-700/90 bg-slate-900/60 text-slate-500"
        }`}
      >
        {isLive ? (
          <>
            <span
              className="relative flex h-2 w-2"
              aria-hidden
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live radar
          </>
        ) : loading ? (
          "Locating…"
        ) : (
          "Route preview"
        )}
      </span>
      {isLive && source ? (
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
          {source}
        </span>
      ) : null}
    </div>
  );
}
