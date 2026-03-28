"use client";

import type { FlightDetail } from "../../lib/flightDetailsTypes";
import { familyFriendlyStatusMessages } from "../../lib/familyShareView";

function cardPad(familyMode: boolean) {
  return familyMode ? "p-8 sm:p-10" : "p-6 sm:p-8";
}

type Props = {
  detail: FlightDetail;
  familyMode: boolean;
};

export default function FamilyStatusCard({ detail, familyMode }: Props) {
  const messages = familyFriendlyStatusMessages(detail, familyMode);
  const body = familyMode
    ? "text-lg sm:text-xl leading-relaxed"
    : "text-base sm:text-lg";

  return (
    <section
      className={`rounded-3xl border border-white/[0.08] bg-white/[0.04] ${cardPad(familyMode)} shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-5`}
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
        {familyMode ? "Reassuring updates" : "Live status"}
      </h2>
      {messages.map((line, i) => (
        <p key={i} className={`leading-relaxed text-gray-200 ${body}`}>
          {line}
        </p>
      ))}
    </section>
  );
}
