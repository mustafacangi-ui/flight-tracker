import type { AircraftLivePosition } from "../../lib/live/types";

type Props = {
  position: AircraftLivePosition | null;
  loading?: boolean;
  className?: string;
};

function IconAlt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 3v18M8 8l4-5 4 5M8 16l4 5 4-5" />
    </svg>
  );
}

function IconSpeed({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function LiveAircraftStatsCard({
  position,
  loading,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-slate-800/90 bg-slate-900/50 p-4 ring-1 ring-blue-500/10 backdrop-blur-md sm:p-5 ${className}`.trim()}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
        Aircraft data
      </p>
      {loading ? (
        <p className="mt-3 text-sm text-slate-500">Fetching latest sample…</p>
      ) : position ? (
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
            <dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <IconAlt className="text-sky-400/90" />
              Altitude
            </dt>
            <dd className="mt-1.5 text-lg font-bold tabular-nums text-white">
              {position.altitude != null
                ? `${position.altitude.toLocaleString()} ft`
                : "—"}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
            <dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <IconSpeed className="text-cyan-400/90" />
              Ground speed
            </dt>
            <dd className="mt-1.5 text-lg font-bold tabular-nums text-white">
              {position.speed != null ? `${position.speed} kts` : "—"}
            </dd>
          </div>
          {position.verticalSpeed != null ? (
            <div className="col-span-2 rounded-xl border border-slate-800/80 bg-slate-950/40 px-3 py-2 text-center text-xs text-slate-400">
              Vertical rate{" "}
              <span className="font-mono font-semibold text-slate-200">
                {position.verticalSpeed > 0 ? "+" : ""}
                {position.verticalSpeed} fpm
              </span>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No live telemetry in this view — map follows scheduled progress.
        </p>
      )}
    </div>
  );
}
