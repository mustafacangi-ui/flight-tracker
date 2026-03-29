import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import BlogPostBody from "../../../components/blog/BlogPostBody";
import BlogCard from "../../../components/blog/BlogCard";
import JsonLd from "../../../components/seo/JsonLd";
import { BLOG_CATEGORY_LABELS } from "../../../lib/blog/types";
import {
  getAllPostsSorted,
  getAllSlugs,
  getPostBySlug,
} from "../../../lib/blog/posts";
import { articleSchema, breadcrumbListSchema } from "../../../lib/seo/schemas";
import { absoluteUrl } from "../../../lib/seo/siteUrl";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams(): { slug: string }[] {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return { title: "Article" };
  }
  const url = absoluteUrl(`/blog/${post.slug}`);
  const ogImage = absoluteUrl(post.heroImage);
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

function formatDateLong(iso: string): string {
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

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const crumbs = breadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  const articleLd = articleSchema({
    headline: post.title,
    description: post.description,
    pagePath: `/blog/${post.slug}`,
    datePublished: post.publishedAt,
    imagePath: post.heroImage,
    authorName: post.author.name,
  });

  const related = getAllPostsSorted()
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#060910] text-white">
      <JsonLd data={[crumbs, articleLd]} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(37,99,235,0.14),transparent)]" />
      <article className="relative mx-auto max-w-2xl px-4 pb-20 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:max-w-3xl">
        <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/blog" className="transition hover:text-white">
                Blog
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-slate-400 line-clamp-1">{post.title}</li>
          </ol>
        </nav>

        <header className="mt-8">
          <Link
            href={`/blog?category=${post.category}`}
            className="inline-flex rounded-full border border-blue-500/35 bg-blue-600/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-200/90 transition hover:border-blue-400/50"
          >
            {BLOG_CATEGORY_LABELS[post.category]}
          </Link>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-[2.35rem]">
            {post.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
            {post.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <time dateTime={post.publishedAt}>{formatDateLong(post.publishedAt)}</time>
            <span aria-hidden>·</span>
            <span>{post.readTimeMinutes} min read</span>
            <span aria-hidden>·</span>
            <span>{post.author.name}</span>
            {post.author.role ? (
              <>
                <span aria-hidden>·</span>
                <span className="text-slate-500">{post.author.role}</span>
              </>
            ) : null}
          </div>
        </header>

        <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.4)] ring-1 ring-blue-500/10">
          <Image
            src={post.heroImage}
            alt=""
            fill
            unoptimized
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 42rem"
            priority
          />
        </div>

        <div className="mt-10 border-t border-slate-800/80 pt-10">
          <BlogPostBody sections={post.sections} />
        </div>

        {related.length > 0 ? (
          <section className="mt-16 border-t border-slate-800/80 pt-12" aria-labelledby="more-heading">
            <h2 id="more-heading" className="text-xl font-bold text-white">
              More in {BLOG_CATEGORY_LABELS[post.category]}
            </h2>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2">
              {related.map((p) => (
                <li key={p.slug}>
                  <BlogCard post={p} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="inline-flex rounded-2xl border border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-blue-500/40 hover:text-white"
          >
            ← All articles
          </Link>
        </div>
      </article>
    </div>
  );
}
