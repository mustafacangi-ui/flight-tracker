"use client";

import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020817] px-6 py-12 text-center text-white">
      <h1 className="text-xl font-semibold text-white">You&apos;re offline</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-400">
        Previously viewed flights and saved airports are still available.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-8 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        Retry Connection
      </button>
      <Link
        href="/"
        className="mt-4 text-sm text-gray-500 underline-offset-4 hover:text-gray-300 hover:underline"
      >
        Go to home
      </Link>
    </div>
  );
}
