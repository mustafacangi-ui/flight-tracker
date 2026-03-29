import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms for RouteWings — subscriptions, billing, refunds, acceptable use, and flight data limitations.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <article className="mx-auto max-w-2xl px-4 pb-24 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 sm:pt-8">
        <Link
          href="/"
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Home
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: March 27, 2026 · RouteWings / FiyatRotasi
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-white">Agreement</h2>
            <p>
              By using RouteWings (the &quot;Service&quot;), you agree to these
              terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              Subscriptions and premium billing
            </h2>
            <p>
              Premium features may require an active subscription billed through
              our payment provider (currently Stripe). Prices, billing intervals,
              and taxes are shown at checkout. Your subscription may renew
              automatically until you cancel in accordance with the flow
              presented at purchase and in your account or billing portal.
            </p>
          </section>

          <section>
            <h2 className="text-lg">Refunds</h2>
            <p>
              Refund eligibility depends on applicable law, the processor&apos;s
              rules, and our stated policy at the time of purchase. Where
              required, you may cancel renewal for the next period; past charges
              may be non-refundable except as mandated by law or at our
              discretion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Acceptable use</h2>
            <p>
              You agree not to misuse the Service: no unlawful activity, no
              attempt to disrupt or overload our systems, no scraping or
              automated access beyond reasonable personal use, and no
              infringement of others&apos; rights. We may suspend or terminate
              access for violations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              Limitations of live flight data
            </h2>
            <p>
              Flight status, gates, terminals, delays, and map positions come
              from third-party and aggregated sources. Information may be
              incomplete, delayed, or incorrect. RouteWings is not a source of
              official airline or air traffic control data. Always confirm with
              your airline, airport, or crew. We are not liable for decisions
              made based on the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg">Disclaimer</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of
              any kind, to the fullest extent permitted by law. We do not
              guarantee uninterrupted or error-free operation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Changes</h2>
            <p>
              We may modify these terms or the Service. Continued use after
              changes constitutes acceptance where permitted by law. See also our{" "}
              <Link
                href="/privacy"
                className="font-medium text-sky-400 underline-offset-2 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
