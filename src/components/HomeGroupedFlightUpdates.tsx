"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import SectionHeader from "./SectionHeader";
import {
  ALERT_TIMELINE_UPDATED_EVENT,
  loadAlertTimeline,
  type AlertTimelineItem,
} from "../lib/alertHistoryStorage";

function isGroupedCard(a: AlertTimelineItem): boolean {
  if (a.kind === "grouped") return true;
  return Boolean(a.detailLines && a.detailLines.length >= 2);
}

export default function HomeGroupedFlightUpdates() {
  const [cards, setCards] = useState<AlertTimelineItem[]>([]);

  const refresh = useCallback(() => {
    setCards(loadAlertTimeline().filter(isGroupedCard).slice(0, 2));
  }, []);

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener(ALERT_TIMELINE_UPDATED_EVENT, on);
    return () => window.removeEventListener(ALERT_TIMELINE_UPDATED_EVENT, on);
  }, [refresh]);

  if (cards.length === 0) return null;

  return (
    <section className="space-y-1.5">
      <SectionHeader title="Flight updates" />
      <ul className="space-y-2">
        {cards.map((a) => {
          const lines =
            a.detailLines && a.detailLines.length > 0
              ? a.detailLines
              : [a.text];
          const title = a.title ?? `${a.flightNumber} updates`;
          return (
            <li
              key={a.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs font-bold text-amber-200/90">
                  {title}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">
                  {lines[0]}
                </p>
              </div>
              <Link
                href={`/flight/${encodeURIComponent(a.flightNumber)}`}
                className="shrink-0 text-[11px] font-medium text-blue-400 hover:text-blue-300"
              >
                Open
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
