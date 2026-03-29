import type { MetadataRoute } from "next";

import { getSiteOrigin } from "../lib/seo/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin().replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/debug", "/auth/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
