"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import type { FlightDetail } from "../../lib/flightDetailsTypes";
import {
  buildPersonalizedFamilyShareMessage,
  FAMILY_RELATIONSHIP_CHOICES,
  type FamilyRelationshipOption,
  familyRouteCodes,
  familyShareCountdownLine,
  familyShareStatusLine,
  formatFamilyFlightTitle,
} from "../../lib/familyShareView";
import { trackEvent } from "../../lib/localAnalytics";

type Props = {
  detail: FlightDetail;
  shareUrl: string;
  flightNumberParam: string;
  familyMode: boolean;
};

function maskPrivateLink(url: string): string {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean).pop() ?? "";
    const masked =
      seg.length > 8
        ? `${seg.slice(0, 3)}···${seg.slice(-4)}`
        : seg
          ? `${seg.slice(0, 2)}···`
          : "···";
    return `${u.host}/share/${masked}`;
  } catch {
    return "Private tracking link ready";
  }
}

function isFlightDelayed(d: FlightDetail): boolean {
  if (d.statusTone === "yellow" || d.statusTone === "red") return true;
  const s = (d.status ?? "").toLowerCase();
  if (s.includes("delay")) return true;
  return d.badges?.some((b) => /delay/i.test(b.text)) ?? false;
}

function SmallPlaneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  );
}

function HeartSkyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0 2.485-4.5 8.25-9 12.75-4.5-4.5-9-10.265-9-12.75 0-2.485 2.015-4.5 4.5-4.5 1.074 0 2.088.39 2.875 1.1.787-.69 1.801-1.1 2.875-1.1 2.485 0 4.5 2.015 4.5 4.5Z"
      />
      <path
        strokeLinecap="round"
        d="M12 9v4m0 0-1.5-1.5M12 13l1.5-1.5"
        opacity="0.6"
      />
    </svg>
  );
}

const cardBase =
  "rounded-3xl border border-slate-800/90 bg-gradient-to-b from-slate-900/95 to-slate-950/98 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md transition-shadow duration-300 hover:shadow-[0_24px_72px_rgba(30,58,138,0.12)]";

const btnGhost =
  "flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700/90 bg-slate-800/50 px-4 py-3.5 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-800 active:scale-[0.99] sm:py-4";

const btnPrimary =
  "flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500 active:scale-[0.99] sm:py-4";

export default function RouteWingsFamilySharing({
  detail,
  shareUrl,
  flightNumberParam,
  familyMode,
}: Props) {
  const [memberName, setMemberName] = useState("");
  const [relationship, setRelationship] =
    useState<FamilyRelationshipOption>("mother");
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharedLive, setSharedLive] = useState(false);

  const pad = familyMode ? "p-6 sm:p-8" : "p-5 sm:p-6";
  const textLead = familyMode ? "text-base sm:text-lg" : "text-sm sm:text-base";
  const labelCls = "mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500";

  const { dep, arr } = familyRouteCodes(detail);
  const fn = formatFamilyFlightTitle(detail.flightNumber);
  const { status } = familyShareStatusLine(detail);
  const depTime =
    detail.estimatedDepartureTime ?? detail.departureTime ?? "—";
  const arrTime =
    detail.estimatedArrivalTime ?? detail.arrivalTime ?? "—";
  const etaLine = familyShareCountdownLine(detail);
  const delayed = isFlightDelayed(detail);
  const pct = Math.min(100, Math.max(0, detail.progressPercent ?? 0));
  const gate = detail.gate?.trim() || "—";
  const maskedUrl = maskPrivateLink(
    shareUrl ||
      (typeof window !== "undefined" ? window.location.href : "")
  );

  const personalizedBody = useMemo(
    () =>
      buildPersonalizedFamilyShareMessage(detail, shareUrl || "", {
        recipientName: memberName,
        relationship,
      }),
    [detail, shareUrl, memberName, relationship]
  );

  const whatsAppHref = useMemo(() => {
    if (!shareUrl) return "#";
    return `https://wa.me/?text=${encodeURIComponent(personalizedBody)}`;
  }, [personalizedBody, shareUrl]);

  const smsHref = useMemo(() => {
    if (!shareUrl) return "#";
    return `sms:?body=${encodeURIComponent(personalizedBody)}`;
  }, [personalizedBody, shareUrl]);

  const copyLink = useCallback(async () => {
    const url =
      shareUrl ||
      (typeof window !== "undefined"
        ? `${window.location.origin}/share/${encodeURIComponent(flightNumberParam)}`
        : "");
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      trackEvent("family_share_copy_link", {
        flightNumber: detail.flightNumber,
      });
      window.setTimeout(() => setCopiedLink(false), 2400);
    } catch {
      /* ignore */
    }
  }, [detail.flightNumber, flightNumberParam, shareUrl]);

  const shareLiveRoute = useCallback(async () => {
    await copyLink();
    setSharedLive(true);
    trackEvent("family_share_live_route_cta", {
      flightNumber: detail.flightNumber,
    });
    window.setTimeout(() => setSharedLive(false), 2400);
  }, [copyLink, detail.flightNumber]);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Share with family */}
      <section className={`${cardBase} ${pad}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/20">
              <HeartSkyIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                Share flight with family
              </h2>
              <p className={`mt-1 max-w-prose text-slate-400 ${textLead}`}>
                They get a private link — no app required. Stay connected
                across time zones.
              </p>
            </div>
          </div>
          <Link
            href="/roadmap"
            className="shrink-0 rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-100/95 transition hover:border-amber-400/50 hover:bg-amber-500/15"
          >
            Pro — unlimited sharing
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="family-member-name" className={labelCls}>
              Family member name
            </label>
            <input
              id="family-member-name"
              type="text"
              autoComplete="name"
              placeholder="Their first name"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3.5 text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label htmlFor="family-relationship" className={labelCls}>
              Relationship
            </label>
            <div className="relative">
              <select
                id="family-relationship"
                value={relationship}
                onChange={(e) =>
                  setRelationship(e.target.value as FamilyRelationshipOption)
                }
                className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3.5 pr-10 text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              >
                {FAMILY_RELATIONSHIP_CHOICES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                ▾
              </span>
            </div>
          </div>
        </div>

        <p className={`mt-5 text-xs text-slate-500 ${familyMode ? "sm:text-sm" : ""}`}>
          Private tracking link preview
        </p>
        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 font-mono text-xs text-slate-400 sm:text-sm">
          <svg
            className="h-4 w-4 shrink-0 text-emerald-400/90"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <span className="min-w-0 truncate">{maskedUrl}</span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("family_share_whatsapp", {
                flightNumber: detail.flightNumber,
              })
            }
            className={`${btnGhost} sm:flex-col sm:py-4`}
          >
            <svg
              className="h-5 w-5 text-[#25D366]"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
          <button type="button" onClick={() => void copyLink()} className={btnGhost}>
            {copiedLink ? "Copied!" : "Copy link"}
          </button>
          <a href={smsHref} className={`${btnGhost} sm:flex-col sm:py-4`}>
            <svg
              className="h-5 w-5 text-slate-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
            SMS
          </a>
        </div>
      </section>

      {/* Flight preview */}
      <section className={`${cardBase} ${pad}`}>
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          <SmallPlaneIcon className="h-4 w-4 text-blue-400/80" />
          Flight preview
        </div>
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">
              {fn}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                detail.statusTone === "green"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : detail.statusTone === "yellow"
                    ? "bg-amber-500/15 text-amber-200"
                    : detail.statusTone === "red"
                      ? "bg-rose-500/15 text-rose-200"
                      : "bg-slate-700/50 text-slate-300"
              }`}
            >
              {status}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                From
              </p>
              <p className="mt-0.5 text-lg font-semibold text-white">{dep}</p>
              <p className="text-sm text-slate-400">
                {detail.departureCity ?? detail.departureAirportName ?? ""}
              </p>
              <p className="mt-2 font-mono text-sm text-slate-300">
                Dep {depTime}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                To
              </p>
              <p className="mt-0.5 text-lg font-semibold text-white">{arr}</p>
              <p className="text-sm text-slate-400">
                {detail.arrivalCity ?? detail.arrivalAirportName ?? ""}
              </p>
              <p className="mt-2 font-mono text-sm text-slate-300">
                Arr {arrTime}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live family tracking */}
      <section className={`${cardBase} ${pad}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Live family tracking
          </h2>
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 ring-1 ring-emerald-500/25">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300/95">
              Live
            </span>
          </div>
        </div>
        <p className={`mt-2 text-slate-400 ${textLead}`}>
          A calm view for everyone waiting at home — route, timing, and gate at
          a glance.
        </p>

        <div className="relative mt-8 px-2">
          <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <span>{dep}</span>
            <span>{arr}</span>
          </div>
          <div className="relative mt-4 h-14">
            <div
              className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-800"
              aria-hidden
            />
            <motion.div
              className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600/40 via-blue-500 to-sky-400/90"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 22 }}
              aria-hidden
            />
            <motion.div
              className="absolute top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900 text-blue-400 shadow-lg shadow-blue-950/50 ring-2 ring-blue-500/40"
              initial={false}
              animate={{
                left: `${Math.min(98, Math.max(2, pct))}%`,
              }}
              transition={{ type: "spring", stiffness: 90, damping: 20 }}
            >
              <SmallPlaneIcon className="h-5 w-5 -rotate-45" />
            </motion.div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Estimated arrival
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {etaLine ?? arrTime}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Gate
            </p>
            <p className="mt-1 text-lg font-semibold text-white">{gate}</p>
            {delayed ? (
              <span className="mt-2 inline-flex rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-500/30">
                Delayed
              </span>
            ) : (
              <span className="mt-2 inline-flex rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200/90 ring-1 ring-emerald-500/20">
                On track
              </span>
            )}
          </div>
        </div>

        <button type="button" onClick={() => void shareLiveRoute()} className={`${btnPrimary} mt-6`}>
          {sharedLive ? "Link copied — share away!" : "Share live route"}
        </button>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
          <Link
            href="/roadmap"
            className="font-medium text-amber-200/80 underline decoration-amber-500/40 underline-offset-2 transition hover:text-amber-100"
          >
            Unlimited family sharing in Pro
          </Link>
          {" · "}
          More travelers, more peace of mind.
        </p>
      </section>
    </div>
  );
}
