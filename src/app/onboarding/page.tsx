import type { Metadata } from "next";

import OnboardingPageClient from "./OnboardingPageClient";

export const metadata: Metadata = {
  title: "Welcome",
  description:
    "Introduction to RouteWings — live tracking, family sharing, alerts, and Premium.",
  robots: { index: false, follow: true },
};

export default function OnboardingPage() {
  return <OnboardingPageClient />;
}
