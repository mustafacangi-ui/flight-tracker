import Link from "next/link";

import {
  getAirlineSeoMeta,
  routesForAirline,
  SEO_AIRLINE_IATA,
} from "../../lib/seo/catalog";
import { breadcrumbListSchema, type FaqItem } from "../../lib/seo/schemas";
import JsonLd from "./JsonLd";
import SeoContentSection from "./SeoContentSection";
import SeoFaqSection from "./SeoFaqSection";
import SeoHero from "./SeoHero";
import SeoRelatedLinks from "./SeoRelatedLinks";
import type { SeoRelatedLink } from "./SeoRelatedLinks";

type Props = { iata: string };

export default function AirlineSeoView({ iata }: Props) {
  const code = iata.trim().toUpperCase();
  const meta = getAirlineSeoMeta(code);
  const name = meta?.name ?? `${code} airline`;
  const country = meta?.country ?? "its home market";
  const alliance = meta?.alliance;

  const routeSlugs = routesForAirline(code);
  const routeLinks: SeoRelatedLink[] =
    routeSlugs.length > 0
      ? routeSlugs.map((slug) => ({
          href: `/route/${slug}`,
          label: slug.replace("-", " → "),
          hint: "Duration & delay trends",
        }))
      : SEO_AIRLINE_IATA.slice(0, 6).map((other) => ({
          href: `/airline/${other}`,
          label: `Compare ${other}`,
          hint: "Other airline guides",
        }));

  const airportLinks: SeoRelatedLink[] = [
    { href: "/airport/IST", label: "Istanbul (IST)", hint: "Hub operations" },
    { href: "/airport/LHR", label: "London Heathrow", hint: "Major gateway" },
    { href: "/airport/JFK", label: "New York JFK", hint: "U.S. gateway" },
  ];

  const faqs: FaqItem[] = [
    {
      question: `Where can I check ${name} baggage rules?`,
      answer:
        "Always use the official airline baggage calculator for your ticket class and route. Limits change with fare family, frequent-flyer status, and interline partners.",
    },
    {
      question: `What cabin classes does ${code} typically offer?`,
      answer:
        "Most network carriers publish Economy, Premium Economy where available, Business, and First on long haul. Short-haul layouts vary by aircraft subtype — confirm on the seat map during booking.",
    },
    {
      question: "When should I check in online?",
      answer:
        "Online check-in often opens 24–48 hours before departure. For international flights, arrive at the airport with enough time for document checks even after mobile check-in.",
    },
  ];

  const crumbs = breadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: name, path: `/airline/${code}` },
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
          eyebrow="Airline guide · RouteWings"
          title={`${name} (${code})`}
          description={`Independent travel context for ${name} based in ${country}. Use RouteWings for airport boards and flight tracking — always confirm policies on the carrier’s official site.`}
        />

        <article className="mt-8 space-y-6 sm:space-y-8">
          {!meta ? (
            <p className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100/95">
              Extended editorial data for {code} is not in our catalog yet —
              sections below use generic aviation guidance.
            </p>
          ) : null}

          <SeoContentSection id="airline-overview" title="Airline overview">
            <p>
              {name} operates from {country} across short-, medium-, and
              long-haul markets. Fleet and network details evolve seasonally —
              treat this page as orientation, not a schedule source.
            </p>
            <p>
              Pair this guide with live airport boards on RouteWings to see
              real-time departures and arrivals at your origin hub.
            </p>
          </SeoContentSection>

          <SeoContentSection id="baggage" title="Baggage rules">
            <p>
              Carry-on and checked allowances depend on fare class, route, and
              loyalty tier. Watch for sports equipment, instruments, and battery
              rules — lithium cells belong in cabin per ICAO guidance.
            </p>
            <p>
              If you connect to a partner airline, the most restrictive baggage
              rule often applies across the entire journey.
            </p>
          </SeoContentSection>

          <SeoContentSection id="cabins" title="Cabin classes">
            <p>
              Economy delivers the core product; premium cabins add space,
              dining, and sleep comfort on long segments. Seat pitch, recline,
              and suite doors vary by aircraft tail — verify on the seat map.
            </p>
          </SeoContentSection>

          <SeoContentSection id="check-in" title="Check-in recommendations">
            <p>
              Complete online check-in early to secure preferred seats where
              policy allows. For document-heavy itineraries, keep PDFs offline
              and screenshot boarding passes in case the app logs out.
            </p>
            <p>
              Airport counters may still require visa and return-ticket checks —
              budget extra time on international departures.
            </p>
          </SeoContentSection>

          <SeoContentSection
            id="alliance"
            title="Alliance & partner information"
          >
            {alliance ? (
              <p>
                {name} participates in the {alliance} ecosystem where published.
                Benefits such as lounge access and mileage accrual depend on
                ticket stock and operating carrier — read the fare rules.
              </p>
            ) : (
              <p>
                {name} may codeshare or interline with other carriers without a
                single global alliance label. Check the operating carrier on
                your ticket for baggage and support policies.
              </p>
            )}
          </SeoContentSection>

          <SeoRelatedLinks title="Popular routes" links={routeLinks} />

          <SeoRelatedLinks
            title="Major airports"
            links={airportLinks}
            className="mt-6"
          />

          <SeoFaqSection items={faqs} />
        </article>
      </div>
    </div>
  );
}
