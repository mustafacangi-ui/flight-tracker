"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import HomeTopAuthBar from "../../components/home/HomeTopAuthBar";
import { useUpgradeModal } from "../../components/UpgradeModalProvider";
import { usePremiumFlag } from "../../hooks/usePremiumFlag";
import { useTrackPageView } from "../../hooks/useTrackPageView";
import { PREMIUM_MODAL_FEATURES } from "../../lib/premiumTier";

const ROWS: { feature: string; free: string; premium: string }[] = [
  {
    feature: "Saved flights",
    free: "Up to 3",
    premium: "Unlimited",
  },
  {
    feature: "Push-tracked flights",
    free: "Up to 3",
    premium: "Unlimited",
  },
  {
    feature: "Private family tracking links",
    free: "—",
    premium: "Included",
  },
  {
    feature: "Live flight map (detail)",
    free: "—",
    premium: "Included",
  },
  {
    feature: "Live Track (boards)",
    free: "—",
    premium: "Included",
  },
  {
    feature: "Gate & terminal updates",
    free: "Board view",
    premium: "Full alerts",
  },
  {
    feature: "Flight / tail history",
    free: "Limited",
    premium: "Deep intelligence",
  },
  {
    feature: "Airport operational alerts",
    free: "—",
    premium: "Included",
  },
];

const FAQ = [
  {
    q: "How does billing work?",
    a: "Subscribe with Stripe Checkout (when configured). You’ll return to our success page; Premium unlocks after your subscription row syncs from Stripe (usually within a few seconds).",
  },
  {
    q: "Can my family see flights without Premium?",
    a: "Anyone can open a public share page. Private, token-based family tracking links that don’t require sign-in for viewers are a Premium feature.",
  },
  {
    q: "What happens to my saved flights if I downgrade?",
    a: "Existing rows stay on your device; you won’t be able to add new ones beyond the free limit until you remove some or upgrade again.",
  },
];

function CheckCell({ ok }: { ok: boolean }) {
  return (
    <span className={ok ? "text-emerald-300/95" : "text-slate-600"}>
      {ok ? "✓" : "—"}
    </span>
  );
}

export default function PremiumPage() {
  useTrackPageView("premium");
  const { openUpgrade } = useUpgradeModal();
  const premium = usePremiumFlag();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#04060d] text-white">
      <HomeTopAuthBar />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.55]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 50% at 50% -15%, rgba(37,99,235,0.35), transparent), radial-gradient(ellipse 50% 40% at 100% 80%, rgba(14,165,233,0.12), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 py-10 pb-24 sm:px-6 sm:py-14">
        <Link
          href="/"
          className="text-sm text-slate-500 transition hover:text-slate-300"
        >
          ← Back to tracker
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-blue-400/90">
            RouteWings / FiyatRotasi
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
              Fly with Premium
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Everything serious travelers need — alerts, family peace of mind,
            and a cockpit-grade map — in one subscription.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {premium ? (
              <div className="w-full max-w-md rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-6 py-4 text-center text-sm font-medium text-emerald-100/95 ring-1 ring-emerald-500/15">
                You already have Premium — open the tracker or saved flights to
                use every feature.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openUpgrade()}
                className="w-full max-w-xs rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-[0_12px_40px_rgba(37,99,235,0.45)] transition hover:brightness-110 sm:w-auto sm:px-10"
              >
                Unlock Premium
              </button>
            )}
            <Link
              href="/saved"
              className="w-full max-w-xs rounded-2xl border border-white/15 bg-white/[0.05] py-3.5 text-center text-sm font-semibold text-slate-200 transition hover:border-blue-400/35 sm:w-auto sm:px-8"
            >
              View saved flights
            </Link>
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="mt-14 rounded-[1.75rem] border border-blue-500/25 bg-slate-950/60 p-1 shadow-[0_0_48px_rgba(37,99,235,0.12)] ring-1 ring-blue-500/10 backdrop-blur-xl"
        >
          <div className="overflow-x-auto rounded-[1.6rem]">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-4 font-semibold text-slate-300 sm:px-6">
                    Feature
                  </th>
                  <th className="px-4 py-4 font-semibold text-slate-400 sm:px-6">
                    Free
                  </th>
                  <th className="px-4 py-4 font-semibold text-sky-200 sm:px-6">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-white/[0.06] last:border-0"
                  >
                    <td className="px-4 py-3.5 text-slate-200 sm:px-6">
                      {row.feature}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 sm:px-6">
                      {row.free}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-sky-100/95 sm:px-6">
                      <span className="inline-flex items-center gap-2">
                        <CheckCell ok={row.premium !== "—"} />
                        {row.premium}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-md sm:p-8"
        >
          <h2 className="text-lg font-bold text-white">Premium includes</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {PREMIUM_MODAL_FEATURES.map((f) => (
              <li
                key={f}
                className="flex gap-2 text-sm text-slate-300"
              >
                <span className="text-sky-400/90" aria-hidden>
                  ✦
                </span>
                {f}
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="mt-12"
        >
          <h2 className="text-center text-lg font-bold text-white">FAQ</h2>
          <div className="mt-6 space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-white/10 bg-slate-950/50 px-5 py-4 backdrop-blur-md open:border-blue-500/25 open:ring-1 open:ring-blue-500/10"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100 transition group-open:text-sky-100">
                  <span className="flex items-center justify-between gap-2">
                    {item.q}
                    <span className="text-slate-500 group-open:rotate-180">
                      ▼
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mt-14 flex flex-col items-center gap-3 rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-600/15 via-slate-950/80 to-indigo-950/80 p-8 text-center shadow-[0_0_40px_rgba(37,99,235,0.2)]"
        >
          <p className="text-sm font-medium text-slate-300">
            {premium
              ? "You’re all set with Premium."
              : "Ready for the full RouteWings experience?"}
          </p>
          <button
            type="button"
            disabled={premium}
            onClick={() => openUpgrade()}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {premium ? "You already have Premium" : "See plans & unlock"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
