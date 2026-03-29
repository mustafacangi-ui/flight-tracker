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
import {
  buildCurvedRoutePoints,
  positionAlongRoute,
} from "../../lib/liveFlightRoute";

export type LiveFlightMapProps = {
  departureAirportCode?: string | null;
  arrivalAirportCode?: string | null;
  progressPercent: number;
  className?: string;
};

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
}: LiveFlightMapProps) {
  const [ready, setReady] = useState(false);
  const { dep, arr } = useMemo(
    () => resolveRouteLatLng(departureAirportCode, arrivalAirportCode),
    [departureAirportCode, arrivalAirportCode]
  );

  const route = useMemo(() => buildCurvedRoutePoints(dep, arr, 56), [dep, arr]);
  const t = Math.min(100, Math.max(0, progressPercent)) / 100;
  const planePos = useMemo(
    () => positionAlongRoute(route, t),
    [route, t]
  );

  const planeIcon = useMemo(
    () =>
      L.divIcon({
        className: "live-plane-marker",
        html: `<div class="live-plane-inner" aria-hidden="true">✈</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
    []
  );

  const boundsPoints: LatLngExpression[] = useMemo(
    () => [...route, planePos],
    [route, planePos]
  );

  const center: LatLngExpression = [
    (dep[0] + arr[0]) / 2,
    (dep[1] + arr[1]) / 2,
  ];

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
              opacity: 0.35,
            }}
          />
          <Polyline
            positions={route}
            pathOptions={{
              color: "#38bdf8",
              weight: 4,
              opacity: 0.92,
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
      <p className="border-t border-white/5 px-4 py-2.5 text-center text-[10px] text-slate-500">
        Simulated position along route · not for navigation
      </p>
    </div>
  );
}
