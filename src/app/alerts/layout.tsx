import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alerts",
  description:
    "Notification timeline, sounds, and quiet hours for tracked flights.",
};

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
