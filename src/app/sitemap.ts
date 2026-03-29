import type { MetadataRoute } from "next";

import {
  SEO_AIRLINE_IATA,
  SEO_AIRPORT_CODES,
  SEO_ROUTE_SLUGS,
} from "../lib/seo/catalog";
import { getSiteOrigin } from "../lib/seo/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteOrigin().replace(/\/$/, "");
  const now = new Date();

  const staticPaths = ["", "/premium"];

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.85,
  }));

  for (const code of SEO_AIRPORT_CODES) {
    entries.push({
      url: `${base}/airport/${code}`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    });
  }

  for (const iata of SEO_AIRLINE_IATA) {
    entries.push({
      url: `${base}/airline/${iata}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    });
  }

  for (const pair of SEO_ROUTE_SLUGS) {
    entries.push({
      url: `${base}/route/${pair}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
