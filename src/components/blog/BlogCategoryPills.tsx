import Link from "next/link";

import {
  BLOG_CATEGORY_IDS,
  BLOG_CATEGORY_LABELS,
  type BlogCategoryId,
} from "../../lib/blog/types";

type Props = {
  activeCategory?: string | null;
  searchQuery?: string | null;
};

function buildHref(cat: BlogCategoryId | "all"): string {
  const params = new URLSearchParams();
  if (cat !== "all") params.set("category", cat);
  const s = params.toString();
  return s ? `/blog?${s}` : "/blog";
}

export default function BlogCategoryPills({
  activeCategory,
  searchQuery,
}: Props) {
  const q = searchQuery?.trim();
  const withQ = (href: string) => {
    if (!q) return href;
    const u = new URL(href, "https://example.com");
    u.searchParams.set("q", q);
    return `${u.pathname}${u.search}`;
  };

  const isAll =
    !activeCategory ||
    activeCategory === "all" ||
    !BLOG_CATEGORY_IDS.includes(activeCategory as BlogCategoryId);

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={withQ("/blog")}
        className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
          isAll
            ? "border-blue-500/50 bg-blue-600/20 text-white ring-1 ring-blue-500/30"
            : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
        }`}
      >
        All
      </Link>
      {BLOG_CATEGORY_IDS.map((id) => (
        <Link
          key={id}
          href={withQ(buildHref(id))}
          className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
            activeCategory === id
              ? "border-blue-500/50 bg-blue-600/20 text-white ring-1 ring-blue-500/30"
              : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          {BLOG_CATEGORY_LABELS[id]}
        </Link>
      ))}
    </div>
  );
}
