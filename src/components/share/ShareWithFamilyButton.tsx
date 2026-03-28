"use client";

import { useCallback, useState } from "react";

type Props = {
  flightNumber: string;
};

export default function ShareWithFamilyButton({ flightNumber }: Props) {
  const [copied, setCopied] = useState(false);

  const buildShareUrl = useCallback(() => {
    const slug = flightNumber.replace(/\s+/g, "").toLowerCase();
    return `${window.location.origin}/share/${encodeURIComponent(slug)}`;
  }, [flightNumber]);

  const handleClick = useCallback(async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2800);
    } catch {
      /* ignore */
    }
  }, [buildShareUrl]);

  return (
    <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.08] to-violet-500/[0.06] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <p className="text-sm font-medium text-rose-100/90">
        Send a simple, calm page for loved ones to follow this flight — no
        clutter, just what matters.
      </p>
      <button
        type="button"
        onClick={() => void handleClick()}
        className="mt-5 w-full rounded-3xl bg-gradient-to-r from-rose-500 to-orange-400 px-6 py-4 text-base font-bold tracking-wide text-white shadow-lg shadow-rose-500/25 transition hover:brightness-110 active:scale-[0.99]"
      >
        {copied ? "Link copied!" : "Share with Family"}
      </button>
      <p className="mt-3 text-center text-xs text-gray-500">
        Copies a family-friendly link to your clipboard.
      </p>
    </div>
  );
}
