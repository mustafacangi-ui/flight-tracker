"use client";

import type { FamilyMilestoneStep } from "../../lib/familyShareView";

function cardPad(familyMode: boolean) {
  return familyMode ? "p-8 sm:p-10" : "p-6 sm:p-8";
}

type Props = {
  steps: readonly FamilyMilestoneStep[];
  currentIdx: number;
  familyMode: boolean;
};

export default function FlightMilestones({
  steps,
  currentIdx,
  familyMode,
}: Props) {
  const small = familyMode ? "text-base sm:text-lg" : "text-sm sm:text-base";

  return (
    <section
      className={`rounded-3xl border border-white/[0.08] bg-white/[0.04] ${cardPad(familyMode)} shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-md`}
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
        {familyMode ? "Journey steps" : "Flight milestones"}
      </h2>
      <ol className="mt-8 space-y-0">
        {steps.map((label, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li key={label} className="relative flex gap-5 pb-10 last:pb-0">
              {i < steps.length - 1 ? (
                <span
                  className={`absolute left-[0.6rem] top-8 h-[calc(100%-0.5rem)] w-0.5 ${
                    done || active
                      ? "bg-gradient-to-b from-rose-400/60 to-white/10"
                      : "bg-white/10"
                  }`}
                  aria-hidden
                />
              ) : null}
              <span
                className={`relative z-[1] mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  active
                    ? "bg-sky-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.65)] ring-4 ring-sky-400/35"
                    : done
                      ? "bg-emerald-500/90 text-white"
                      : "border border-white/20 bg-transparent"
                }`}
                aria-hidden
              >
                {done ? "✓" : active ? "●" : ""}
              </span>
              <div className="min-w-0 pt-0.5">
                <p
                  className={`font-semibold ${
                    familyMode ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
                  } ${
                    active
                      ? "text-sky-100"
                      : done
                        ? "text-gray-400"
                        : "text-gray-600"
                  }`}
                >
                  {label}
                </p>
                {active ? (
                  <p className={`mt-1 text-sky-200/85 ${small}`}>
                    {familyMode ? "Right now" : "Current milestone"}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
