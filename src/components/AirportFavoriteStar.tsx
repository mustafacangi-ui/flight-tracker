"use client";

import { useQuickAccess } from "../hooks/useQuickAccess";
import { trackEvent } from "../lib/localAnalytics";
import {
  isFavoriteAirportCode,
  toggleFavoriteAirport,
  type FavoriteAirport,
} from "../lib/quickAccessStorage";

const starOn =
  "text-amber-300/95 drop-shadow-[0_0_10px_rgba(251,191,36,0.35)]";
const starOff = "text-white/40 hover:text-amber-200/60";

type Props = {
  airport: FavoriteAirport;
  size?: "sm" | "md";
  className?: string;
};

export default function AirportFavoriteStar({
  airport,
  size = "md",
  className = "",
}: Props) {
  const { favoriteAirports } = useQuickAccess();
  const fav = isFavoriteAirportCode(airport.code, favoriteAirports);
  const textSize = size === "sm" ? "text-sm" : "text-xl";

  return (
    <button
      type="button"
      className={`shrink-0 rounded-lg p-1 outline-none transition duration-200 hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-95 ${className}`}
      aria-label={
        fav ? `Remove ${airport.code} from favorites` : `Favorite ${airport.code}`
      }
      aria-pressed={fav}
      onClick={(e) => {
        e.preventDefault();
        if (!fav) {
          trackEvent("save_airport_favorite", { airport: airport.code });
        }
        toggleFavoriteAirport(airport);
      }}
    >
      <span className={`select-none leading-none ${textSize} ${fav ? starOn : starOff}`}>
        {fav ? "★" : "☆"}
      </span>
    </button>
  );
}
