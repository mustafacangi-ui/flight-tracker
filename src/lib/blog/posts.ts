import type { BlogPost } from "./types";

const HERO = "/images/blog/hero-placeholder.svg";

const editorial = {
  name: "RouteWings Editorial",
  role: "Aviation & travel desk",
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "best-time-arrive-istanbul-airport",
    title: "Best time to arrive at Istanbul Airport (IST)",
    description:
      "Practical arrival windows for Istanbul Airport: security, peak banks, and connections — without the stress.",
    category: "airport-guides",
    publishedAt: "2026-01-12T09:00:00.000Z",
    readTimeMinutes: 8,
    heroImage: HERO,
    author: editorial,
    featured: true,
    relatedAirports: ["IST", "SAW"],
    relatedRoutes: ["IST-JFK", "IST-LHR"],
    sections: [
      {
        type: "heading",
        level: 2,
        text: "Why timing at IST matters",
      },
      {
        type: "paragraph",
        text: "Istanbul Airport is a high-volume hub. Banks of departures cluster in the morning and late afternoon, which can stretch check-in queues and security lines even when flights are on time.",
      },
      {
        type: "heading",
        level: 2,
        text: "Suggested arrival windows",
      },
      {
        type: "list",
        ordered: false,
        items: [
          "Domestic Schengen-style departures: aim for 90–120 minutes before scheduled departure.",
          "International long-haul: plan 2.5–3 hours; add 30–45 minutes on peak holiday dates.",
          "U.S.-bound and other states with extra screening: treat 3 hours as a comfortable baseline.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Connections and second airports",
      },
      {
        type: "paragraph",
        text: "If you are connecting from Sabiha Gökçen (SAW) or transiting between carriers, pad time for baggage reclaim, landside transfer, and re-screening. RouteWings airport boards help you monitor live departures once you are airside.",
      },
    ],
  },
  {
    slug: "turkish-airlines-baggage-rules-explained",
    title: "Turkish Airlines baggage rules explained",
    description:
      "Carry-on, checked bags, and partner flights on TK — what to verify before you pack.",
    category: "airline-reviews",
    publishedAt: "2026-01-08T11:00:00.000Z",
    readTimeMinutes: 9,
    heroImage: HERO,
    author: editorial,
    relatedAirports: ["IST"],
    relatedAirlines: ["TK"],
    relatedRoutes: ["IST-JFK", "IST-LHR"],
    sections: [
      {
        type: "heading",
        level: 2,
        text: "Start with your ticket stock",
      },
      {
        type: "paragraph",
        text: "Baggage allowances on Turkish Airlines depend on route, cabin, fare family, and frequent-flyer status. Codeshare segments may follow the operating carrier’s rules for that leg.",
      },
      {
        type: "heading",
        level: 2,
        text: "Carry-on basics",
      },
      {
        type: "list",
        ordered: false,
        items: [
          "Confirm dimensions and weight on your e-ticket or in the TK app — limits differ by aircraft and fare.",
          "Personal item policies vary; keep meds, documents, and chargers in an easy-to-access bag.",
          "Gate checks happen when bins fill — have a plan for fragile items.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Checked bags and connections",
      },
      {
        type: "paragraph",
        text: "On itineraries with overnight layovers or self-transfers, the most restrictive rule across airlines often applies. Screenshot your allowance at booking time so you have a reference if airport agents see a different code.",
      },
    ],
  },
  {
    slug: "dusseldorf-airport-terminal-guide",
    title: "Düsseldorf Airport terminal guide",
    description:
      "Orientation for DUS: terminals, transfers, and what to expect before your flight.",
    category: "airport-guides",
    publishedAt: "2025-12-20T14:00:00.000Z",
    readTimeMinutes: 7,
    heroImage: HERO,
    author: editorial,
    relatedAirports: ["DUS"],
    sections: [
      {
        type: "heading",
        level: 2,
        text: "Terminal layout at a glance",
      },
      {
        type: "paragraph",
        text: "Düsseldorf Airport splits Schengen and non-Schengen flows across multiple piers. Signage is generally clear, but peak holiday periods add pressure at central security.",
      },
      {
        type: "heading",
        level: 2,
        text: "Before you arrive",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Check your airline app for terminal and check-in zone.",
          "If you connect from rail, allow walking time to departures plus security.",
          "Download boarding passes offline in case of spotty connectivity.",
        ],
      },
      {
        type: "paragraph",
        text: "Use RouteWings to track your flight number once you know the gate area — delays and gate changes surface on live boards when data is available.",
      },
    ],
  },
  {
    slug: "best-family-travel-apps-for-flights",
    title: "Best family travel apps for flights",
    description:
      "Keep kids, documents, and timing under control — a shortlist that pairs well with RouteWings.",
    category: "family-travel",
    publishedAt: "2026-02-01T10:00:00.000Z",
    readTimeMinutes: 6,
    heroImage: HERO,
    author: editorial,
    sections: [
      {
        type: "heading",
        level: 2,
        text: "Layer tools, don’t overload your phone",
      },
      {
        type: "paragraph",
        text: "Families need one source of truth for departure time and gate, plus offline entertainment and document copies. Pick a tracker, a documents wallet, and one offline games pack.",
      },
      {
        type: "heading",
        level: 2,
        text: "What to look for",
      },
      {
        type: "list",
        ordered: false,
        items: [
          "Live flight status aligned with your airline’s operating carrier.",
          "Airport maps with family restrooms and play areas where available.",
          "Offline video and coloring apps for taxi and hold patterns.",
        ],
      },
      {
        type: "paragraph",
        text: "RouteWings focuses on airport boards, saved flights, and optional Premium family links — pair it with your airline app for check-in and bag tags.",
      },
    ],
  },
  {
    slug: "how-to-track-flight-real-time",
    title: "How to track a flight in real time",
    description:
      "From flight number to gate changes — a simple workflow using RouteWings and airline tools.",
    category: "flight-tips",
    publishedAt: "2026-02-04T08:00:00.000Z",
    readTimeMinutes: 5,
    heroImage: HERO,
    author: editorial,
    relatedRoutes: ["IST-JFK", "LHR-JFK"],
    sections: [
      {
        type: "heading",
        level: 2,
        text: "Identify the operating flight",
      },
      {
        type: "paragraph",
        text: "Codeshares mean your ticket may show a marketing flight number while another carrier operates the metal. Use the operating flight number for the most accurate gate and delay data.",
      },
      {
        type: "heading",
        level: 2,
        text: "Track in RouteWings",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Search the airport board or open the flight detail from a saved card.",
          "Enable tracking for push-style reminders where supported.",
          "Use Live Track (Premium) when you need map-style context on supported routes.",
        ],
      },
    ],
  },
  {
    slug: "what-causes-flight-delays",
    title: "What causes flight delays",
    description:
      "Weather, ATC, crew duty, and hub ripple effects — plain-language explanations for travelers.",
    category: "flight-delay-advice",
    publishedAt: "2025-11-18T16:00:00.000Z",
    readTimeMinutes: 10,
    heroImage: HERO,
    author: editorial,
    sections: [
      {
        type: "heading",
        level: 2,
        text: "The usual suspects",
      },
      {
        type: "list",
        ordered: false,
        items: [
          "Weather: low ceilings, thunderstorms, and crosswinds reduce runway capacity.",
          "ATC flow programs: miles-in-trail restrictions stack delays across regions.",
          "Crew duty limits: a late inbound crew can legally delay your outbound.",
          "Hub knock-on: one late bank cascades into missed connections fleet-wide.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "What you can do",
      },
      {
        type: "paragraph",
        text: "Monitor your first flight of the day if you have a tight connection. Build 90+ minute domestic-to-international connections at busy hubs when fares allow.",
      },
    ],
  },
  {
    slug: "best-airports-layovers-europe",
    title: "Best airports for layovers in Europe",
    description:
      "Comfort, connection minimums, and sleep-friendly zones — a pragmatic shortlist.",
    category: "flight-tips",
    publishedAt: "2025-12-02T12:00:00.000Z",
    readTimeMinutes: 8,
    heroImage: HERO,
    author: editorial,
    relatedAirports: ["AMS", "ZRH", "MUC", "FRA"],
    relatedRoutes: ["FRA-IST", "AMS-JFK"],
    sections: [
      {
        type: "heading",
        level: 2,
        text: "What makes a layover airport “good”",
      },
      {
        type: "paragraph",
        text: "Clear signage, reasonable minimum connection times for your ticket type, and airside food or quiet corners matter more than Instagrammable architecture when you are tired.",
      },
      {
        type: "heading",
        level: 2,
        text: "Hubs travelers often like",
      },
      {
        type: "list",
        ordered: false,
        items: [
          "Amsterdam Schiphol: compact rail access and dense Schengen connections.",
          "Zurich: predictable transfers for Star Alliance-heavy itineraries.",
          "Frankfurt & Munich: high capacity but weather and de-icing can bite in winter.",
        ],
      },
    ],
  },
  {
    slug: "how-early-international-flight",
    title: "How early should you arrive for an international flight?",
    description:
      "A practical framework: document checks, security variance, and airline cutoffs.",
    category: "flight-tips",
    publishedAt: "2026-01-22T09:30:00.000Z",
    readTimeMinutes: 6,
    heroImage: HERO,
    author: editorial,
    sections: [
      {
        type: "heading",
        level: 2,
        text: "The 3-hour rule is a starting point",
      },
      {
        type: "paragraph",
        text: "Many carriers suggest arriving three hours before long-haul international departures. That accounts for document checks, security peaks, and occasional tech hiccups at kiosks.",
      },
      {
        type: "heading",
        level: 2,
        text: "When to add buffer",
      },
      {
        type: "list",
        ordered: false,
        items: [
          "Traveling with young children or oversized sports equipment.",
          "Flying during local holidays or major events near the airport.",
          "First time at a mega-hub (DXB, IST, LHR) — orientation takes longer.",
        ],
      },
    ],
  },
  {
    slug: "lufthansa-vs-turkish-airlines",
    title: "Lufthansa vs Turkish Airlines: what frequent flyers compare",
    description:
      "Hub strategy, networks, and product philosophy — not a ranking, a decision lens.",
    category: "airline-reviews",
    publishedAt: "2025-10-30T13:00:00.000Z",
    readTimeMinutes: 11,
    heroImage: HERO,
    author: editorial,
    relatedAirlines: ["LH", "TK"],
    relatedAirports: ["FRA", "IST", "MUC"],
    relatedRoutes: ["FRA-IST", "IST-LHR"],
    sections: [
      {
        type: "heading",
        level: 2,
        text: "Network shape",
      },
      {
        type: "paragraph",
        text: "Turkish Airlines leans on Istanbul as a single global super-hub with aggressive sixth-freedom flows. Lufthansa spreads connections across Frankfurt and Munich with strong intra-Europe feed.",
      },
      {
        type: "heading",
        level: 2,
        text: "Product and loyalty",
      },
      {
        type: "paragraph",
        text: "Seat maps, catering, and lounge access depend on aircraft subtype and fare class. Compare alliance benefits (Star Alliance for both) and your home airport’s nonstop options before chasing status.",
      },
    ],
  },
  {
    slug: "avoid-missing-flight-tips",
    title: "Best ways to avoid missing a flight",
    description:
      "Checklists for tight mornings, unfamiliar airports, and connection risk.",
    category: "flight-tips",
    publishedAt: "2026-02-10T07:00:00.000Z",
    readTimeMinutes: 5,
    heroImage: HERO,
    author: editorial,
    sections: [
      {
        type: "heading",
        level: 2,
        text: "The night before",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Check in online and save boarding passes offline.",
          "Set two alarms and confirm airport transfer bookings.",
          "Pack IDs in one pouch — no last-minute bag dig.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "At the airport",
      },
      {
        type: "paragraph",
        text: "Head straight to security after bag drop; shops can wait. If your gate is far, note walk time on airport maps and watch the board for gate changes in RouteWings.",
      },
    ],
  },
  {
    slug: "routewings-premium-family-tracking",
    title: "Why Premium family links matter for peace of mind",
    description:
      "Share live-style updates with family without handing over logins — how RouteWings Premium fits in.",
    category: "premium-travel",
    publishedAt: "2026-02-14T12:00:00.000Z",
    readTimeMinutes: 4,
    heroImage: HERO,
    author: editorial,
    relatedRoutes: ["IST-JFK", "IST-DXB"],
    sections: [
      {
        type: "heading",
        level: 2,
        text: "Private links, not screenshots",
      },
      {
        type: "paragraph",
        text: "Premium family tracking links let loved ones follow along from a simple URL — useful when time zones misalign or group chats get noisy.",
      },
      {
        type: "heading",
        level: 2,
        text: "Pair with saved flights",
      },
      {
        type: "paragraph",
        text: "Save the flight on your account, enable tracking where available, and combine with airport boards for departure gate reality. Always confirm critical times with the airline.",
      },
    ],
  },
];

export function getAllPostsSorted(): BlogPost[] {
  return [...BLOG_POSTS].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getFeaturedPost(): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.featured) ?? getAllPostsSorted()[0];
}

export function filterPosts(args: {
  category?: string | null;
  q?: string | null;
}): BlogPost[] {
  let list = getAllPostsSorted();
  const cat = args.category?.trim().toLowerCase();
  if (cat && cat !== "all") {
    list = list.filter((p) => p.category === cat);
  }
  const q = args.q?.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }
  return list;
}

export function getRelatedPostsForAirport(code: string, limit = 3): BlogPost[] {
  const c = code.toUpperCase();
  return getAllPostsSorted().filter((p) => p.relatedAirports?.includes(c)).slice(0, limit);
}

export function getRelatedPostsForAirline(iata: string, limit = 3): BlogPost[] {
  const x = iata.toUpperCase();
  return getAllPostsSorted()
    .filter((p) => p.relatedAirlines?.includes(x))
    .slice(0, limit);
}

export function getRelatedPostsForRoute(
  origin: string,
  dest: string,
  limit = 3
): BlogPost[] {
  const slug = `${origin.toUpperCase()}-${dest.toUpperCase()}`;
  return getAllPostsSorted()
    .filter((p) => p.relatedRoutes?.includes(slug))
    .slice(0, limit);
}

export function getAllSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}
