"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  AnalyticsEvents,
  trackProductEvent,
} from "../lib/analytics/telemetry";
import type { AircraftLivePosition } from "../lib/live/types";

type State = {
  position: AircraftLivePosition | null;
  regionalLabel: string | null;
  loading: boolean;
  error: boolean;
};

const DEFAULT_POLL_MS = 45_000;

export function useLiveAircraftPosition(opts: {
  flightNumber: string;
  departureAirportCode?: string | null;
  arrivalAirportCode?: string | null;
  enabled: boolean;
  pollMs?: number;
}) {
  const pollMs = opts.pollMs ?? DEFAULT_POLL_MS;
  const [state, setState] = useState<State>({
    position: null,
    regionalLabel: null,
    loading: false,
    error: false,
  });

  const loadedTracked = useRef(false);
  const fallbackTracked = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOnce = useCallback(async (silent?: boolean) => {
    const fn = opts.flightNumber?.trim();
    if (!fn || !opts.enabled) return;

    if (!silent) {
      setState((s) => ({ ...s, loading: true, error: false }));
    }
    try {
      const params = new URLSearchParams({ flight: fn });
      if (opts.departureAirportCode) {
        params.set("dep", opts.departureAirportCode);
      }
      if (opts.arrivalAirportCode) {
        params.set("arr", opts.arrivalAirportCode);
      }
      const res = await fetch(`/api/live/aircraft-position?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as {
        position: AircraftLivePosition | null;
        regionalLabel: string | null;
      };
      setState({
        position: data.position,
        regionalLabel: data.regionalLabel,
        loading: false,
        error: false,
      });

      if (data.position && !loadedTracked.current) {
        loadedTracked.current = true;
        trackProductEvent(AnalyticsEvents.live_radar_loaded, {
          source: data.position.source,
        });
      } else if (!data.position && !fallbackTracked.current) {
        fallbackTracked.current = true;
        trackProductEvent(AnalyticsEvents.live_radar_fallback_used, {});
      }
    } catch {
      setState((s) => ({
        ...s,
        loading: false,
        error: true,
      }));
      if (!fallbackTracked.current) {
        fallbackTracked.current = true;
        trackProductEvent(AnalyticsEvents.live_radar_fallback_used, {
          network_error: true,
        });
      }
    }
  }, [
    opts.arrivalAirportCode,
    opts.departureAirportCode,
    opts.enabled,
    opts.flightNumber,
  ]);

  useEffect(() => {
    loadedTracked.current = false;
    fallbackTracked.current = false;
    if (!opts.enabled || !opts.flightNumber?.trim()) {
      setState({
        position: null,
        regionalLabel: null,
        loading: false,
        error: false,
      });
      return;
    }

    void fetchOnce();

    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      void fetchOnce(true);
    };

    timerRef.current = setInterval(tick, pollMs);
    const onVis = () => {
      if (!document.hidden) void fetchOnce(true);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [opts.enabled, opts.flightNumber, fetchOnce, pollMs]);

  return { ...state, refetch: () => void fetchOnce(false) };
}
