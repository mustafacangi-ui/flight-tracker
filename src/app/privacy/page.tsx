import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How RouteWings (FiyatRotasi) handles analytics, notifications, cookies, account data, and payments.",
};

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: March 27, 2026 · RouteWings / FiyatRotasi
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-white">Overview</h2>
            <p>
              This policy describes how we collect, use, and share information
              when you use RouteWings (the &quot;Service&quot;), including the
              website, progressive web app, and any native apps we may provide.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Analytics</h2>
            <p>
              We may use product analytics (for example PostHog or similar
              tools) to understand feature usage, errors, and performance.
              These tools may process pseudonymous identifiers, page URLs, and
              interaction events. You can limit tracking through your browser or
              device settings where available.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              Push notifications
            </h2>
            <p>
              If you opt in, we store push subscription endpoints and related
              metadata so we can deliver flight and account alerts. You can
              revoke permission in your browser or system settings at any time;
              we will stop sending pushes once the subscription is invalid or
              removed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              Cookies and local storage
            </h2>
            <p>
              We use cookies and local storage for session management (for
              example Supabase auth), preferences, PWA install state, onboarding
              completion, and lightweight local analytics counters. Essential
              cookies may be required for sign-in and security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Account data</h2>
            <p>
              When you create an account, we process the information you
              provide or that your identity provider (such as Google or Apple)
              shares with us, including email and profile identifiers. Data is
              processed under our infrastructure providers and authentication
              services. You may request access or deletion subject to applicable
              law and technical constraints.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              Payment processing
            </h2>
            <p>
              Premium subscriptions are processed by Stripe (or another
              designated payment processor). We do not store full payment card
              numbers on our servers. Stripe receives billing details and
              transaction records according to its own privacy policy. We retain
              subscription status and invoice references as needed to provide
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg">Third-party sources</h2>
            <p>
              Flight and airport data may come from third-party APIs. Those
              providers process requests according to their terms. We do not
              control their data practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p>
              For privacy questions, contact us through the channels listed on
              the site or app. We may update this policy from time to time; the
              &quot;Last updated&quot; date will change when we do.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
