import type { MetadataRoute } from "next";

import { getAllSlugs } from "../lib/blog/posts";
import {
  SEO_AIRLINE_IATA,
  SEO_AIRPORT_CODES,
  SEO_ROUTE_SLUGS,
} from "../lib/seo/catalog";
import { getSiteOrigin } from "../lib/seo/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteOrigin().replace(/\/$/, "");
  const now = new Date();

  const staticPaths = ["", "/premium", "/privacy", "/terms"];

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency:
      path === "" ? "daily" : path === "/blog" ? "daily" : "weekly",
    priority:
      path === "" ? 1 : path === "/blog" ? 0.92 : 0.85,
  }));

  for (const slug of getAllSlugs()) {
    entries.push({
      url: `${base}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    });
  }

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
