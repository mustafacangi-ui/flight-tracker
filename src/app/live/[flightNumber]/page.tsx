import type { Metadata } from "next";

import LiveFlightPageClient from "../../../components/live/LiveFlightPageClient";
import { mergeAircraftTailIntelligence } from "../../../lib/aircraftTailFallbacks";
import { mergeFlightDetailWithFallbacks } from "../../../lib/flightDetailFallbacks";
import {
  getMockFlightDetail,
  isMockFlightRegistered,
} from "../../../lib/mockFlightDetails";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ flightNumber: string }>;
}): Promise<Metadata> {
  const { flightNumber } = await params;
  let decoded = flightNumber;
  try {
    decoded = decodeURIComponent(flightNumber);
  } catch {
    /* raw */
  }
  const d = getMockFlightDetail(decoded);
  const fn = d.flightNumber ?? "Flight";
  return {
    title: `Live · ${fn}`,
    description: `Live track map and status for ${fn}.`,
  };
}

export default async function LiveFlightPage({
  params,
}: {
  params: Promise<{ flightNumber: string }>;
}) {
  const { flightNumber } = await params;
  let decoded = flightNumber;
  try {
    decoded = decodeURIComponent(flightNumber);
  } catch {
    /* raw */
  }

  const base = getMockFlightDetail(decoded);
  const found = isMockFlightRegistered(decoded);
  const detail = mergeAircraftTailIntelligence(
    mergeFlightDetailWithFallbacks(base)
  );

  return <LiveFlightPageClient detail={detail} found={found} />;
}
