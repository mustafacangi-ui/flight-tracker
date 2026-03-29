"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  initialQuery?: string;
};

export default function BlogSearchForm({ initialQuery = "" }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(initialQuery);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    const q = value.trim();
    if (q) next.set("q", q);
    else next.delete("q");
    const s = next.toString();
    router.push(s ? `/blog?${s}` : "/blog");
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor="blog-search" className="sr-only">
        Search articles by title
      </label>
      <input
        id="blog-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by title…"
        className="w-full rounded-2xl border border-slate-800/90 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-600 ring-1 ring-blue-500/5 backdrop-blur-md focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        autoComplete="off"
      />
      <button
        type="submit"
        className="shrink-0 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-3 text-sm font-bold text-white shadow-[0_8px_28px_rgba(37,99,235,0.35)] transition hover:brightness-110"
      >
        Search
      </button>
    </form>
  );
}
