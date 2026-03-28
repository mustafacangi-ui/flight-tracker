"use client";

import { useCallback, useEffect, useState } from "react";

import type { SavedFlight } from "../lib/quickAccessStorage";
import {
  loadSavedFlights,
  QUICK_ACCESS_UPDATED_EVENT,
  removeSavedFlight,
  toggleSavedFlight,
  upsertSavedFlight,
} from "../lib/quickAccessStorage";

export function useSavedFlights() {
  const [savedFlights, setSavedFlights] = useState<SavedFlight[]>([]);

  const refresh = useCallback(() => {
    setSavedFlights(loadSavedFlights());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const on = () => refresh();
    window.addEventListener(QUICK_ACCESS_UPDATED_EVENT, on);
    window.addEventListener("storage", (e) => {
      if (e.key === "savedFlights" || e.key === null) refresh();
    });
    return () => window.removeEventListener(QUICK_ACCESS_UPDATED_EVENT, on);
  }, [refresh]);

  const save = useCallback((flight: SavedFlight) => {
    setSavedFlights(upsertSavedFlight(flight));
  }, []);

  const remove = useCallback((flightNumber: string) => {
    setSavedFlights(removeSavedFlight(flightNumber));
  }, []);

  const toggle = useCallback((flight: SavedFlight) => {
    const { saved, list } = toggleSavedFlight(flight);
    setSavedFlights(list);
    return { saved, list };
  }, []);

  return {
    savedFlights,
    refresh,
    save,
    remove,
    toggle,
  };
}
