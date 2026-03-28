"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { trackEvent } from "../lib/localAnalytics";

export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    trackEvent("page_view", { path: pathname });
  }, [pathname]);

  return <>{children}</>;
}
