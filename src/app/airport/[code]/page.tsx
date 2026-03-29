import type { Metadata } from "next";
import { notFound } from "next/navigation";

import AirportDetailClient from "../../../components/airport/AirportDetailClient";
import AirportSeoBelowFold from "../../../components/seo/AirportSeoBelowFold";
import {
  getAirportSeoMeta,
  SEO_AIRPORT_CODES,
} from "../../../lib/seo/catalog";

function normalizeAirportParam(raw: string): string {
  try {
    return decodeURIComponent(raw).trim().toUpperCase();
  } catch {
    return raw.trim().toUpperCase();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code: raw } = await params;
  const code = normalizeAirportParam(raw);
  if (!/^[A-Z]{3,4}$/.test(code)) {
    return { title: "Airport" };
  }
  return {
    title: `${code} · Airport insights`,
    description: `Departures, arrivals, delay context, and weather-style snapshot for ${code}.`,
  };
}

export default async function AirportDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = normalizeAirportParam(raw);
  if (!/^[A-Z]{3,4}$/.test(code)) {
    notFound();
  }
  return (
    <>
      <AirportDetailClient airportCode={code} />
      <AirportSeoBelowFold airportCode={code} />
    </>
  );
}
