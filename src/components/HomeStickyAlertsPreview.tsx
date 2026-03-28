"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import NotificationBadge from "./NotificationBadge";
import SectionHeader from "./SectionHeader";
import {
  ALERT_TIMELINE_UPDATED_EVENT,
  loadAlertTimeline,
  type AlertTimelineItem,
} from "../lib/alertHistoryStorage";

type BadgeVariant =
  | "boarding"
  | "delayed"
  | "gate"
  | "finalCall"
  | "landed"
  | "atGate"
  | "neutral";

function badgeForItem(a: AlertTimelineItem): {
  label: string;
  variant: BadgeVariant;
} {
  switch (a.kind) {
    case "boarding":
      return { label: "Boarding", variant: "boarding" };
    case "delayed":
      return { label: "Delayed", variant: "delayed" };
    case "gate":
      return { label: "Gate changed", variant: "gate" };
    case "landed":
      return { label: "Landed", variant: "landed" };
    case "atGate":
      return { label: "Arrived at gate", variant: "atGate" };
    case "departed":
      return { label: "Departed", variant: "neutral" };
    default:
      return { label: "Update", variant: "neutral" };
  }
}

function previewLine(a: AlertTimelineItem): string {
  if (a.kind === "grouped" && a.detailLines?.length) {
    const d0 = a.detailLines[0] ?? "";
    if (/delay/i.test(d0)) return `${a.flightNumber} ${d0.toLowerCase()}`;
    if (/gate/i.test(d0)) return `${a.flightNumber} ${d0.toLowerCase()}`;
    return `${a.flightNumber} — ${d0}`;
  }
  const t = a.text.replace(/^\s*[^:]+:\s*/i, "").trim() || a.text;
  return `${a.flightNumber} ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
}

export default function HomeStickyAlertsPreview() {
  const [items, setItems] = useState<AlertTimelineItem[]>(() =>
    loadAlertTimeline()
  );

  const refresh = useCallback(() => {
    setItems(loadAlertTimeline());
  }, []);

  useEffect(() => {
    const on = () => refresh();
    window.addEventListener(ALERT_TIMELINE_UPDATED_EVENT, on);
    return () => window.removeEventListener(ALERT_TIMELINE_UPDATED_EVENT, on);
  }, [refresh]);

  const lines = useMemo(() => {
    const out: AlertTimelineItem[] = [];
    for (const a of items) {
      if (a.kind === "grouped") continue;
      out.push(a);
      if (out.length >= 2) break;
    }
    if (out.length < 2) {
      for (const a of items) {
        if (a.kind !== "grouped") continue;
        out.push(a);
        if (out.length >= 2) break;
      }
    }
    return out.slice(0, 2);
  }, [items]);

  if (lines.length === 0) return null;

  return (
    <aside className="sticky top-0 z-40 -mx-1 mb-1 border-b border-white/10 bg-gray-950/92 px-1 py-2.5 backdrop-blur-md sm:-mx-0 sm:rounded-3xl sm:border sm:px-3 sm:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
      <SectionHeader
        title="Live alerts"
        titleClassName="text-[10px] font-semibold uppercase tracking-wider text-gray-500"
        action={
          <Link
            href="/alerts"
            className="text-[10px] font-medium text-blue-400 hover:text-blue-300"
          >
            All
          </Link>
        }
      />
      <ul className="mt-2 space-y-2">
        {lines.map((a) => {
          const b =
            a.kind === "grouped"
              ? { label: "Updates", variant: "neutral" as BadgeVariant }
              : badgeForItem(a);
          return (
            <li key={a.id}>
              <Link
                href={`/flight/${encodeURIComponent(a.flightNumber)}`}
                className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-2 transition hover:border-white/15 hover:bg-white/[0.05]"
              >
                <NotificationBadge
                  label={b.label}
                  variant={b.variant}
                  className="mt-0.5 shrink-0"
                />
                <span className="min-w-0 flex-1 text-xs leading-snug text-gray-200">
                  {previewLine(a)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
