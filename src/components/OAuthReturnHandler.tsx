"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createBrowserSupabaseClient } from "../lib/supabase/client";

/**
 * Handles `?oauth=success` (DEBUG_OAUTH_SUCCESS): refresh session, toast, strip query.
 */
export default function OAuthReturnHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [banner, setBanner] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (searchParams.get("oauth") !== "success") return;
    if (handledRef.current) return;
    handledRef.current = true;

    const supabase = createBrowserSupabaseClient();
    void (async () => {
      if (supabase) {
        await supabase.auth.getSession();
      }
      router.refresh();
      setBanner(true);
      await new Promise((r) => setTimeout(r, 1200));
      const params = new URLSearchParams(searchParams.toString());
      params.delete("oauth");
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
      window.setTimeout(() => setBanner(false), 4500);
    })();
  }, [searchParams, router, pathname]);

  if (!banner) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[220] flex justify-center px-3"
      role="status"
    >
      <div className="pointer-events-auto rounded-xl border border-emerald-500/40 bg-emerald-950/95 px-4 py-3 text-center text-sm text-emerald-100 shadow-lg backdrop-blur-md">
        Signed in successfully. Refreshing your session…
      </div>
    </div>
  );
}
