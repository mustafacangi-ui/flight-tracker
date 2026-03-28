"use client";

import { useEffect, useRef } from "react";

import type { DisplayFlight } from "../lib/formatFlights";
import { emitTrackedFlightAlert } from "../lib/emitTrackedFlightAlert";
import { isFlightTracked } from "../lib/flightTrackingStorage";

type Snap = { gate: string; status: string };

/**
 * Compare live board rows with previous fetch for saved flights; emit alerts + notifications.
 */
export function useSmartFlightTracking(
  flights: DisplayFlight[],
  mode: "departure" | "arrival",
  enabled: boolean
): void {
  const mapRef = useRef<Map<string, Snap>>(new Map());
  const sigRef = useRef("");

  useEffect(() => {
    if (!enabled || flights.length === 0) return;

    const sig = JSON.stringify(
      flights.map((f) => [f.number, f.gate, f.statusLabel])
    );
    const shouldEmit = sigRef.current !== "" && sig !== sigRef.current;
    sigRef.current = sig;

    const map = mapRef.current;
    const nextKeys = new Set<string>();

    for (const f of flights) {
      const key = f.number.trim().toUpperCase();
      nextKeys.add(key);
      if (!isFlightTracked(f.number)) continue;

      const gate = (f.gate || "").trim() || "—";
      const status = (f.statusLabel || "").trim() || "—";
      const prev = map.get(key);

      if (prev && shouldEmit) {
        if (
          gate !== prev.gate &&
          gate !== "—" &&
          prev.gate !== "—" &&
          !f.gateMissing
        ) {
          emitTrackedFlightAlert({
            flightNumber: f.number,
            text: `${f.number} gate changed to ${gate}`,
            kind: "gate",
          });
        }

        if (status !== prev.status) {
          const low = status.toLowerCase();
          const pLow = prev.status.toLowerCase();
          if (low.includes("delay") && !pLow.includes("delay")) {
            emitTrackedFlightAlert({
              flightNumber: f.number,
              text: `${f.number} delayed`,
              kind: "delayed",
            });
          } else if (low.includes("board") && !pLow.includes("board")) {
            emitTrackedFlightAlert({
              flightNumber: f.number,
              text: `${f.number} boarding soon`,
              kind: "boarding",
            });
          } else if (low.includes("depart") && !pLow.includes("depart")) {
            emitTrackedFlightAlert({
              flightNumber: f.number,
              text: `${f.number} departed`,
              kind: "departed",
            });
          } else if (
            (low.includes("arriv") || low.includes("land")) &&
            !pLow.includes("arriv") &&
            !pLow.includes("land")
          ) {
            emitTrackedFlightAlert({
              flightNumber: f.number,
              text: `${f.number} landed`,
              kind: "landed",
            });
          } else if (low.includes("cancel") && !pLow.includes("cancel")) {
            emitTrackedFlightAlert({
              flightNumber: f.number,
              text: `${f.number} cancelled`,
              kind: "cancelled",
            });
          } else if (
            (low.includes("baggage") || low.includes("claim")) &&
            !pLow.includes("baggage") &&
            !pLow.includes("claim")
          ) {
            emitTrackedFlightAlert({
              flightNumber: f.number,
              text: `${f.number}: baggage claim update`,
              kind: "baggage",
            });
          }
        }
      }

      map.set(key, { gate, status });
    }

    for (const k of map.keys()) {
      if (!nextKeys.has(k)) map.delete(k);
    }
  }, [flights, mode, enabled]);
}
