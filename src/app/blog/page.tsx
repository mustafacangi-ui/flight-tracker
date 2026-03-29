import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import BlogCard from "../../components/blog/BlogCard";
import BlogCategoryPills from "../../components/blog/BlogCategoryPills";
import BlogFeaturedHero from "../../components/blog/BlogFeaturedHero";
import BlogSearchForm from "../../components/blog/BlogSearchForm";
import SeoRelatedLinks from "../../components/seo/SeoRelatedLinks";
import type { SeoRelatedLink } from "../../components/seo/SeoRelatedLinks";
import {
  BLOG_CATEGORY_IDS,
  type BlogCategoryId,
} from "../../lib/blog/types";
import {
  filterPosts,
  getFeaturedPost,
} from "../../lib/blog/posts";
import { absoluteUrl } from "../../lib/seo/siteUrl";

const desc =
  "Flight tips, airport guides, airline reviews, family travel, and delay advice from RouteWings / FiyatRotasi.";

export const metadata: Metadata = {
  title: "Travel guides & flight tips",
  description: desc,
  alternates: {
    canonical: absoluteUrl("/blog"),
  },
  openGraph: {
    title: "RouteWings blog — travel guides & flight tips",
    description: desc,
    type: "website",
    url: absoluteUrl("/blog"),
    images: [{ url: absoluteUrl("/images/blog/hero-placeholder.svg"), width: 1200, height: 630, alt: "RouteWings" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RouteWings blog — travel guides & flight tips",
    description: desc,
    images: [absoluteUrl("/images/blog/hero-placeholder.svg")],
  },
};

function isCategoryId(x: string | undefined): x is BlogCategoryId {
  return Boolean(x && BLOG_CATEGORY_IDS.includes(x as BlogCategoryId));
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const category = isCategoryId(sp.category) ? sp.category : undefined;
  const q = sp.q?.trim() || undefined;
  const hasFilters = Boolean(category || q);
  const featured = getFeaturedPost();
  const filtered = filterPosts({ category, q });

  let gridPosts = filtered;
  if (!hasFilters && featured) {
    gridPosts = filtered.filter((p) => p.slug !== featured.slug);
  }

  const hubLinks: SeoRelatedLink[] = [
    { href: "/airport/IST", label: "Istanbul (IST)", hint: "Airport board" },
    { href: "/airport/JFK", label: "New York JFK", hint: "Airport board" },
    { href: "/route/IST-JFK", label: "IST → JFK", hint: "Route guide" },
    { href: "/airline/TK", label: "Turkish Airlines", hint: "Airline guide" },
    { href: "/premium", label: "RouteWings Premium", hint: "Family links & more" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#060910] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(37,99,235,0.14),transparent)]" />
      <div className="relative mx-auto max-w-2xl px-4 pb-20 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:max-w-5xl">
        <Link
          href="/"
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Home
        </Link>

        <header className="mt-8 text-center sm:mt-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-blue-400/90">
            RouteWings / FiyatRotasi
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Travel guides & flight tips
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            {desc}
          </p>
        </header>

        <div className="mt-8">
          <Suspense
            fallback={
              <div className="h-12 animate-pulse rounded-2xl bg-slate-900/60" />
            }
          >
            <BlogSearchForm key={q ?? ""} initialQuery={q ?? ""} />
          </Suspense>
        </div>

        <div className="mt-6">
          <BlogCategoryPills activeCategory={category} searchQuery={q} />
        </div>

        {!hasFilters && featured ? (
          <div className="mt-10">
            <BlogFeaturedHero post={featured} />
          </div>
        ) : null}

        <section className="mt-12" aria-labelledby="latest-heading">
          <h2
            id="latest-heading"
            className="text-lg font-bold text-white sm:text-xl"
          >
            {hasFilters ? "Matching articles" : "Latest articles"}
          </h2>
          {gridPosts.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-500">
              No articles match your filters. Try another category or search
              term.
            </p>
          ) : (
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((post) => (
                <li key={post.slug} className="min-h-0">
                  <BlogCard post={post} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-14">
          <SeoRelatedLinks
            title="Explore airports, routes & airlines"
            links={hubLinks}
          />
        </div>
      </div>
    </div>
  );
}
