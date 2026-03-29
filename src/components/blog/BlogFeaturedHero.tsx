import Image from "next/image";
import Link from "next/link";

import type { BlogPost } from "../../lib/blog/types";
import { BLOG_CATEGORY_LABELS } from "../../lib/blog/types";

type Props = { post: BlogPost };

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function BlogFeaturedHero({ post }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-gradient-to-br from-slate-900/95 via-slate-950 to-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ring-1 ring-blue-500/15 backdrop-blur-md">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-600/18 blur-3xl"
        aria-hidden
      />
      <div className="grid gap-6 p-6 sm:grid-cols-[1.1fr_minmax(0,0.9fr)] sm:items-center sm:gap-8 sm:p-8">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950 sm:aspect-auto sm:min-h-[220px]">
          <Image
            src={post.heroImage}
            alt=""
            fill
            unoptimized
            className="object-cover object-center opacity-95"
            sizes="(max-width: 640px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent sm:bg-gradient-to-r" />
        </div>
        <div className="relative flex flex-col justify-center">
          <span className="inline-flex w-fit rounded-full border border-blue-500/35 bg-blue-600/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-200/90">
            Featured · {BLOG_CATEGORY_LABELS[post.category]}
          </span>
          <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            <Link
              href={`/blog/${post.slug}`}
              className="transition hover:text-sky-100"
            >
              {post.title}
            </Link>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
            {post.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span aria-hidden>·</span>
            <span>{post.readTimeMinutes} min read</span>
            <span aria-hidden>·</span>
            <span>{post.author.name}</span>
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="mt-6 inline-flex w-fit items-center rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_32px_rgba(37,99,235,0.35)] transition hover:brightness-110"
          >
            Read article
          </Link>
        </div>
      </div>
    </div>
  );
}
