"use client";

import Link from "next/link";

const linkClass =
  "text-xs text-slate-500 transition hover:text-slate-300 underline-offset-2 hover:underline";

export default function SiteFooter() {
  return (
    <footer
      className="mt-auto border-t border-white/10 bg-gray-950/80 px-4 py-6 backdrop-blur-md md:py-8"
      role="contentinfo"
    >
      <nav
        className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 md:gap-x-8"
        aria-label="Footer"
      >
        <Link href="/privacy" className={linkClass}>
          Privacy Policy
        </Link>
        <Link href="/terms" className={linkClass}>
          Terms of Service
        </Link>
        <Link href="/blog" className={linkClass}>
          Blog
        </Link>
        <Link href="/premium" className={linkClass}>
          Premium
        </Link>
      </nav>
      <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-relaxed text-slate-600">
        RouteWings / FiyatRotasi — flight status is provided for information
        only; always confirm with your airline.
      </p>
    </footer>
  );
}
