import type { Metadata } from "next";

import { mergeAircraftTailIntelligence } from "../../../lib/aircraftTailFallbacks";
import { mergeFlightDetailWithFallbacks } from "../../../lib/flightDetailFallbacks";
import {
  getMockFlightDetail,
  isMockFlightRegistered,
} from "../../../lib/mockFlightDetails";
import { flightNumberFromShareId } from "../../../lib/shareFlightId";
import ShareFlightClient from "./ShareFlightClient";

function resolveShareFlightContext(rawParam: string) {
  let flightNumberParam = rawParam;
  try {
    flightNumberParam = decodeURIComponent(rawParam);
  } catch {
    /* use raw */
  }

  const flightKey = flightNumberFromShareId(flightNumberParam);
  const found = isMockFlightRegistered(flightKey);
  const base = getMockFlightDetail(flightKey);
  const detail = found
    ? mergeAircraftTailIntelligence(
        mergeFlightDetailWithFallbacks(base)
      )
    : base;

  return { flightNumberParam, flightKey, found, detail };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ flightNumber: string }>;
}): Promise<Metadata> {
  const { flightNumber } = await params;
  const { found, detail } = resolveShareFlightContext(flightNumber);
  const dep = detail.departureAirportCode ?? "—";
  const arr = detail.arrivalAirportCode ?? "—";
  const fn = detail.flightNumber ?? "Flight";

  const title = found
    ? `${fn} · ${dep} → ${arr} · Family updates`
    : "Flight not found";

  const description = found
    ? `Live-friendly updates for ${fn}. ${detail.departureCity ?? dep} (${dep}) to ${detail.arrivalCity ?? arr} (${arr}). Share with family.`
    : "This shared flight link could not be found. Ask for a new link.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "/icons/icon-512.png",
          width: 512,
          height: 512,
          alt: `${fn} flight status`,
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

export default async function FamilySharePage({
  params,
}: {
  params: Promise<{ flightNumber: string }>;
}) {
  const { flightNumber: rawParam } = await params;
  const { flightNumberParam, found, detail } =
    resolveShareFlightContext(rawParam);

  if (!found) {
    return (
      <div className="min-h-screen bg-[#0c0c0f] px-4 py-16 text-center text-white">
        <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-10 shadow-[0_12px_48px_rgba(0,0,0,0.4)]">
          <p className="text-2xl font-semibold text-rose-100">
            We couldn’t find this flight
          </p>
          <p className="mt-4 text-lg text-gray-400">
            The link may be old or mistyped. Ask your loved one to send a fresh
            link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ShareFlightClient
      flightNumberParam={flightNumberParam}
      detail={detail}
    />
  );
}
