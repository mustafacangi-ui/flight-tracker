"use client";

import { useCallback, useEffect, useState } from "react";

import {
  FLIGHT_TRACKING_UPDATED_EVENT,
  isFlightTracked as isTracked,
  loadTrackedFlightNumbers,
  setFlightTracked as setTracked,
} from "../lib/flightTrackingStorage";

export function useFlightTracking() {
  const [tracked, setTrackedState] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setTrackedState(loadTrackedFlightNumbers());
  }, []);

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener(FLIGHT_TRACKING_UPDATED_EVENT, on);
    return () => window.removeEventListener(FLIGHT_TRACKING_UPDATED_EVENT, on);
  }, [refresh]);

  const setFlightTracked = useCallback((flightNumber: string, on: boolean) => {
    setTracked(flightNumber, on);
    refresh();
  }, [refresh]);

  return {
    trackedFlightNumbers: tracked,
    isFlightTracked: (fn: string) => isTracked(fn),
    setFlightTracked,
    refreshTracked: refresh,
  };
}
