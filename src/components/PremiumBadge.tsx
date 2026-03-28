"use client";

import { useUpgradeModal } from "./UpgradeModalProvider";

export type PremiumBadgeVariant = "premium" | "pro" | "advanced";

const COPY: Record<PremiumBadgeVariant, string> = {
  premium: "Premium Feature",
  pro: "Pro Tracking",
  advanced: "Advanced Aircraft History",
};

const STYLES: Record<PremiumBadgeVariant, string> = {
  premium:
    "border-violet-500/35 bg-violet-500/15 text-violet-100/95",
  pro: "border-cyan-500/35 bg-cyan-500/12 text-cyan-100/95",
  advanced:
    "border-amber-500/35 bg-amber-500/12 text-amber-100/95",
};

type Props = {
  variant: PremiumBadgeVariant;
  className?: string;
  /** If false, badge is display-only (no upgrade tap). */
  interactive?: boolean;
};

export default function PremiumBadge({
  variant,
  className = "",
  interactive = true,
}: Props) {
  const { openUpgrade } = useUpgradeModal();

  const base =
    `inline-flex h-6 min-h-6 shrink-0 items-center rounded-full border px-2.5 py-0 text-[10px] font-semibold uppercase leading-none tracking-wider transition duration-200 ${STYLES[variant]}`;

  if (!interactive) {
    return (
      <span className={`${base} ${className}`} role="text">
        {COPY[variant]}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={`${base} cursor-pointer outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-[0.97] ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openUpgrade();
      }}
    >
      {COPY[variant]}
    </button>
  );
}
