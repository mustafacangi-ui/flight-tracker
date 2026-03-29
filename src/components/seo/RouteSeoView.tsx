import Link from "next/link";

import { BlogRelatedForRoute } from "../blog/BlogContextRelated";
import {
  getAirportSeoMeta,
  getRouteSeoMeta,
} from "../../lib/seo/catalog";
import { breadcrumbListSchema, type FaqItem } from "../../lib/seo/schemas";
import JsonLd from "./JsonLd";
import SeoContentSection from "./SeoContentSection";
import SeoFaqSection from "./SeoFaqSection";
import SeoHero from "./SeoHero";
import SeoRelatedLinks from "./SeoRelatedLinks";
import type { SeoRelatedLink } from "./SeoRelatedLinks";

type Props = { origin: string; dest: string };

export default function RouteSeoView({ origin, dest }: Props) {
  const o = origin.toUpperCase();
  const d = dest.toUpperCase();
  const slug = `${o}-${d}`;
  const meta = getRouteSeoMeta(o, d);
  const oMeta = getAirportSeoMeta(o);
  const dMeta = getAirportSeoMeta(d);
  const oName = oMeta?.name ?? `${o} Airport`;
  const dName = dMeta?.name ?? `${d} Airport`;
  const typicalHours = meta?.typicalHours ?? null;
  const airlines = meta?.suggestedAirlines ?? [];

  const links: SeoRelatedLink[] = [
    { href: `/airport/${o}`, label: `${oName} (${o})`, hint: "Departures & arrivals" },
    { href: `/airport/${d}`, label: `${dName} (${d})`, hint: "Arrival airport" },
    { href: "/premium", label: "RouteWings Premium", hint: "Family links & live map" },
  ];

  const faqs: FaqItem[] = [
    {
      question: `How long is the flight from ${o} to ${d}?`,
      answer: typicalHours
        ? `Illustrative block times are often around ${typicalHours} hours on this city pair, but actual airborne time varies with winds, routing, and aircraft type.`
        : `Typical duration depends on aircraft, winds, and air traffic flow. Use airline schedules for official block times; this page provides general orientation only.`,
    },
    {
      question: "Which airlines fly this route?",
      answer:
        airlines.length > 0
          ? `Carriers such as ${airlines.join(", ")} often appear on similar markets — verify current operators on GDS or airline sites.`
          : "Operators change seasonally. Check airline booking engines and airport departure boards for the latest nonstop and one-stop options.",
    },
    {
      question: "How do delay trends compare?",
      answer:
        "Congestion at departure banks, hub curfews, and summer thunderstorms can shift punctuality. Monitor your first flight of the day if you need tight connections.",
    },
  ];

  const crumbs = breadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: `${o} → ${d}`, path: `/route/${slug}` },
  ]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#060910] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(37,99,235,0.14),transparent)]" />
      <div className="relative mx-auto max-w-2xl px-4 pb-20 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:max-w-4xl">
        <JsonLd data={crumbs} />

        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← Home
          </Link>
        </div>

        <SeoHero
          eyebrow="Route guide · RouteWings"
          title={`${o} to ${d}: flight travel context`}
          description={`Plan ${oName} to ${dName} with generic aviation guidance, delay awareness, and links to live boards. Not a substitute for airline schedules or NOTAM briefings.`}
        />

        <article className="mt-8 space-y-6 sm:space-y-8">
          {!meta ? (
            <p className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100/95">
              This city pair is not in our curated catalog — numbers below are
              generic placeholders only.
            </p>
          ) : null}

          <SeoContentSection
            id="duration"
            title="Average flight duration (illustrative)"
          >
            {typicalHours != null ? (
              <p>
                For planning purposes, many wide-body schedules block around{" "}
                <strong className="font-semibold text-slate-200">
                  {typicalHours} hours
                </strong>{" "}
                gate-to-gate between {o} and {d}. Headwinds, taxi times, and ATC
                reroutes change the experience every day.
              </p>
            ) : (
              <p>
                Published block times vary by season and equipment. Compare
                airline timetables and remember that &quot;flight time&quot; in
                apps often excludes ground delays.
              </p>
            )}
          </SeoContentSection>

          <SeoContentSection id="airlines" title="Airlines to compare">
            <p>
              {airlines.length > 0
                ? `Look for flights marketed or operated by: ${airlines.join(", ")}.`
                : "Search multiple carriers for nonstop and single-connection options — pricing and baggage rules differ materially."}{" "}
              Alliance loyalty may unlock lounge access or extra baggage on
              eligible fares.
            </p>
          </SeoContentSection>

          <SeoContentSection id="delays" title="Delay trends">
            <p>
              Hub airports at both ends can stack delays during bank
              departures. Evening arrivals into busy airspace may hold longer
              than morning waves. Use RouteWings delay views on each airport
              page for the current snapshot.
            </p>
          </SeoContentSection>

          <SeoContentSection id="popularity" title="Route popularity">
            <p>
              High-demand business routes and leisure peaks (holidays, school
              breaks) tighten seat inventory. Book early for premium cabins and
              consider mid-week departures for softer fares when flexible.
            </p>
          </SeoContentSection>

          <SeoContentSection id="airport-tips" title="Airport tips">
            <p>
              At {o}, confirm terminal and check-in zone before you leave for the
              airport. At {d}, review ground transport options — some cities favor
              rail while others rely on rideshare queues at peak arrival banks.
            </p>
          </SeoContentSection>

          <SeoRelatedLinks title="Continue exploring" links={links} />

          <BlogRelatedForRoute origin={o} dest={d} />

          <SeoFaqSection items={faqs} />
        </article>
      </div>
    </div>
  );
}
