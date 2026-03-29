"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { usePremiumFlag } from "../hooks/usePremiumFlag";
import {
  isMonitoringEnabled,
  setMonitoringUserContext,
} from "../lib/monitoring/captureError";
import { createBrowserSupabaseClient } from "../lib/supabase/client";

/**
 * Attaches coarse Sentry context: user id (no email), tier, route.
 */
export default function MonitoringContextSync() {
  const pathname = usePathname();
  const premium = usePremiumFlag();

  useEffect(() => {
    if (!isMonitoringEnabled()) return;

    let cancelled = false;
    const supabase = createBrowserSupabaseClient();
    void supabase?.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;
      setMonitoringUserContext({
        userId: user?.id ?? null,
        tier: user ? (premium ? "premium" : "free") : "unknown",
        route: pathname ?? null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, premium]);

  return null;
}
