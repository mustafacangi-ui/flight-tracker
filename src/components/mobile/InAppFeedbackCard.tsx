"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Lightweight CTA toward existing feedback channels; native in-app form can replace later.
 */
export default function InAppFeedbackCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-5"
      role="region"
      aria-label="Send feedback"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/80">
        In-app feedback (placeholder)
      </p>
      <h3 className="mt-2 text-base font-semibold text-white">
        Tell us what to build next
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Use the roadmap form for structured ideas, or tap the floating
        &quot;Suggest a feature&quot; button anywhere in the app.
      </p>
      <Link
        href="/roadmap"
        className="mt-4 flex w-full items-center justify-center rounded-xl bg-cyan-600/90 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
      >
        Open roadmap & feedback
      </Link>
    </motion.div>
  );
}
