"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import ReleaseInfoCard, {
  type ReleaseInfoData,
} from "../../../components/debug/ReleaseInfoCard";

export type QaBadge = "pass" | "needs_review" | "not_configured";

type ServerMeta = Omit<ReleaseInfoData, "rapidApiConfigured">;

type DebugStatus = {
  rapidApiKeyConfigured?: boolean;
  nextPublicSiteUrlConfigured?: boolean;
} | null;

function Badge({ status }: { status: QaBadge }) {
  const styles: Record<QaBadge, string> = {
    pass: "border-emerald-500/45 bg-emerald-500/15 text-emerald-200",
    needs_review:
      "border-amber-500/45 bg-amber-500/15 text-amber-100",
    not_configured: "border-slate-600 bg-slate-800/80 text-slate-400",
  };
  const labels: Record<QaBadge, string> = {
    pass: "Pass",
    needs_review: "Needs Review",
    not_configured: "Not Configured",
  };
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function SmokeSection({
  title,
  status,
  children,
}: {
  title: string;
  status: QaBadge;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <Badge status={status} />
      </div>
      <div className="mt-3 space-y-2 text-sm text-slate-400">{children}</div>
    </section>
  );
}

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <div>
      <Link
        href={href}
        className="text-sky-400 underline-offset-2 hover:text-sky-300 hover:underline"
      >
        {label}
      </Link>
      <span className="ml-2 font-mono text-[11px] text-slate-600">{href}</span>
    </div>
  );
}

export default function ReleaseCheckClient({
  serverMeta,
}: {
  serverMeta: ServerMeta;
}) {
  const [statusProbe, setStatusProbe] = useState<DebugStatus>(null);
  const [stripeCheckoutEnabled, setStripeCheckoutEnabled] = useState<
    boolean | null
  >(null);
  const [pwaStandalone, setPwaStandalone] = useState(false);

  useEffect(() => {
    void fetch("/api/debug/status")
      .then((r) => r.json())
      .then((j) => setStatusProbe(j))
      .catch(() => setStatusProbe({}));
  }, []);

  useEffect(() => {
    void fetch("/api/stripe/config")
      .then((r) => r.json())
      .then((j: { checkoutEnabled?: boolean }) =>
        setStripeCheckoutEnabled(Boolean(j.checkoutEnabled))
      )
      .catch(() => setStripeCheckoutEnabled(false));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(display-mode: standalone)");
    const sync = () => setPwaStandalone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const rapidOk = Boolean(statusProbe?.rapidApiKeyConfigured);
  const siteUrlOk = Boolean(statusProbe?.nextPublicSiteUrlConfigured);

  const infoData: ReleaseInfoData = useMemo(
    () => ({
      ...serverMeta,
      rapidApiConfigured: rapidOk,
    }),
    [serverMeta, rapidOk]
  );

  const authBadge: QaBadge = serverMeta.supabaseConfigured
    ? "needs_review"
    : "not_configured";

  const stripeBadge: QaBadge = useMemo(() => {
    if (!serverMeta.stripePublishableConfigured) return "not_configured";
    const apiReady = stripeCheckoutEnabled === true;
    if (serverMeta.stripeCheckoutConfigured && apiReady) return "pass";
    return "needs_review";
  }, [
    serverMeta.stripeCheckoutConfigured,
    serverMeta.stripePublishableConfigured,
    stripeCheckoutEnabled,
  ]);

  const radarBadge: QaBadge = rapidOk ? "pass" : "not_configured";

  const pushBadge: QaBadge = serverMeta.pushEnabled ? "pass" : "not_configured";

  const pwaBadge: QaBadge = pwaStandalone
    ? "pass"
    : serverMeta.pushEnabled || serverMeta.supabaseConfigured
      ? "needs_review"
      : "not_configured";

  const sentryBadge: QaBadge = serverMeta.sentryEnabled
    ? "pass"
    : "not_configured";

  const analyticsBadge: QaBadge = serverMeta.analyticsEnabled
    ? "pass"
    : "not_configured";

  const seoBadge: QaBadge = siteUrlOk ? "pass" : "not_configured";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pb-20 sm:pt-8">
      <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <strong className="font-semibold">Debug page</strong> — not for public
        users. Contains internal QA links only; do not share in marketing.
      </div>

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          QA
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Release smoke check
        </h1>
        <p className="text-sm leading-relaxed text-slate-400">
          Quick links and configuration flags for TestFlight, Play internal, and
          web launch prep. See{" "}
          <code className="rounded bg-black/40 px-1 text-xs text-slate-300">
            docs/release-checklist.md
          </code>
          .
        </p>
      </header>

      <ReleaseInfoCard data={infoData} />

      <div className="grid gap-4 sm:gap-5">
        <SmokeSection title="Auth (Google / Apple)" status={authBadge}>
          <p>Confirm OAuth redirect URLs in Supabase + providers.</p>
          <LinkRow href="/" label="Open home → use Login in header" />
        </SmokeSection>

        <SmokeSection title="Premium &amp; Stripe" status={stripeBadge}>
          <p>
            Checkout API:{" "}
            {stripeCheckoutEnabled === null
              ? "…"
              : stripeCheckoutEnabled
                ? "reports enabled"
                : "reports disabled"}
            .
          </p>
          <LinkRow href="/premium" label="Premium page" />
        </SmokeSection>

        <SmokeSection title="Live radar" status={radarBadge}>
          <p>Requires RapidAPI (or fallbacks) on the server.</p>
          <LinkRow
            href="/api/live/aircraft-position?flight=TK1"
            label="Sample position API (JSON)"
          />
          <LinkRow href="/live/TK1" label="Live flight page (example TK1)" />
        </SmokeSection>

        <SmokeSection title="Push notifications" status={pushBadge}>
          <p>Opt-in from the app; verify VAPID and worker separately.</p>
          <LinkRow href="/alerts" label="Alerts hub" />
        </SmokeSection>

        <SmokeSection title="PWA" status={pwaBadge}>
          <p>
            {pwaStandalone
              ? "Running in standalone display mode."
              : "Install from browser; then re-open this page in standalone."}
          </p>
          <LinkRow href="/offline" label="Offline page" />
        </SmokeSection>

        <SmokeSection title="Family tracking" status="needs_review">
          <p>Use a real family link from a Premium test account.</p>
          <LinkRow href="/roadmap" label="Roadmap (feature context)" />
        </SmokeSection>

        <SmokeSection title="Blog" status="needs_review">
          <LinkRow href="/blog" label="Blog index" />
        </SmokeSection>

        <SmokeSection title="SEO pages" status={seoBadge}>
          <p>Airport / airline / route marketing pages.</p>
          <LinkRow href="/airport/IST" label="Sample airport (IST)" />
          <LinkRow href="/airline/TK" label="Sample airline (TK)" />
          <LinkRow href="/route/IST-JFK" label="Sample route" />
        </SmokeSection>

        <SmokeSection title="Sentry" status={sentryBadge}>
          <p>Send a test event from staging after enabling DSN.</p>
          <LinkRow href="/debug" label="Full debug / probes page" />
        </SmokeSection>

        <SmokeSection title="Analytics" status={analyticsBadge}>
          <p>Confirm live events in PostHog (or your dashboard).</p>
        </SmokeSection>
      </div>

      <p className="text-center text-xs text-slate-600">
        <Link href="/debug" className="text-slate-500 hover:text-slate-400">
          ← Debug home
        </Link>
        {" · "}
        <Link href="/" className="text-slate-500 hover:text-slate-400">
          Home
        </Link>
      </p>
    </div>
  );
}
