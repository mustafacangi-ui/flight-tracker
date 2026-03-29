"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import {
  identifyAnalyticsUser,
  initTelemetry,
} from "../lib/analytics/telemetry";
import { trackEvent } from "../lib/localAnalytics";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "../lib/supabase/client";

export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initTelemetry();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      identifyAnalyticsUser(null);
      return;
    }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const sync = () => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        identifyAnalyticsUser(session?.user?.id ?? null);
      });
    };
    sync();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      sync();
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    trackEvent("page_view", { path: pathname });
  }, [pathname]);

  return <>{children}</>;
}
