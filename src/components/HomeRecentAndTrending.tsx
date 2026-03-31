"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import SectionHeader from "./SectionHeader";
import type { FavoriteAirport } from "../lib/quickAccessStorage";
import {
  RECENT_SEARCHES_UPDATED_EVENT,
  loadRecentAirportCodes,
} from "../lib/recentSearchesStorage";

type Props = { onOpenAirport: (a: FavoriteAirport) => void };

const QUICK_AIRPORT_CODES = ["IST", "FRA", "JFK"] as const;

const listItem = {
  hidden: { opacity: 0, x: -8 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function HomeRecentAndTrending({ onOpenAirport }: Props) {
  const [recent, setRecent] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setRecent(loadRecentAirportCodes());
  }, []);

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener(RECENT_SEARCHES_UPDATED_EVENT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(RECENT_SEARCHES_UPDATED_EVENT, on);
      window.removeEventListener("storage", on);
    };
  }, [refresh]);

  const openCode = (code: string) => {
    onOpenAirport({ code, name: code, city: "" });
  };

  return (
    <section className="space-y-2">
      <SectionHeader title="Recent searches" />
      <div className="flex flex-wrap gap-2">
        {QUICK_AIRPORT_CODES.map((code) => (
          <motion.button
            key={code}
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 450, damping: 22 }}
            onClick={() => openCode(code)}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs font-medium text-amber-200/80 transition hover:border-amber-400/40 hover:bg-white/[0.08]"
          >
            {code}
          </motion.button>
        ))}
        {recent.map((code) => (
          <motion.button
            key={code}
            type="button"
            variants={listItem}
            initial="hidden"
            animate="show"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 450, damping: 22 }}
            onClick={() => openCode(code)}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs font-medium text-gray-300 transition hover:border-blue-400/35 hover:bg-white/[0.08]"
          >
            {code}
          </motion.button>
        ))}
      </div>
    </section>
  );
}
