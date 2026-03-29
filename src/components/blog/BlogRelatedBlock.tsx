import Link from "next/link";

import type { BlogPost } from "../../lib/blog/types";
import { BLOG_CATEGORY_LABELS } from "../../lib/blog/types";

type Props = {
  title?: string;
  posts: BlogPost[];
  className?: string;
};

export default function BlogRelatedBlock({
  title = "From the RouteWings blog",
  posts,
  className = "",
}: Props) {
  if (posts.length === 0) return null;
  return (
    <section
      className={`rounded-3xl border border-slate-800/90 bg-slate-900/35 p-5 ring-1 ring-sky-500/10 backdrop-blur-md sm:p-6 ${className}`.trim()}
      aria-labelledby="blog-related-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="blog-related-heading"
          className="text-lg font-bold text-white sm:text-xl"
        >
          {title}
        </h2>
        <Link
          href="/blog"
          className="text-xs font-semibold text-sky-400/90 transition hover:text-sky-300"
        >
          View all guides →
        </Link>
      </div>
      <ul className="mt-4 space-y-3">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="block rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 transition hover:border-blue-500/35 hover:shadow-[0_0_24px_rgba(59,130,246,0.1)]"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400/85">
                {BLOG_CATEGORY_LABELS[p.category]}
              </span>
              <p className="mt-1 font-semibold text-white">{p.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {p.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
