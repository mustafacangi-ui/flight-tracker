import type { Metadata } from "next";

import {
  getMockFlightDetail,
  isMockFlightRegistered,
} from "../../../lib/mockFlightDetails";
import FlightDetailClient from "./FlightDetailClient";

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
  const detail = getMockFlightDetail(decoded);
  const found = isMockFlightRegistered(decoded);
  const dep = detail.departureAirportCode ?? "—";
  const arr = detail.arrivalAirportCode ?? "—";
  const fn = detail.flightNumber ?? "Flight";

  const title = found
    ? `${fn} · ${dep} → ${arr}`
    : "Flight not found";

  const description = found
    ? `Status, gates, and timeline for ${fn} from ${detail.departureCity ?? dep} to ${detail.arrivalCity ?? arr}.`
    : "This flight could not be found.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: "/icons/icon-512.png",
          width: 512,
          height: 512,
          alt: `${fn} status`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/icons/icon-512.png"],
    },
    other: {
      "flight:number": fn,
      "airport:departure": dep,
      "airport:arrival": arr,
    },
  };
}

export default async function FlightDetailPage({
  params,
}: {
  params: Promise<{ flightNumber: string }>;
}) {
  const { flightNumber } = await params;

  let decoded = flightNumber;
  try {
    decoded = decodeURIComponent(flightNumber);
  } catch {
    /* use raw segment */
  }

  const detail = getMockFlightDetail(decoded);
  const found = isMockFlightRegistered(decoded);

  return <FlightDetailClient detail={detail} found={found} />;
}
