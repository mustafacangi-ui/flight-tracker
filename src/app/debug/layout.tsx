import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QA / Debug",
  description: "Internal diagnostics for deployment verification. Not indexed.",
  robots: { index: false, follow: false },
};

export default function DebugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
