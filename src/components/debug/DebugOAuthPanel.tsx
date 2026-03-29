"use client";

import { useEffect, useState } from "react";

import {
  getCanonicalOriginClient,
  getOAuthCallbackUrlClient,
} from "../../lib/auth/getCanonicalSiteOrigin";
import { getOAuthRedirectToClient } from "../../lib/oauthRedirect";
import { createBrowserSupabaseClient } from "../../lib/supabase/client";

export default function DebugOAuthPanel() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [cookieCount, setCookieCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Supabase not configured in browser");
      return;
    }
    void supabase.auth.getSession().then(({ data: { session }, error: e }) => {
      if (e) setError(e.message);
      setSessionUserId(session?.user?.id ?? null);
      setSessionEmail(session?.user?.email ?? null);
    });
    try {
      setCookieCount(
        document.cookie ? document.cookie.split(";").filter(Boolean).length : 0
      );
    } catch {
      setCookieCount(0);
    }
  }, []);

  return (
    <section className="mt-8 rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-200/90">
        OAuth / session (this browser)
      </h2>
      <ul className="mt-3 space-y-2 font-mono text-xs text-gray-300">
        <li>
          <span className="text-gray-500">window.origin</span>{" "}
          {typeof window !== "undefined" ? window.location.origin : "—"}
        </li>
        <li>
          <span className="text-gray-500">Canonical origin</span>{" "}
          {typeof window !== "undefined" ? getCanonicalOriginClient() : "—"}
        </li>
        <li>
          <span className="text-gray-500">OAuth callback URL</span>{" "}
          {typeof window !== "undefined" ? getOAuthCallbackUrlClient() : "—"}
        </li>
        <li>
          <span className="text-gray-500">getOAuthRedirectToClient()</span>{" "}
          {typeof window !== "undefined" ? getOAuthRedirectToClient() : "—"}
        </li>
        <li>
          <span className="text-gray-500">Supabase session user id</span>{" "}
          {sessionUserId ?? "—"}
        </li>
        <li>
          <span className="text-gray-500">Session email (debug only)</span>{" "}
          {sessionEmail ?? "—"}
        </li>
        <li>
          <span className="text-gray-500">document.cookie segments</span>{" "}
          {cookieCount}
        </li>
      </ul>
      {error ? (
        <p className="mt-2 text-xs text-red-300/90">{error}</p>
      ) : null}
    </section>
  );
}
