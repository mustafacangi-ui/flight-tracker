"use client";

import type { AlertSoundMode } from "../lib/notificationGlobalSettings";

type Props = {
  value: AlertSoundMode;
  onChange: (v: AlertSoundMode) => void;
  className?: string;
};

export default function SoundSettingsCard({
  value,
  onChange,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Alert sound
      </p>
      <p className="mt-1 text-[11px] text-gray-600">
        Plays when this tab is open and an alert fires.
      </p>
      <div className="mt-4 space-y-2">
        {(
          [
            { v: "silent" as const, label: "Silent" },
            { v: "soft" as const, label: "Soft chime" },
            { v: "airport" as const, label: "Airport PA sound" },
          ] as const
        ).map((opt) => (
          <label
            key={opt.v}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 transition hover:bg-white/[0.04]"
          >
            <input
              type="radio"
              name="alert-sound"
              value={opt.v}
              checked={value === opt.v}
              onChange={() => onChange(opt.v)}
              className="h-4 w-4 border-gray-600 bg-gray-900 text-blue-600"
            />
            <span className="text-sm text-gray-200">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
