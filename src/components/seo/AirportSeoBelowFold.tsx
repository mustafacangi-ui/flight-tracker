import {
  getAirportSeoMeta,
  routesTouchingAirport,
} from "../../lib/seo/catalog";
import { breadcrumbListSchema, type FaqItem } from "../../lib/seo/schemas";
import JsonLd from "./JsonLd";
import SeoContentSection from "./SeoContentSection";
import SeoFaqSection from "./SeoFaqSection";
import SeoRelatedLinks from "./SeoRelatedLinks";
import type { SeoRelatedLink } from "./SeoRelatedLinks";

type Props = { airportCode: string };

export default function AirportSeoBelowFold({ airportCode }: Props) {
  const code = airportCode.trim().toUpperCase();
  const meta = getAirportSeoMeta(code);
  const name = meta?.name ?? `${code} Airport`;
  const city = meta?.city ?? "this city";
  const country = meta?.country ?? "the region";

  const routeSlugs = routesTouchingAirport(code);
  const routeLinks: SeoRelatedLink[] = routeSlugs.map((slug) => ({
    href: `/route/${slug}`,
    label: `${slug.replace("-", " → ")}`,
    hint: "Route guide & travel context",
  }));

  const airlineLinks: SeoRelatedLink[] = ["TK", "BA", "LH", "EK", "QR"].map(
    (iata) => ({
      href: `/airline/${iata}`,
      label: `${iata} airline guide`,
      hint: "Baggage, cabins, check-in tips",
    })
  );

  const faqs: FaqItem[] = [
    {
      question: `How do I see live departures and arrivals for ${code}?`,
      answer:
        "Use the RouteWings board above for the current snapshot. Times and statuses come from our data provider and should always be double-checked with your airline.",
    },
    {
      question: `What is the best time to arrive at ${name}?`,
      answer:
        "For most international departures, arriving two to three hours before scheduled departure is a sensible default. During peak holiday periods, add extra buffer and monitor security announcements at the airport.",
    },
    {
      question: "Are security wait times shown here accurate?",
      answer:
        "Security wait times on this page are illustrative placeholders only. Always follow airport signage and official apps for real queue estimates.",
    },
    {
      question: `Does RouteWings cover ${city}, ${country}?`,
      answer:
        "Yes — you can bookmark this airport, explore related routes below, and pair it with our flight tracker for gate changes and delay context when available.",
    },
  ];

  const crumbs = breadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: `${name}`, path: `/airport/${code}` },
  ]);

  return (
    <div className="border-t border-slate-800/80 bg-[#060910]">
      <div className="relative mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 lg:max-w-4xl">
        <JsonLd data={crumbs} />

        <article className="space-y-6 sm:space-y-8">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.35em] text-slate-600">
            Travel guide · SEO
          </p>

          <SeoContentSection id="airport-overview" title="Airport overview">
            <p>
              {name} ({code}) serves {city} in {country}. Whether you are
              connecting or starting a long-haul journey, use the live board
              above for flights, then scan this guide for orientation, typical
              peak periods, and onward planning.
            </p>
            {!meta ? (
              <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-amber-100/90">
                We don&apos;t have extended editorial data for this code yet —
                generic guidance still applies; confirm details with the
                airport operator.
              </p>
            ) : null}
          </SeoContentSection>

          <SeoContentSection id="terminals" title="Terminals & wayfinding">
            <p>
              Large hubs often split international, domestic, and low-cost
              operations across terminals. Check your boarding pass for the
              terminal letter or number, then allow time for intra-terminal
              transfers and re-screening if you change buildings.
            </p>
            <p>
              The interactive Terminals tab above summarizes a stylized layout;
              always follow on-site signage and airline apps for gate changes.
            </p>
          </SeoContentSection>

          <SeoContentSection
            id="transportation"
            title="Transportation to and from the airport"
          >
            <p>
              Most major airports connect to the city via rail, metro, bus,
              rideshare, and taxi. Pre-book transfers during peak events, and
              verify night-service schedules if you land late.
            </p>
            <p>
              If you are self-driving, review parking zones and height limits
              for rental vans. For {city}, compare public transit against road
              traffic before you depart.
            </p>
          </SeoContentSection>

          <SeoContentSection
            id="best-arrival"
            title="Best arrival time at the airport"
          >
            <p>
              Short-haul travelers often aim for ninety minutes to two hours
              before departure; long-haul and U.S.-bound itineraries frequently
              need a longer cushion for document checks and security.
            </p>
            <p>
              Peak bank times (early morning and late afternoon waves) add
              pressure on check-in desks and security — plan accordingly.
            </p>
          </SeoContentSection>

          <SeoContentSection
            id="security-waits"
            title="Security wait times (placeholder)"
          >
            <p>
              RouteWings does not publish live security wait times for {code}{" "}
              in this release. This section reserves space for future integration
              with official airport APIs or trusted crowd data.
            </p>
            <p>
              Until then, assume variable queues at peak hours and listen for
              airport PA announcements about expedited lanes.
            </p>
          </SeoContentSection>

          <SeoContentSection id="lounges" title="Lounges & quiet areas">
            <p>
              Alliance lounges, pay-in lounges, and airline-specific clubs
              differ by terminal. Eligibility usually depends on ticket class,
              frequent-flyer status, or a day pass — confirm on the carrier
              website.
            </p>
            <p>
              The Lounges tab above lists representative examples for planning;
              hours and locations change seasonally.
            </p>
          </SeoContentSection>

          <SeoContentSection id="weather-snapshot" title="Weather snapshot">
            <p>
              The hero cards above show an illustrative weather-style snapshot
              tied to operational storytelling — not a replacement for aviation
              METAR/TAF or your pre-flight briefing.
            </p>
            <p>
              Cross-check TAF trends if {city} is prone to fog, thunderstorms,
              or crosswind patterns that affect runway configuration.
            </p>
          </SeoContentSection>

          <SeoContentSection id="popular-routes" title="Popular routes">
            <p>
              Below are curated city pairs that connect through or from{" "}
              {code}. Open a route page for generic duration context, airline
              ideas, and delay trends — always verify schedules with carriers.
            </p>
          </SeoContentSection>

          <SeoRelatedLinks title="Routes from this airport" links={routeLinks} />

          <SeoRelatedLinks
            title="Airline guides"
            links={airlineLinks}
            className="mt-6"
          />

          <SeoFaqSection items={faqs} />
        </article>
      </div>
    </div>
  );
}
