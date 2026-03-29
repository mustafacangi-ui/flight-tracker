import Link from "next/link";

import type { BlogPost } from "../../lib/blog/types";
import { BLOG_CATEGORY_LABELS } from "../../lib/blog/types";

type Props = { post: BlogPost; className?: string };

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function BlogCard({ post, className = "" }: Props) {
  return (
    <article
      className={`group flex h-full flex-col rounded-3xl border border-slate-800/90 bg-slate-900/40 p-5 shadow-[0_16px_48px_rgba(0,0,0,0.35)] ring-1 ring-blue-500/5 backdrop-blur-md transition hover:border-blue-500/30 hover:shadow-[0_0_40px_rgba(59,130,246,0.12)] sm:p-6 ${className}`.trim()}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060910]"
      >
        <span className="inline-flex w-fit rounded-full border border-blue-500/35 bg-blue-600/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-200/90">
          {BLOG_CATEGORY_LABELS[post.category]}
        </span>
        <h2 className="mt-3 text-lg font-bold leading-snug text-white group-hover:text-sky-100 sm:text-xl">
          {post.title}
        </h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
          {post.description}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-800/80 pt-4 text-xs text-slate-600">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span aria-hidden>·</span>
          <span>{post.readTimeMinutes} min read</span>
        </div>
      </Link>
    </article>
  );
}
