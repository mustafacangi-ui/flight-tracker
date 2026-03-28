"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import FlightCardLiveRow from "./FlightCardLiveRow";
import SectionHeader from "./SectionHeader";
import {
  groupAlertsForCenter,
  type AlertTimelineItem,
} from "../lib/alertHistoryStorage";
import {
  alertKindIcon,
  alertKindRingClass,
  formatRelativeAlertTime,
} from "../lib/alertCardVisual";
import { alertFlightTrackContext } from "../lib/flightCardLink";

function formatClock(at: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(at));
}

function AlertCard({ a }: { a: AlertTimelineItem }) {
  const router = useRouter();
  const ring = alertKindRingClass(a.kind);
  const icon = alertKindIcon(a.kind);
  const title = a.title ?? a.kind;
  const ctx = alertFlightTrackContext(a.flightNumber, a.text);

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => router.push(ctx.trackHref)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(ctx.trackHref);
        }
      }}
      className="cursor-pointer rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-sm transition hover:scale-[1.01] hover:border-blue-500/30 hover:shadow-[0_0_28px_rgba(59,130,246,0.12)]"
    >
      <div className="flex gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ring-1 ${ring}`}
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {title}
            </span>
            <span className="font-mono text-sm font-bold text-amber-200/90">
              {a.flightNumber}
            </span>
          </div>
          <p className="mt-1 text-sm leading-snug text-gray-200">{a.text}</p>
          {a.detailLines && a.detailLines.length > 0 ? (
            <ul className="mt-2 space-y-1 rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs text-gray-400">
              {a.detailLines.map((line, i) => (
                <li key={i}>• {line}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-gray-500">
              {formatClock(a.at)} · {formatRelativeAlertTime(a.at)}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <FlightCardLiveRow
                trackHref={ctx.trackHref}
                flightNumber={a.flightNumber}
                originLabel={ctx.originLabel}
                destLabel={ctx.destLabel}
                estimatedArrivalHm={ctx.estimatedArrivalHm}
              />
              <Link
                href={`/flight/${encodeURIComponent(a.flightNumber)}`}
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                Full detail
              </Link>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: AlertTimelineItem[];
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <SectionHeader
        title={title}
        titleClassName="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500"
        className="mb-0"
      />
      <ul className="space-y-3">
        {items.map((a) => (
          <AlertCard key={a.id} a={a} />
        ))}
      </ul>
    </section>
  );
}

type Props = {
  items: AlertTimelineItem[];
  className?: string;
};

export default function AlertsTimeline({ items, className = "" }: Props) {
  const { live, today, yesterday, older } = groupAlertsForCenter(items);

  return (
    <div className={`space-y-10 ${className}`.trim()}>
      <Section title="Live" items={live} />
      <Section title="Today" items={today} />
      <Section title="Yesterday" items={yesterday} />
      <Section title="Older" items={older} />
    </div>
  );
}
