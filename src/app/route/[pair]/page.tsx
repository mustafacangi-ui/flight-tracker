import type { Metadata } from "next";
import { notFound } from "next/navigation";

import RouteSeoView from "../../../components/seo/RouteSeoView";
import {
  getAirportSeoMeta,
  getRouteSeoMeta,
  parseRouteSlug,
  SEO_ROUTE_SLUGS,
} from "../../../lib/seo/catalog";

function normalizePair(raw: string): string {
  try {
    return decodeURIComponent(raw).trim().toUpperCase();
  } catch {
    return raw.trim().toUpperCase();
  }
}

export function generateStaticParams(): { pair: string }[] {
  return SEO_ROUTE_SLUGS.map((pair) => ({ pair }));
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair: raw } = await params;
  const slug = normalizePair(raw);
  const parsed = parseRouteSlug(slug);
  if (!parsed) {
    return { title: "Route" };
  }
  const { origin, dest } = parsed;
  const o = getAirportSeoMeta(origin);
  const d = getAirportSeoMeta(dest);
  const routeMeta = getRouteSeoMeta(origin, dest);
  const label =
    o && d ? `${o.city} (${origin}) → ${d.city} (${dest})` : `${origin} → ${dest}`;
  const durationHint =
    routeMeta != null
      ? ` Typical block time on this pair is often around ${routeMeta.typicalHours}h (illustrative).`
      : "";
  return {
    title: `${origin} to ${dest} · Route travel guide`,
    description: `Average duration context, airline ideas, delay trends, and airport tips for ${label}.${durationHint} Always confirm with your carrier.`,
  };
}

export default async function RouteSeoPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair: raw } = await params;
  const slug = normalizePair(raw);
  const parsed = parseRouteSlug(slug);
  if (!parsed) {
    notFound();
  }
  return <RouteSeoView origin={parsed.origin} dest={parsed.dest} />;
}
