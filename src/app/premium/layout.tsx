import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium",
  description:
    "RouteWings Premium — unlimited saves, push alerts, family tracking, live map, and airport intelligence.",
};

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
