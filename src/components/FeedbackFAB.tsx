"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";

import { addFeatureRequest } from "../lib/featureRequestsStorage";

export default function FeedbackFAB() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  if (
    pathname?.startsWith("/roadmap") ||
    pathname?.startsWith("/debug")
  ) {
    return null;
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (t.length < 3) return;
    addFeatureRequest(t);
    setText("");
    setDone(true);
    window.setTimeout(() => {
      setDone(false);
      setOpen(false);
    }, 1800);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(6.125rem+env(safe-area-inset-bottom,0px)+0.5rem)] right-3 z-[120] rounded-full border border-violet-500/35 bg-violet-600/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white shadow-lg shadow-violet-900/40 backdrop-blur-md transition hover:bg-violet-500 md:bottom-6 md:right-6"
      >
        Suggest a feature
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close feedback"
              className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="feedback-fab-title"
              className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom,0px)+0.5rem)] right-3 z-[191] w-[min(92vw,20rem)] rounded-2xl border border-white/10 bg-gray-950/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl md:bottom-24 md:right-6"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <p
                id="feedback-fab-title"
                className="text-sm font-semibold text-white"
              >
                Suggest a feature
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Saved on this device as{" "}
                <span className="font-mono text-gray-600">featureRequests</span>
                .
              </p>
              <form onSubmit={submit} className="mt-3 space-y-2">
                <textarea
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What would make Flight Tracker better?"
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-gray-600"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={text.trim().length < 3}
                    className="flex-1 rounded-xl bg-violet-600 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    {done ? "Saved" : "Submit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-300"
                  >
                    Close
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
