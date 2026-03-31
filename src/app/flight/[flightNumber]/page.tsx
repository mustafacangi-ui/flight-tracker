import type { Metadata } from "next";

import { getFlightHybrid, type FlightDetail } from "../../../lib/flightProviders";
import FlightDetailClient from "./FlightDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ flightNumber: string }>;
}): Promise<Metadata> {
  const { flightNumber } = await params;
  
  const rawFlightNumber = flightNumber ?? ''
  const normalizedFlightNumber = decodeURIComponent(rawFlightNumber)
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .toUpperCase()
  
  console.log('[flight-page] raw=', rawFlightNumber)
  console.log('[flight-page] normalized=', normalizedFlightNumber)
  
  const flight = await getFlightHybrid(normalizedFlightNumber);
  
  const found = !!flight;
  const dep = flight?.departure?.airport?.iata ?? flight?.departure?.airport?.icao ?? "—";
  const arr = flight?.arrival?.airport?.iata ?? flight?.arrival?.airport?.icao ?? "—";
  const fn = flight?.number ?? normalizedFlightNumber;
  const depCity = flight?.departure?.airport?.municipalityName ?? dep;
  const arrCity = flight?.arrival?.airport?.municipalityName ?? arr;

  const title = found
    ? `${fn} · ${dep} → ${arr}`
    : "Flight not found";

  const description = found
    ? `Status, gates, and timeline for ${fn} from ${depCity} to ${arrCity}.`
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

  const rawFlightNumber = flightNumber ?? ''
  const normalizedFlightNumber = decodeURIComponent(rawFlightNumber)
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .toUpperCase()

  console.log('[flight-page] raw=', rawFlightNumber)
  console.log('[flight-page] normalized=', normalizedFlightNumber)

  const flight = await getFlightHybrid(normalizedFlightNumber);
  const found = !!flight;

  console.log('[flight-page] flight found:', found)
  console.log('[flight-page] flight data:', flight ? 'EXISTS' : 'NULL')

  // Serialize to ensure it's JSON-safe for client component
  const safeFlight = flight ? JSON.parse(JSON.stringify(flight)) : null;

  return <FlightDetailClient flight={safeFlight} found={found} />;
}
