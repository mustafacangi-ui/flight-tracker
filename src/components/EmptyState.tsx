"use client";

import type { ReactNode } from "react";

type Action = {
  label: string;
  onClick: () => void;
};

type Props = {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: Action;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.035] px-4 py-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:px-6 ${className}`.trim()}
      role="status"
    >
      {icon ? (
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl text-gray-400"
          aria-hidden
        >
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-semibold text-gray-100">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-400">
        {description}
      </p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-sm font-medium text-white transition duration-200 hover:border-white/25 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-[0.98]"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
