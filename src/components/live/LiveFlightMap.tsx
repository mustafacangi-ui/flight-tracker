"use client";

import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";

import { resolveRouteLatLng } from "../../lib/airportCoordinates";
import type { AircraftLivePosition } from "../../lib/live/types";
import {
  buildCurvedRoutePoints,
  positionAlongRoute,
} from "../../lib/liveFlightRoute";

export type LiveFlightMapProps = {
  departureAirportCode?: string | null;
  arrivalAirportCode?: string | null;
  progressPercent: number;
  className?: string;
  /** ADS-B / API sample; when valid, overrides simulated aircraft position */
  liveSample?: AircraftLivePosition | null;
  regionalLabel?: string | null;
};

function bearingDeg(a: [number, number], b: [number, number]): number {
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function FitBounds({ points }: { points: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const b = L.latLngBounds(points as [number, number][]);
    map.fitBounds(b, { padding: [28, 28], maxZoom: 7, animate: true });
  }, [map, points]);
  return null;
}

function MapReady({ onReady }: { onReady: () => void }) {
  const map = useMap();
  useEffect(() => {
    map.whenReady(() => onReady());
  }, [map, onReady]);
  return null;
}

export default function LiveFlightMap({
  departureAirportCode,
  arrivalAirportCode,
  progressPercent,
  className = "",
  liveSample,
  regionalLabel,
}: LiveFlightMapProps) {
  const [ready, setReady] = useState(false);
  const { dep, arr } = useMemo(
    () => resolveRouteLatLng(departureAirportCode, arrivalAirportCode),
    [departureAirportCode, arrivalAirportCode]
  );

  const route = useMemo(() => buildCurvedRoutePoints(dep, arr, 56), [dep, arr]);
  const t = Math.min(100, Math.max(0, progressPercent)) / 100;
  const simPos = useMemo(
    () => positionAlongRoute(route, t),
    [route, t]
  );

  const simHeading = useMemo(() => {
    if (route.length < 2) return 0;
    const maxI = route.length - 2;
    const idx = Math.min(maxI, Math.max(0, Math.floor(t * maxI)));
    const a = route[idx] as [number, number];
    const b = route[idx + 1] as [number, number];
    return bearingDeg(a, b);
  }, [route, t]);

  const useLive =
    liveSample != null &&
    Number.isFinite(liveSample.latitude) &&
    Number.isFinite(liveSample.longitude) &&
    Math.abs(liveSample.latitude) <= 90 &&
    Math.abs(liveSample.longitude) <= 180;

  const planePos: LatLngExpression = useLive
    ? [liveSample!.latitude, liveSample!.longitude]
    : simPos;

  const headingDeg =
    useLive && liveSample!.heading != null
      ? liveSample!.heading
      : simHeading;

  const planeIcon = useMemo(
    () =>
      L.divIcon({
        className: `live-plane-marker${useLive ? " live-plane-marker--live" : ""}`,
        html: `<div class="live-plane-stack" style="transform: rotate(${headingDeg}deg)" aria-hidden="true"><div class="live-plane-inner">✈</div></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
    [headingDeg, useLive]
  );

  const boundsPoints: LatLngExpression[] = useMemo(
    () => [...route, planePos],
    [route, planePos]
  );

  const center: LatLngExpression = [
    (dep[0] + arr[0]) / 2,
    (dep[1] + arr[1]) / 2,
  ];

  const footerLive = useLive
    ? `Live ADS-B sample · ${liveSample!.source} · not for navigation`
    : "Simulated position along route · not for navigation";

  return (
    <div
      className={`live-flight-map-wrap overflow-hidden rounded-2xl border border-blue-500/35 bg-slate-950 shadow-[0_0_48px_rgba(37,99,235,0.2)] ring-1 ring-sky-500/15 sm:rounded-3xl ${className}`}
    >
      <div className="relative h-[min(52vh,440px)] min-h-[260px] w-full">
        {!ready ? (
          <div className="absolute inset-0 z-[400] flex items-center justify-center bg-slate-950/80 text-sm text-slate-500">
            Initializing map…
          </div>
        ) : null}
        <MapContainer
          center={center}
          zoom={4}
          className="h-full w-full rounded-2xl sm:rounded-3xl"
          scrollWheelZoom
          style={{ background: "#0b1220" }}
        >
          <MapReady onReady={() => setReady(true)} />
          <FitBounds points={boundsPoints} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />
          <Polyline
            positions={route}
            pathOptions={{
              color: "#0ea5e9",
              weight: 2,
              opacity: useLive ? 0.22 : 0.35,
            }}
          />
          <Polyline
            positions={route}
            pathOptions={{
              color: "#38bdf8",
              weight: 4,
              opacity: useLive ? 0.55 : 0.92,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
          <CircleMarker
            center={dep}
            radius={9}
            pathOptions={{
              color: "#4ade80",
              fillColor: "#22c55e",
              fillOpacity: 0.95,
              weight: 2,
            }}
          />
          <CircleMarker
            center={arr}
            radius={9}
            pathOptions={{
              color: "#60a5fa",
              fillColor: "#3b82f6",
              fillOpacity: 0.95,
              weight: 2,
            }}
          />
          <Marker position={planePos} icon={planeIcon} />
        </MapContainer>
      </div>
      <div className="border-t border-white/5 px-4 py-2.5 text-center text-[10px] leading-relaxed text-slate-500">
        <p>{footerLive}</p>
        {useLive && regionalLabel ? (
          <p className="mt-1 font-medium text-slate-400">{regionalLabel}</p>
        ) : null}
      </div>
    </div>
  );
}
