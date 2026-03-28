"use client";

type Variant =
  | "boarding"
  | "delayed"
  | "gate"
  | "finalCall"
  | "landed"
  | "atGate"
  | "neutral";

const STYLES: Record<Variant, string> = {
  boarding: "border-sky-500/40 bg-sky-500/15 text-sky-100",
  delayed: "border-amber-500/45 bg-amber-500/15 text-amber-100",
  gate: "border-violet-500/40 bg-violet-500/15 text-violet-100",
  finalCall: "border-orange-500/45 bg-orange-500/15 text-orange-100",
  landed: "border-emerald-500/40 bg-emerald-500/15 text-emerald-100",
  atGate: "border-teal-500/40 bg-teal-500/15 text-teal-100",
  neutral: "border-white/20 bg-white/10 text-gray-200",
};

type Props = {
  label: string;
  variant?: Variant;
  className?: string;
};

export default function NotificationBadge({
  label,
  variant = "neutral",
  className = "",
}: Props) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STYLES[variant]} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
