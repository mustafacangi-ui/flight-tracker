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
    setCards(loadAlertTimeline().filter(isGroupedCard).slice(0, 4));
  }, []);

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener(ALERT_TIMELINE_UPDATED_EVENT, on);
    return () => window.removeEventListener(ALERT_TIMELINE_UPDATED_EVENT, on);
  }, [refresh]);

  if (cards.length === 0) return null;

  return (
    <section className="space-y-2">
      <SectionHeader
        title="Flight updates"
        action={
          <Link
            href="/alerts"
            className="text-xs font-medium text-blue-400 hover:text-blue-300"
          >
            Timeline
          </Link>
        }
      />
      <ul className="space-y-3">
        {cards.map((a) => {
          const lines =
            a.detailLines && a.detailLines.length > 0
              ? a.detailLines
              : [a.text];
          const title =
            a.title ?? `${a.flightNumber} updates`;
          return (
            <li
              key={a.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-sm font-bold text-amber-200/90">
                  {title}
                </p>
                <Link
                  href={`/flight/${encodeURIComponent(a.flightNumber)}`}
                  className="shrink-0 text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  Open
                </Link>
              </div>
              <ul className="mt-3 space-y-1.5 border-l border-white/10 pl-3 text-sm text-gray-300">
                {lines.slice(0, 6).map((line, i) => (
                  <li key={i} className="leading-snug">
                    {line}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
