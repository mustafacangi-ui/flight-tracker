"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { ALERT_TIMELINE_UPDATED_EVENT, loadAlertTimeline } from "../lib/alertHistoryStorage";
import {
  UNIQUE_AIRPORTS_SEARCHED_UPDATED_EVENT,
  ensureUniqueAirportsMigratedFromRecent,
  loadUniqueAirportsSearchedCount,
} from "../lib/recentSearchesStorage";
import { useQuickAccess } from "../hooks/useQuickAccess";

const wrap =
  "rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:shadow-[0_14px_44px_rgba(59,130,246,0.1)]";

type Props = {
  flightsToday: number;
  hasSearched: boolean;
};

export default function HomeQuickStats({ flightsToday, hasSearched }: Props) {
  const { savedFlights } = useQuickAccess();
  const [airportsCount, setAirportsCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);

  const refresh = useCallback(() => {
    setAirportsCount(loadUniqueAirportsSearchedCount());
    setAlertsCount(loadAlertTimeline().length);
  }, []);

  useEffect(() => {
    ensureUniqueAirportsMigratedFromRecent();
    refresh();
    const onAlerts = () => setAlertsCount(loadAlertTimeline().length);
    const onUniq = () =>
      setAirportsCount(loadUniqueAirportsSearchedCount());
    window.addEventListener(ALERT_TIMELINE_UPDATED_EVENT, onAlerts);
    window.addEventListener(UNIQUE_AIRPORTS_SEARCHED_UPDATED_EVENT, onUniq);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(ALERT_TIMELINE_UPDATED_EVENT, onAlerts);
      window.removeEventListener(
        UNIQUE_AIRPORTS_SEARCHED_UPDATED_EVENT,
        onUniq
      );
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const stats = [
    {
      label: "Flights today",
      value: hasSearched ? String(flightsToday) : "—",
      hint: hasSearched ? "At this airport" : "Search an airport",
    },
    {
      label: "Airports searched",
      value: String(airportsCount),
      hint: "Unique codes",
    },
    {
      label: "Saved flights",
      value: String(savedFlights.length),
      hint: "In your list",
    },
    {
      label: "Alerts active",
      value: String(alertsCount),
      hint: "In timeline",
    },
  ];

  return (
    <motion.section
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: 0.06, delayChildren: 0.05 },
        },
      }}
      aria-label="Quick stats"
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
            },
          }}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          className={wrap}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            {s.label}
          </p>
          <p className="mt-1.5 font-mono text-xl font-bold text-white sm:text-2xl">
            {s.value}
          </p>
          <p className="mt-1 text-[10px] text-gray-600">{s.hint}</p>
        </motion.div>
      ))}
    </motion.section>
  );
}
