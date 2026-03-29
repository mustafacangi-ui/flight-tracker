import type { Metadata } from "next";

import { isStripeCheckoutConfigured } from "../../../lib/stripeEnv";
import ReleaseCheckClient from "./ReleaseCheckClient";

export const metadata: Metadata = {
  title: "Release check",
  description:
    "Internal QA and release smoke checklist — not for public indexing.",
  robots: { index: false, follow: false },
};

export default function ReleaseCheckPage() {
  const serverMeta = {
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION?.trim() || null,
    releaseChannel: process.env.NEXT_PUBLIC_RELEASE_CHANNEL?.trim() || null,
    commitHash:
      process.env.NEXT_PUBLIC_GIT_COMMIT_SHA?.trim() ||
      process.env.NEXT_PUBLIC_SENTRY_RELEASE?.trim() ||
      null,
    sentryEnabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()),
    analyticsEnabled: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()),
    stripeCheckoutConfigured: isStripeCheckoutConfigured(),
    stripePublishableConfigured: Boolean(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() &&
        process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY?.trim() &&
        process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY?.trim()
    ),
    pushEnabled: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()),
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    ),
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <ReleaseCheckClient serverMeta={serverMeta} />
    </div>
  );
}
