"use client";

import Link from "next/link";
import { motion } from "framer-motion";

function PlaneHero({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      aria-hidden
    >
      <svg
        viewBox="0 0 200 120"
        className="mx-auto h-28 w-44 text-sky-400 sm:h-36 sm:w-56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="100"
          cy="96"
          rx="72"
          ry="8"
          className="fill-blue-950/80"
          opacity={0.9}
        />
        <path
          d="M12 62h32l52-40h28l-18 40h36l14-22h24l-8 28 8 28h-24l-14-22H98l18 40H88L44 62H12V46z"
          fill="url(#off-plane)"
          className="drop-shadow-[0_0_24px_rgba(56,189,248,0.35)]"
        />
        <defs>
          <linearGradient id="off-plane" x1="12" y1="22" x2="188" y2="86">
            <stop stopColor="#7dd3fc" />
            <stop offset="0.5" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

export default function OfflinePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030712] px-6 py-14 text-center text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(37,99,235,0.35), transparent), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(14,165,233,0.12), transparent)",
        }}
      />
      <div className="relative max-w-md">
        <PlaneHero />
        <motion.h1
          className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          You are offline
        </motion.h1>
        <motion.p
          className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
        >
          Saved flights and data stored on this device are still available when
          you open{" "}
          <span className="font-medium text-slate-300">Saved flights</span>.{" "}
          Reconnect to refresh live boards and flight details.
        </motion.p>
        <motion.div
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
        >
          <Link
            href="/"
            className="inline-flex justify-center rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-[0_12px_40px_rgba(37,99,235,0.35)] transition hover:brightness-110"
          >
            Back to homepage
          </Link>
          <Link
            href="/saved"
            className="inline-flex justify-center rounded-2xl border border-blue-500/35 bg-white/[0.05] px-8 py-3.5 text-sm font-semibold text-sky-100 transition hover:border-blue-400/50 hover:bg-white/[0.08]"
          >
            Open saved flights
          </Link>
        </motion.div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 text-sm text-slate-500 underline-offset-4 transition hover:text-slate-300 hover:underline"
        >
          Retry connection
        </button>
      </div>
    </div>
  );
}
