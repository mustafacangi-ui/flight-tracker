"use client";

import type { FlightDetail } from "../../lib/flightDetailsTypes";
import { familyArrivalHelperLines } from "../../lib/familyShareView";

function cardPad(familyMode: boolean) {
  return familyMode ? "p-8 sm:p-10" : "p-6 sm:p-8";
}

type Props = {
  detail: FlightDetail;
  familyMode: boolean;
};

export default function FamilyArrivalHelpers({ detail, familyMode }: Props) {
  const lines = familyArrivalHelperLines(detail, familyMode);
  const body = familyMode
    ? "text-lg sm:text-xl leading-relaxed"
    : "text-base sm:text-lg";

  return (
    <section
      className={`rounded-3xl border border-white/[0.08] bg-white/[0.04] ${cardPad(familyMode)} shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-md`}
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
        After landing
      </h2>
      <p className={`mt-4 text-gray-400 ${familyMode ? "text-base" : "text-sm"}`}>
        {familyMode
          ? "Rough guides only — every airport is different."
          : "Illustrative timings; confirm on site."}
      </p>
      <ul className={`mt-6 space-y-4 ${body} text-gray-200`}>
        {lines.map((line, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-rose-300/90" aria-hidden>
              ✦
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
