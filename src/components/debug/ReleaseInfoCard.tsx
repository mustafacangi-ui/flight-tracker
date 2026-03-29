"use client";

export type ReleaseInfoData = {
  environment: string;
  appVersion: string | null;
  releaseChannel: string | null;
  commitHash: string | null;
  sentryEnabled: boolean;
  analyticsEnabled: boolean;
  stripeCheckoutConfigured: boolean;
  stripePublishableConfigured: boolean;
  pushEnabled: boolean;
  supabaseConfigured: boolean;
  rapidApiConfigured: boolean;
};

function Row({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 py-2.5 text-sm last:border-0">
      <span className="text-slate-400">{label}</span>
      <span
        className={
          ok === undefined
            ? "font-mono text-xs text-slate-200"
            : ok
              ? "text-emerald-300"
              : "text-slate-500"
        }
      >
        {value}
      </span>
    </div>
  );
}

export default function ReleaseInfoCard({ data }: { data: ReleaseInfoData }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-lg backdrop-blur-md sm:p-5">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400/90">
        Build &amp; services
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Sanitized flags only — no secrets. Cross-check with Vercel / store
        consoles.
      </p>
      <div className="mt-4">
        <Row label="Environment" value={data.environment} />
        <Row
          label="App version"
          value={data.appVersion ?? "— (set NEXT_PUBLIC_APP_VERSION)"}
        />
        <Row
          label="Release channel"
          value={data.releaseChannel ?? "— (set NEXT_PUBLIC_RELEASE_CHANNEL)"}
        />
        <Row
          label="Commit / release"
          value={
            data.commitHash
              ? data.commitHash.length > 12
                ? `${data.commitHash.slice(0, 12)}…`
                : data.commitHash
              : "— (deploy with VERCEL_GIT_COMMIT_SHA or SENTRY_RELEASE)"
          }
        />
        <Row
          label="Sentry"
          value={data.sentryEnabled ? "Enabled (DSN set)" : "Not configured"}
          ok={data.sentryEnabled}
        />
        <Row
          label="Analytics"
          value={
            data.analyticsEnabled ? "PostHog key set" : "Not configured"
          }
          ok={data.analyticsEnabled}
        />
        <Row
          label="Stripe Checkout (server)"
          value={
            data.stripeCheckoutConfigured
              ? "Ready (secret + price IDs)"
              : "Not fully configured"
          }
          ok={data.stripeCheckoutConfigured}
        />
        <Row
          label="Stripe (browser)"
          value={
            data.stripePublishableConfigured
              ? "Publishable + prices"
              : "Incomplete"
          }
          ok={data.stripePublishableConfigured}
        />
        <Row
          label="Push (VAPID public)"
          value={data.pushEnabled ? "Configured" : "Not configured"}
          ok={data.pushEnabled}
        />
        <Row
          label="Supabase (OAuth)"
          value={data.supabaseConfigured ? "URL + anon key" : "Not configured"}
          ok={data.supabaseConfigured}
        />
        <Row
          label="RapidAPI (boards)"
          value={data.rapidApiConfigured ? "API key on server" : "Not configured"}
          ok={data.rapidApiConfigured}
        />
      </div>
    </section>
  );
}
