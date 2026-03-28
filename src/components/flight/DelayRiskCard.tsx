import type { DelayRiskLevel } from "../../lib/flightDetailsTypes";

type Props = {
  level: DelayRiskLevel;
  description?: string;
};

const LABEL: Record<DelayRiskLevel, string> = {
  low: "Low Delay Risk",
  medium: "Medium Delay Risk",
  high: "High Delay Risk",
};

const RING: Record<DelayRiskLevel, string> = {
  low: "text-emerald-300 ring-emerald-500/30",
  medium: "text-amber-200 ring-amber-500/30",
  high: "text-red-300 ring-red-500/30",
};

export default function DelayRiskCard({
  level,
  description = "Based on this flight's status, prior leg, turnaround window, and recent completion signals when history is available.",
}: Props) {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-white/[0.04] p-5 ring-1 ${RING[level]} shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md`}
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
        Delay outlook
      </h2>
      <p className="mt-3 text-xl font-semibold text-white">{LABEL[level]}</p>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
    </section>
  );
}
