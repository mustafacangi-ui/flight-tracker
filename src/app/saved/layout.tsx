import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved flights",
  description: "Bookmarked flights and favorite airports.",
};

export default function SavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
