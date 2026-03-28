"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSavedFlights } from "../hooks/useSavedFlights";
import { trackEvent } from "../lib/localAnalytics";
import {
  isFlightSaved,
  type SavedFlight,
} from "../lib/quickAccessStorage";

type Props = {
  payload: SavedFlight;
  className?: string;
};

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

export default function FlightSaveBookmark({ payload, className = "" }: Props) {
  const { savedFlights, toggle } = useSavedFlights();
  const saved = isFlightSaved(payload.flightNumber, savedFlights);

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1.5 text-[11px] font-medium text-gray-200 backdrop-blur-sm transition duration-200 hover:border-white/18 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-[0.97] md:px-2.5 md:text-xs ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const { saved } = toggle({ ...payload, timestamp: Date.now() });
        if (saved) {
          trackEvent("save_flight", { flightNumber: payload.flightNumber });
        }
      }}
      aria-pressed={saved}
      aria-label={saved ? "Saved — tap to remove" : "Save flight"}
    >
      <motion.span
        key={saved ? "on" : "off"}
        initial={{ scale: 0.82, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        className={
          saved
            ? "text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.35)]"
            : "text-white/45 hover:text-amber-200/70"
        }
      >
        <BookmarkIcon filled={saved} />
      </motion.span>
      <AnimatePresence mode="wait">
        <motion.span
          key={saved ? "saved" : "save"}
          initial={{ opacity: 0, x: 4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.15 }}
          className="hidden sm:inline"
        >
          {saved ? "Saved" : "Save Flight"}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
