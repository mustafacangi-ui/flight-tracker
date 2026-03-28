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

const TRENDING: FavoriteAirport[] = [
  { code: "IST", name: "Istanbul Airport", city: "Istanbul" },
  { code: "SAW", name: "Sabiha Gökçen", city: "Istanbul" },
  { code: "LHR", name: "Heathrow", city: "London" },
  { code: "DXB", name: "Dubai International", city: "Dubai" },
  { code: "SIN", name: "Singapore Changi", city: "Singapore" },
];

const QUICK_AIRPORT_CODES = ["SAW", "IST", "DUS", "CGK"] as const;

const listContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

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
    <div className="flex flex-col gap-5">
      <section className="space-y-2">
        <SectionHeader
          title="Recent searches"
          subtitle="Stored in localStorage key recentSearches — quick open:"
        />
        <div className="flex flex-wrap gap-2">
          {QUICK_AIRPORT_CODES.map((code) => (
            <motion.button
              key={code}
              type="button"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 450, damping: 22 }}
              onClick={() => openCode(code)}
              className="rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-2 font-mono text-sm font-semibold text-amber-200/90 shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-colors hover:border-amber-400/45 hover:bg-white/[0.1] hover:shadow-[0_12px_32px_rgba(245,158,11,0.12)]"
            >
              {code}
            </motion.button>
          ))}
        </div>
        {recent.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-gray-500">
            Search an airport to build your history — codes like SAW, IST, DUS,
            CGK will appear here as buttons.
          </p>
        ) : (
          <motion.div
            className="flex flex-wrap gap-2"
            variants={listContainer}
            initial="hidden"
            animate="show"
          >
            {recent.map((code) => (
              <motion.button
                key={code}
                type="button"
                variants={listItem}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 450, damping: 22 }}
                onClick={() => openCode(code)}
                className="rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-2 font-mono text-sm font-semibold text-amber-200/90 shadow-[0_6px_20px_rgba(0,0,0,0.2)] transition-colors hover:border-blue-400/35 hover:bg-white/[0.1]"
              >
                {code}
              </motion.button>
            ))}
          </motion.div>
        )}
      </section>

      <section className="space-y-2">
        <SectionHeader title="Trending airports" />
        <motion.ul
          className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_10px_36px_rgba(0,0,0,0.25)]"
          variants={listContainer}
          initial="hidden"
          animate="show"
        >
          {TRENDING.map((a) => (
            <motion.li key={a.code} variants={listItem}>
              <motion.button
                type="button"
                whileHover={{
                  scale: 1.01,
                  backgroundColor: "rgba(255,255,255,0.06)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={() => onOpenAirport(a)}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2.5 text-left text-sm text-gray-200"
              >
                <span>{a.name}</span>
                <span className="font-mono text-xs text-amber-200/80">
                  {a.code}
                </span>
              </motion.button>
            </motion.li>
          ))}
        </motion.ul>
      </section>
    </div>
  );
}
