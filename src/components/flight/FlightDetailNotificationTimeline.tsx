"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ALERT_TIMELINE_UPDATED_EVENT,
  alertsForFlight,
  loadAlertTimeline,
  type AlertTimelineItem,
} from "../../lib/alertHistoryStorage";
import type { FlightDetail } from "../../lib/flightDetailsTypes";
import {
  alertKindIcon,
  alertKindRingClass,
  formatRelativeAlertTime,
} from "../../lib/alertCardVisual";

function glass(className = "") {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

function labelToKind(label: string): string {
  const L = label.toLowerCase();
  if (L.includes("boarding")) return "boarding";
  if (L.includes("gate")) return "gate";
  if (L.includes("push") || L.includes("takeoff") || L.includes("take-off"))
    return "departed";
  if (L.includes("land")) return "landed";
  return "boarding";
}

type TimelineRow = {
  id: string;
  time: string;
  title: string;
  text: string;
  kind: string;
  at: number;
  detailLines?: string[];
};

function buildDemoRows(flight: FlightDetail): TimelineRow[] {
  const events = flight.timelineEvents ?? [];
  const completed = events.filter((e) => e.state === "completed");
  const base = Date.now();
  if (completed.length >= 3) {
    return completed.slice(0, 10).map((e, i) => ({
      id: `demo-${i}`,
      time: e.time,
      title: e.label,
      text: `${flight.flightNumber} · ${e.label}`,
      kind: labelToKind(e.label),
      at: base - (10 - i) * 7 * 60_000,
    }));
  }
  const steps = [
    { m: 105, title: "Boarding started", kind: "boarding" },
    { m: 88, title: "Gate changed to B16", kind: "gate" },
    { m: 70, title: "Pushback", kind: "departed" },
    { m: 62, title: "Takeoff", kind: "departed" },
  ];
  const fmt = (t: number) =>
    new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(t));
  return steps.map((s, i) => ({
    id: `demo-${i}`,
    time: fmt(base - s.m * 60_000),
    title: s.title,
    text: `${flight.flightNumber} · ${s.title}`,
    kind: s.kind,
    at: base - s.m * 60_000,
  }));
}

type Props = { flightNumber: string; detail?: FlightDetail };

export default function FlightDetailNotificationTimeline({
  flightNumber,
  detail,
}: Props) {
  const [items, setItems] = useState<AlertTimelineItem[]>([]);

  const refresh = useCallback(() => {
    setItems(alertsForFlight(loadAlertTimeline(), flightNumber));
  }, [flightNumber]);

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener(ALERT_TIMELINE_UPDATED_EVENT, on);
    return () => window.removeEventListener(ALERT_TIMELINE_UPDATED_EVENT, on);
  }, [refresh]);

  const demoRows = useMemo(
    () => (detail ? buildDemoRows(detail) : []),
    [detail]
  );

  const showDemo = items.length === 0 && demoRows.length > 0;
  const rows: TimelineRow[] = showDemo
    ? demoRows
    : items.slice(0, 12).map((a) => ({
        id: a.id,
        time: new Intl.DateTimeFormat(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(a.at)),
        title: a.title ?? a.kind,
        text: a.text,
        kind: a.kind,
        at: a.at,
        detailLines: a.detailLines,
      }));

  if (rows.length === 0) return null;

  return (
    <section className={glass("p-6")}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
          Notification timeline
        </h2>
        <Link
          href="/alerts"
          className="text-xs font-medium text-blue-400 hover:text-blue-300"
        >
          All alerts
        </Link>
      </div>
      {showDemo ? (
        <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
          Sample timeline — enable tracking to receive real alerts for{" "}
          {flightNumber}.
        </p>
      ) : null}
      <ul className="relative mt-5 space-y-0 border-l border-white/10 pl-5">
        {rows.map((row, i) => {
          const isLast = i === rows.length - 1;
          const kind = row.kind;
          return (
            <li key={row.id} className="relative pb-8 last:pb-0">
              <span
                className="absolute -left-[1.4rem] top-1 flex h-3 w-3 rounded-full border-2 border-gray-950 bg-gray-600"
                aria-hidden
              />
              {!isLast ? (
                <span
                  className="absolute -left-[1.15rem] top-4 bottom-0 w-px bg-white/10"
                  aria-hidden
                />
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-cyan-200/85">
                  {row.time}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${alertKindRingClass(kind)}`}
                >
                  <span aria-hidden>{alertKindIcon(kind)}</span>
                  {row.title}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-200">{row.text}</p>
              {row.detailLines && row.detailLines.length > 1 ? (
                <ul className="mt-2 space-y-1 border-l border-white/10 pl-3 text-xs text-gray-400">
                  {row.detailLines.slice(0, 5).map((line, j) => (
                    <li key={j}>• {line}</li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-1 text-[10px] text-gray-600">
                {formatRelativeAlertTime(row.at)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
