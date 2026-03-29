"use client";

import dynamic from "next/dynamic";

import LiveFlightSkeleton from "./LiveFlightSkeleton";
import type { LiveFlightMapProps } from "./LiveFlightMap";

const LiveFlightMap = dynamic(() => import("./LiveFlightMap"), {
  ssr: false,
  loading: () => <LiveFlightSkeleton compact />,
});

export default function LiveFlightMapLazy(props: LiveFlightMapProps) {
  return <LiveFlightMap {...props} />;
}
