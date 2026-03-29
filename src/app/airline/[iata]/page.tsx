import type { Metadata } from "next";
import { notFound } from "next/navigation";

import AirlineSeoView from "../../../components/seo/AirlineSeoView";
import { getAirlineSeoMeta, SEO_AIRLINE_IATA } from "../../../lib/seo/catalog";

function normalizeIata(raw: string): string {
  try {
    return decodeURIComponent(raw).trim().toUpperCase();
  } catch {
    return raw.trim().toUpperCase();
  }
}

export function generateStaticParams(): { iata: string }[] {
  return SEO_AIRLINE_IATA.map((iata) => ({ iata }));
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ iata: string }>;
}): Promise<Metadata> {
  const { iata: raw } = await params;
  const code = normalizeIata(raw);
  if (!/^[A-Z]{2}$/.test(code)) {
    return { title: "Airline" };
  }
  const meta = getAirlineSeoMeta(code);
  const title = meta ? `${meta.name} (${code})` : `${code} airline`;
  return {
    title: `${title} · Baggage, cabins & check-in`,
    description: meta
      ? `Travel guide for ${meta.name}: baggage rules, cabin classes, check-in tips, and alliance context. Based in ${meta.country}.`
      : `Travel guide for airline ${code}: baggage, cabins, check-in, and links to routes & airports on RouteWings.`,
  };
}

export default async function AirlineSeoPage({
  params,
}: {
  params: Promise<{ iata: string }>;
}) {
  const { iata: raw } = await params;
  const code = normalizeIata(raw);
  if (!/^[A-Z]{2}$/.test(code)) {
    notFound();
  }
  return <AirlineSeoView iata={code} />;
}
