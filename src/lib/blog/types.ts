export const BLOG_CATEGORY_IDS = [
  "flight-tips",
  "airport-guides",
  "airline-reviews",
  "family-travel",
  "premium-travel",
  "flight-delay-advice",
] as const;

export type BlogCategoryId = (typeof BLOG_CATEGORY_IDS)[number];

export const BLOG_CATEGORY_LABELS: Record<BlogCategoryId, string> = {
  "flight-tips": "Flight Tips",
  "airport-guides": "Airport Guides",
  "airline-reviews": "Airline Reviews",
  "family-travel": "Family Travel",
  "premium-travel": "Premium Travel",
  "flight-delay-advice": "Flight Delay Advice",
};

export type BlogContentSection =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "list"; ordered?: boolean; items: string[] };

export type BlogAuthor = {
  name: string;
  role?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: BlogCategoryId;
  publishedAt: string;
  readTimeMinutes: number;
  /** Public path under /public — used for OG and article schema */
  heroImage: string;
  author: BlogAuthor;
  /** Shown as hero on /blog */
  featured?: boolean;
  relatedAirports?: string[];
  relatedRoutes?: string[];
  relatedAirlines?: string[];
  sections: BlogContentSection[];
};
