"use client";

type Props = {
  enabled: boolean;
  start: string;
  end: string;
  disableDuringTravel: boolean;
  onEnabledChange: (v: boolean) => void;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onDisableDuringTravelChange: (v: boolean) => void;
  className?: string;
};

export default function QuietHoursCard({
  enabled,
  start,
  end,
  disableDuringTravel,
  onEnabledChange,
  onStartChange,
  onEndChange,
  onDisableDuringTravelChange,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Quiet hours
      </p>
      <p className="mt-1 text-[11px] text-gray-600">
        Times use your device&apos;s local timezone. Browser notifications and
        sounds are muted in this window.
      </p>

      <label className="mt-4 flex cursor-pointer items-center justify-between gap-2">
        <span className="text-sm text-gray-200">Enable quiet hours</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-600"
        />
      </label>

      <div className="mt-3 flex gap-2">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">
            Start
          </p>
          <input
            type="time"
            value={start}
            onChange={(e) => onStartChange(e.target.value)}
            disabled={!enabled}
            className="mt-1 w-full rounded-lg border border-white/15 bg-gray-900 px-2 py-1.5 text-sm text-white disabled:opacity-40"
          />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">
            End
          </p>
          <input
            type="time"
            value={end}
            onChange={(e) => onEndChange(e.target.value)}
            disabled={!enabled}
            className="mt-1 w-full rounded-lg border border-white/15 bg-gray-900 px-2 py-1.5 text-sm text-white disabled:opacity-40"
          />
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-start justify-between gap-3 border-t border-white/5 pt-4">
        <span className="text-sm leading-snug text-gray-200">
          Disable quiet hours while tracking flights
        </span>
        <input
          type="checkbox"
          checked={disableDuringTravel}
          onChange={(e) => onDisableDuringTravelChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-600"
        />
      </label>
      <p className="mt-1 text-[11px] text-gray-600">
        When any flight is on your tracking list, alerts stay audible outside
        quiet hours.
      </p>
    </div>
  );
}
