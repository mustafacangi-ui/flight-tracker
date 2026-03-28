"use client";

import { useCallback, useEffect, useState } from "react";

import type { FavoriteAirport, SavedFlight } from "../lib/quickAccessStorage";
import {
  FAVORITE_AIRPORTS_KEY,
  loadFavoriteAirports,
  loadSavedFlights,
  QUICK_ACCESS_UPDATED_EVENT,
  SAVED_FLIGHTS_KEY,
} from "../lib/quickAccessStorage";

export function useQuickAccess() {
  const [favoriteAirports, setFavoriteAirports] = useState<FavoriteAirport[]>(
    []
  );
  const [savedFlights, setSavedFlights] = useState<SavedFlight[]>([]);

  const refresh = useCallback(() => {
    setFavoriteAirports(loadFavoriteAirports());
    setSavedFlights(loadSavedFlights());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === FAVORITE_AIRPORTS_KEY ||
        e.key === SAVED_FLIGHTS_KEY ||
        e.key === null
      ) {
        refresh();
      }
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener(QUICK_ACCESS_UPDATED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(QUICK_ACCESS_UPDATED_EVENT, onCustom);
    };
  }, [refresh]);

  return {
    favoriteAirports,
    savedFlights,
    refresh,
    setFavoriteAirports,
    setSavedFlights,
  };
}
