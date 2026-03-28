import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Coming soon features, planned work, recently shipped updates, and community feedback for Flight Tracker.",
};

export default function RoadmapLayout({ children }: { children: ReactNode }) {
  return children;
}
