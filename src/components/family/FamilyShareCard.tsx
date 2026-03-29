"use client";

import { motion } from "framer-motion";
import { useCallback, useState } from "react";

type Props = {
  pageUrl: string;
  flightNumber: string;
  departureCode: string;
  arrivalCode: string;
};

export default function FamilyShareCard({
  pageUrl,
  flightNumber,
  departureCode,
  arrivalCode,
}: Props) {
  const [copied, setCopied] = useState(false);

  const whatsappHref = (() => {
    const line1 = `✈ ${flightNumber} · ${departureCode} → ${arrivalCode}`;
    const line2 = "Family tracking (RouteWings):";
    const text = [line1, line2, pageUrl].join("\n");
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  })();

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* ignore */
    }
  }, [pageUrl]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.35 }}
      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.35),0_0_36px_rgba(16,185,129,0.12)] ring-1 ring-blue-500/10 backdrop-blur-xl sm:rounded-3xl sm:p-6"
    >
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
        Share with family
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        Send this private link in WhatsApp or copy it to Messages.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3.5 text-sm font-bold text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.2)] transition hover:border-emerald-400/55 hover:bg-emerald-500/25"
        >
          <span aria-hidden>💬</span>
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-sm font-semibold text-white transition hover:border-blue-400/35 hover:bg-white/[0.1]"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </motion.section>
  );
}
