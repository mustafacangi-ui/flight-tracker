"use client";

import { motion } from "framer-motion";
import { useId } from "react";

type Props = {
  departureCity: string;
  arrivalCity: string;
  progressPercent: number;
  familyMode?: boolean;
  /** When true, show stars and deeper night sky */
  isNight?: boolean;
};

export default function FamilyMapCard({
  departureCity,
  arrivalCity,
  progressPercent,
  familyMode = false,
  isNight = false,
}: Props) {
  const pct = Math.min(100, Math.max(0, progressPercent));
  const uid = useId().replace(/:/g, "");
  const gradId = `familyRouteGrad-${uid}`;
  const filterId = `familyGlow-${uid}`;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.45)] ${
        isNight
          ? "bg-gradient-to-b from-[#0a0a1a] via-[#0f1028] to-[#06060f]"
          : "bg-gradient-to-b from-sky-950/90 via-indigo-950/90 to-slate-950"
      } ${familyMode ? "p-8" : "p-6"}`}
    >
      {/* Glow */}
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl"
        aria-hidden
      />
      {isNight ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_55%)]"
          aria-hidden
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(251,191,36,0.08),transparent_50%)]"
          aria-hidden
        />
      )}

      {/* Stars (night) */}
      {isNight ? (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {[
            [12, 18],
            [28, 10],
            [55, 14],
            [72, 22],
            [88, 12],
            [18, 32],
            [44, 8],
            [92, 28],
          ].map(([x, y], i) => (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white/70 shadow-[0_0_6px_rgba(255,255,255,0.8)]"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))}
        </div>
      ) : null}

      {/* Clouds */}
      <div
        className="pointer-events-none absolute left-[8%] top-12 h-16 w-36 rounded-full bg-white/[0.08] blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[12%] top-14 h-14 w-32 rounded-full bg-white/[0.06] blur-xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[40%] top-20 h-10 w-24 rounded-full bg-white/[0.05] blur-xl"
        aria-hidden
      />

      <p className="relative text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-white/40">
        Journey map
      </p>

      <div className="relative mt-6 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 text-left">
          <p
            className={`truncate font-semibold text-white ${
              familyMode ? "text-lg sm:text-xl" : "text-base sm:text-lg"
            }`}
          >
            {departureCity || "Departure"}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-white/35">
            From
          </p>
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p
            className={`truncate font-semibold text-white ${
              familyMode ? "text-lg sm:text-xl" : "text-base sm:text-lg"
            }`}
          >
            {arrivalCity || "Arrival"}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-white/35">
            To
          </p>
        </div>
      </div>

      <div className="relative mx-auto mt-8 h-28 w-full max-w-md px-2">
        <svg
          className="absolute left-4 right-4 top-1/2 h-20 w-[calc(100%-2rem)] -translate-y-1/2 overflow-visible"
          viewBox="0 0 400 64"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0" x2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M 0 48 Q 200 4 400 48"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            d="M 0 48 Q 200 4 400 48"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="8 10"
            opacity="0.55"
            filter={`url(#${filterId})`}
          />
        </svg>
        <motion.div
          className="absolute top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-amber-200/55 bg-slate-950/95 text-xl shadow-[0_0_28px_rgba(251,191,36,0.45)]"
          initial={false}
          animate={{
            left: `${8 + (pct / 100) * 84}%`,
            y: -Math.sin((pct / 100) * Math.PI) * 28 - 8,
          }}
          transition={{ type: "spring", stiffness: 70, damping: 16 }}
        >
          ✈
        </motion.div>
      </div>

      <p className="relative mt-4 text-center text-xs leading-relaxed text-white/45">
        Stylized view — not a live navigation map
      </p>
    </div>
  );
}
