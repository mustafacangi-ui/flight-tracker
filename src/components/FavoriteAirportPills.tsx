"use client";

import type { FavoriteAirport } from "../lib/quickAccessStorage";

type Props = {
  airports: FavoriteAirport[];
  onSelect: (a: FavoriteAirport) => void;
};

export default function FavoriteAirportPills({
  airports,
  onSelect,
}: Props) {
  if (airports.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-full text-[11px] font-medium uppercase tracking-wider text-gray-500 md:w-auto">
        Favorites
      </span>
      <div className="flex flex-wrap gap-2">
        {airports.map((a) => (
          <button
            key={a.code}
            type="button"
            onClick={() => onSelect(a)}
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 font-mono text-sm font-semibold text-amber-200 transition hover:border-amber-400/50 hover:bg-amber-500/15"
          >
            {a.code}
          </button>
        ))}
      </div>
    </div>
  );
}
