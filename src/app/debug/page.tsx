"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ALERT_TIMELINE_KEY,
} from "../../lib/alertHistoryStorage";
import {
  readDebugSessionFidsCache,
} from "../../lib/debugFlightSessionCache";
import {
  FAVORITE_AIRPORTS_KEY,
  SAVED_FLIGHTS_KEY,
} from "../../lib/quickAccessStorage";
import { RECENT_FLIGHTS_KEY } from "../../lib/recentFlightsStorage";
import { RECENT_SEARCHES_STORAGE_KEY } from "../../lib/recentSearchesStorage";
import { isStandaloneDisplayMode } from "../../hooks/useInstallPrompt";

type QaStatus = "ok" | "partial" | "issue";

type ServerDebug = {
  nodeEnv: string;
  vercelEnv: string | null;
  rapidApiKeyConfigured: boolean;
  nextPublicSiteUrlConfigured: boolean;
  nextPublicSiteUrlHost: string | null;
  serverFlightFidsCacheTtlMs?: number;
  serverAirportSearchCacheTtlMs?: number;
};

const DEFAULT_FIDS_TTL_MS = 5 * 60 * 1000;
const DEFAULT_AIRPORTS_TTL_MS = 5 * 60 * 1000;

type FlightsProbe = {
  ok: boolean;
  status: number;
  ms: number;
  rateLimited: boolean;
  fallbackFlag: boolean;
  depCount: number;
  arrCount: number;
  error?: string;
};

type AirportsProbe = {
  ok: boolean;
  status: number;
  ms: number;
  airportCount: number;
  error?: string;
};

type RouteProbe = { path: string; ok: boolean; status: number };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMs(ms: number): string {
  if (ms >= 60_000) return `${Math.round(ms / 60_000)}m`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function StatusDot({ status }: { status: QaStatus }) {
  const cls =
    status === "ok"
      ? "bg-emerald-500"
      : status === "partial"
        ? "bg-amber-400"
        : "bg-red-500";
  return (
    <span
      className={`mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${cls}`}
      title={
        status === "ok"
          ? "OK"
          : status === "partial"
            ? "Partial / manual follow-up"
            : "Issue"
      }
      aria-hidden
    />
  );
}

function ChecklistRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: QaStatus;
  detail: ReactNode;
}) {
  return (
    <div className="flex gap-3 border-b border-white/10 py-2.5 text-sm last:border-0">
      <StatusDot status={status} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-200">{label}</p>
        <div className="mt-0.5 text-xs leading-relaxed text-gray-500">
          {detail}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const PREVIEW_WIDTHS = {
  iphone: 390,
  android: 412,
  tablet: 768,
  desktop: 1280,
} as const;

export default function DebugPage() {
  const [server, setServer] = useState<ServerDebug | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [flightsP, setFlightsP] = useState<FlightsProbe | null>(null);
  const [airportsP, setAirportsP] = useState<AirportsProbe | null>(null);
  const [probing, setProbing] = useState(false);
  const [routeProbes, setRouteProbes] = useState<RouteProbe[]>([]);
  const [manifestOk, setManifestOk] = useState<boolean | null>(null);
  const [iconsOk, setIconsOk] = useState<boolean | null>(null);
  const [cacheApiSummary, setCacheApiSummary] = useState<string | null>(null);
  const [sessionFids, setSessionFids] = useState(
    () => readDebugSessionFidsCache()
  );
  const [previewW, setPreviewW] = useState<number | null>(null);
  const [deferredInstall, setDeferredInstall] = useState(false);
  const [pageErrors, setPageErrors] = useState(0);

  const timezone = useMemo(
    () =>
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "—",
    []
  );

  const notifPermission =
    typeof Notification !== "undefined" ? Notification.permission : "unsupported";

  const standalone =
    typeof window !== "undefined" ? isStandaloneDisplayMode() : false;

  const isMobileUa =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  const [viewport, setViewport] = useState<[number, number]>(() =>
    typeof window !== "undefined"
      ? [window.innerWidth, window.innerHeight]
      : [0, 0]
  );
  const [vw, vh] = viewport;

  useEffect(() => {
    const sync = () =>
      setViewport([window.innerWidth, window.innerHeight]);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    const onErr = () => setPageErrors((n) => n + 1);
    window.addEventListener("error", onErr);
    return () => window.removeEventListener("error", onErr);
  }, []);

  useEffect(() => {
    const onBip = () => setDeferredInstall(true);
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSessionFids(readDebugSessionFidsCache()), 2000);
    const onFocus = () => setSessionFids(readDebugSessionFidsCache());
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        if (!("caches" in window)) {
          setCacheApiSummary("unsupported");
          return;
        }
        const keys = await caches.keys();
        setCacheApiSummary(
          keys.length === 0
            ? "0 named caches"
            : `${keys.length} cache(s): ${keys.join(", ")}`
        );
      } catch {
        setCacheApiSummary("error reading Cache API");
      }
    })();
  }, []);

  const runChecks = useCallback(async () => {
    setProbing(true);

    try {
      const res = await fetch("/api/debug/status", { cache: "no-store" });
      if (!res.ok) setServerErr(`HTTP ${res.status}`);
      else {
        setServerErr(null);
        setServer((await res.json()) as ServerDebug);
      }
    } catch (e) {
      setServerErr(e instanceof Error ? e.message : "status fetch failed");
    }

    const t0f = performance.now();
    try {
      const res = await fetch("/api/flights?airport=IST", { cache: "no-store" });
      const ms = Math.round(performance.now() - t0f);
      let body: {
        departures?: unknown[];
        arrivals?: unknown[];
        fallback?: boolean;
        error?: string;
      } = {};
      try {
        body = (await res.json()) as typeof body;
      } catch {
        /* ignore */
      }
      const depCount = Array.isArray(body.departures) ? body.departures.length : 0;
      const arrCount = Array.isArray(body.arrivals) ? body.arrivals.length : 0;
      setFlightsP({
        ok: res.ok,
        status: res.status,
        ms,
        rateLimited: res.status === 429,
        fallbackFlag: body.fallback === true,
        depCount,
        arrCount,
        error: typeof body.error === "string" ? body.error : undefined,
      });
    } catch (e) {
      setFlightsP({
        ok: false,
        status: 0,
        ms: Math.round(performance.now() - t0f),
        rateLimited: false,
        fallbackFlag: false,
        depCount: 0,
        arrCount: 0,
        error: e instanceof Error ? e.message : "fetch failed",
      });
    }

    const t0a = performance.now();
    try {
      const res = await fetch("/api/airports?query=ist", { cache: "no-store" });
      const ms = Math.round(performance.now() - t0a);
      let body: { airports?: unknown[]; error?: string } = {};
      try {
        body = (await res.json()) as typeof body;
      } catch {
        /* ignore */
      }
      const airportCount = Array.isArray(body.airports) ? body.airports.length : 0;
      setAirportsP({
        ok: res.ok,
        status: res.status,
        ms,
        airportCount,
        error: typeof body.error === "string" ? body.error : undefined,
      });
    } catch (e) {
      setAirportsP({
        ok: false,
        status: 0,
        ms: Math.round(performance.now() - t0a),
        airportCount: 0,
        error: e instanceof Error ? e.message : "fetch failed",
      });
    }

    const routes = [
      "/",
      "/saved",
      "/alerts",
      "/offline",
      "/flight/QA1",
      "/share/QA1",
      "/roadmap",
    ];
    const rp: RouteProbe[] = [];
    for (const path of routes) {
      try {
        const res = await fetch(path, { method: "GET", cache: "no-store" });
        rp.push({ path, ok: res.ok, status: res.status });
      } catch {
        rp.push({ path, ok: false, status: 0 });
      }
    }
    setRouteProbes(rp);

    try {
      const m = await fetch("/manifest.json", { cache: "no-store" });
      if (!m.ok) setManifestOk(false);
      else {
        const j = (await m.json()) as { icons?: unknown };
        setManifestOk(Array.isArray(j.icons) && j.icons.length > 0);
      }
    } catch {
      setManifestOk(false);
    }

    try {
      const i192 = await fetch("/icons/icon-192.png", { method: "HEAD" });
      const i512 = await fetch("/icons/icon-512.png", { method: "HEAD" });
      setIconsOk(i192.ok && i512.ok);
    } catch {
      setIconsOk(false);
    }

    setSessionFids(readDebugSessionFidsCache());
    setProbing(false);
  }, []);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  const lsRead = useCallback((key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }, []);

  const lsKeyDefs = [
    { key: FAVORITE_AIRPORTS_KEY, label: "favoriteAirports" },
    { key: SAVED_FLIGHTS_KEY, label: "savedFlights" },
    { key: RECENT_SEARCHES_STORAGE_KEY, label: "recentSearches" },
    { key: RECENT_FLIGHTS_KEY, label: "recentFlights" },
    { key: ALERT_TIMELINE_KEY, label: "alerts (timeline)" },
  ] as const;
  const lsKeys = lsKeyDefs.map(({ key, label }) => {
    const raw = typeof window !== "undefined" ? lsRead(key) : null;
    const len = raw?.length ?? 0;
    let preview = "— empty";
    if (raw) {
      preview =
        raw.length > 120 ? `${raw.slice(0, 120)}… (${len} chars)` : raw;
    }
    return { key, label, len, preview };
  });

  const totalLsBytes = useMemo(() => {
    if (typeof window === "undefined") return 0;
    try {
      let b = 0;
      for (const k of Object.keys(localStorage)) {
        const v = localStorage.getItem(k) ?? "";
        b += k.length + v.length;
      }
      return b * 2;
    } catch {
      return 0;
    }
  }, []);

  const sessionCacheBytes = useMemo(() => {
    if (!sessionFids) return 0;
    try {
      return new Blob([JSON.stringify(sessionFids)]).size;
    } catch {
      return 0;
    }
  }, [sessionFids]);

  const lastRefreshMs = useMemo(() => {
    if (!sessionFids?.fetchedAtByAirport) return null;
    const times = Object.values(sessionFids.fetchedAtByAirport);
    if (times.length === 0) return null;
    return Math.max(...times);
  }, [sessionFids]);

  const hasRecentSearches =
    (lsRead(RECENT_SEARCHES_STORAGE_KEY)?.length ?? 0) > 2;
  const hasFavorites = (lsRead(FAVORITE_AIRPORTS_KEY)?.length ?? 0) > 2;
  const hasSavedFlights = (lsRead(SAVED_FLIGHTS_KEY)?.length ?? 0) > 2;
  const hasAlerts = (lsRead(ALERT_TIMELINE_KEY)?.length ?? 0) > 2;

  const anyDeps =
    sessionFids &&
    Object.values(sessionFids.flightCountsByAirport ?? {}).some(
      (c) => c.dep > 0
    );
  const anyArrs =
    sessionFids &&
    Object.values(sessionFids.flightCountsByAirport ?? {}).some(
      (c) => c.arr > 0
    );

  const flightsReachable: QaStatus =
    flightsP == null
      ? "partial"
      : flightsP.ok
        ? "ok"
        : flightsP.status === 503 && server?.rapidApiKeyConfigured === false
          ? "issue"
          : "issue";

  const airportsReachable: QaStatus =
    airportsP == null
      ? "partial"
      : airportsP.ok
        ? "ok"
        : "issue";

  const rateLimitStatus: QaStatus =
    flightsP == null
      ? "partial"
      : flightsP.rateLimited || flightsP.fallbackFlag
        ? "partial"
        : flightsP.ok
          ? "ok"
          : "issue";

  const serverCacheStatus: QaStatus =
    server?.rapidApiKeyConfigured && flightsP?.ok
      ? "ok"
      : server?.rapidApiKeyConfigured
        ? "partial"
        : "issue";

  const flightDetailRoute = routeProbes.find((r) => r.path === "/flight/QA1");
  const shareRoute = routeProbes.find((r) => r.path === "/share/QA1");
  const savedRoute = routeProbes.find((r) => r.path === "/saved");
  const alertsRoute = routeProbes.find((r) => r.path === "/alerts");
  const offlineRoute = routeProbes.find((r) => r.path === "/offline");
  const homeRoute = routeProbes.find((r) => r.path === "/");

  const routesAllOk =
    routeProbes.length > 0 && routeProbes.every((r) => r.ok);

  const installPromptAvailable: QaStatus =
    standalone ? "ok" : deferredInstall ? "ok" : "partial";

  const row = (label: string, value: ReactNode) => (
    <div className="flex flex-wrap gap-x-3 gap-y-1 border-b border-white/10 py-2 text-sm last:border-0">
      <span className="min-w-[10rem] shrink-0 text-gray-500">{label}</span>
      <span className="min-w-0 flex-1 font-mono text-xs text-gray-200 sm:text-sm">
        {value}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-950 px-3 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl min-w-0">
        <Link
          href="/"
          className="text-sm text-gray-400 transition hover:text-white"
        >
          ← Home
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">QA / testing checklist</h1>
        <p className="mt-2 text-xs leading-relaxed text-amber-200/80">
          Internal diagnostics. API keys are never shown. Protect or remove this
          route for public production if needed.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/debug/release-check"
            className="text-sky-400 underline-offset-2 hover:text-sky-300 hover:underline"
          >
            Release / TestFlight smoke check →
          </Link>
        </p>

        {serverErr ? (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            /api/debug/status: {serverErr}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void runChecks()}
            disabled={probing}
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {probing ? "Running checks…" : "Re-run all checks"}
          </button>
        </div>

        {/* 1. API Status */}
        <Section title="1. API status">
          <ChecklistRow
            label="Flights API reachable"
            status={flightsReachable}
            detail={
              flightsP ? (
                <>
                  <span className="text-gray-400">
                    GET /api/flights?airport=IST → {flightsP.status} ·{" "}
                    {flightsP.ms}ms
                  </span>
                  {flightsP.ok ? (
                    <span className="text-emerald-400/90">
                      {" "}
                      · {flightsP.depCount} dep / {flightsP.arrCount} arr
                    </span>
                  ) : null}
                  {flightsP.error ? (
                    <span className="block text-red-300/90">{flightsP.error}</span>
                  ) : null}
                </>
              ) : (
                "Probe not run yet."
              )
            }
          />
          <ChecklistRow
            label="Airports API reachable"
            status={airportsReachable}
            detail={
              airportsP ? (
                <>
                  <span className="text-gray-400">
                    GET /api/airports?query=ist → {airportsP.status} ·{" "}
                    {airportsP.ms}ms
                  </span>
                  {airportsP.ok ? (
                    <span className="text-emerald-400/90">
                      {" "}
                      · {airportsP.airportCount} results
                    </span>
                  ) : null}
                  {airportsP.error ? (
                    <span className="block text-red-300/90">
                      {airportsP.error}
                    </span>
                  ) : null}
                </>
              ) : (
                "Probe not run yet."
              )
            }
          />
          <ChecklistRow
            label="Rate limit / upstream throttling"
            status={rateLimitStatus}
            detail={
              flightsP?.rateLimited || flightsP?.fallbackFlag ? (
                <span className="text-amber-200/90">
                  Last flights probe returned 429 or fallback flag — stale data
                  may be served server-side. Treat as partial.
                </span>
              ) : flightsP?.ok ? (
                "No rate-limit signal on last probe (200)."
              ) : (
                "Cannot evaluate until flights API returns success."
              )
            }
          />
          <ChecklistRow
            label="Server cache active"
            status={serverCacheStatus}
            detail={
              server ? (
                <>
                  Flights FIDS: in-memory TTL{" "}
                  {formatMs(
                    server.serverFlightFidsCacheTtlMs ?? DEFAULT_FIDS_TTL_MS
                  )}
                  . Airport search:{" "}
                  {formatMs(
                    server.serverAirportSearchCacheTtlMs ??
                      DEFAULT_AIRPORTS_TTL_MS
                  )}
                  .{" "}
                  {!server.rapidApiKeyConfigured ? (
                    <span className="text-red-300/90">
                      APIs disabled without RAPIDAPI_KEY.
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      Browser cannot observe hit/miss; timing may vary on repeat
                      requests.
                    </span>
                  )}
                </>
              ) : (
                "Load /api/debug/status to show TTLs."
              )
            }
          />
        </Section>

        {/* 2. Device info */}
        <Section title="2. Device info">
          {row("Screen size", `${vw}×${vh} px`)}
          {row(
            "Browser",
            typeof navigator !== "undefined" ? navigator.userAgent : "—"
          )}
          {row("Timezone", timezone)}
          {row(
            "Form factor",
            isMobileUa ? "Mobile / tablet UA" : "Desktop UA (heuristic)"
          )}
          {row(
            "Install prompt",
            standalone
              ? "Installed (standalone)"
              : deferredInstall
                ? "beforeinstallprompt available"
                : "Not fired yet (common on desktop or already installed)"
          )}
          {row("Notification permission", String(notifPermission))}
        </Section>

        {/* 3. Feature checklist */}
        <Section title="3. Feature checklist">
          <p className="mb-3 text-xs text-gray-500">
            Green = automated check passed. Yellow = needs manual verification or
            weak signal. Red = failed probe or missing dependency.
          </p>
          <ChecklistRow
            label="Airport search"
            status={
              airportsReachable === "ok" && hasRecentSearches
                ? "ok"
                : airportsReachable === "ok"
                  ? "partial"
                  : "issue"
            }
            detail={
              hasRecentSearches
                ? "API OK and recentSearches has data."
                : "API status above; open Home and search to populate recentSearches."
            }
          />
          <ChecklistRow
            label="Departures toggle / data"
            status={
              anyDeps || (flightsP?.ok && flightsP.depCount > 0)
                ? "ok"
                : flightsP?.ok
                  ? "partial"
                  : "issue"
            }
            detail="Uses session cache after visiting Home. OK if probe or cached counts show departures."
          />
          <ChecklistRow
            label="Arrivals toggle / data"
            status={
              anyArrs || (flightsP?.ok && flightsP.arrCount > 0)
                ? "ok"
                : flightsP?.ok
                  ? "partial"
                  : "issue"
            }
            detail="OK if probe or cached session shows arrivals."
          />
          <ChecklistRow
            label="Card view"
            status={homeRoute?.ok ? "partial" : "issue"}
            detail="Home loads; confirm card layout manually (default view)."
          />
          <ChecklistRow
            label="Board view"
            status={homeRoute?.ok ? "partial" : "issue"}
            detail="Switch to board on Home — manual check."
          />
          <ChecklistRow
            label="Flight detail page"
            status={
              flightDetailRoute?.ok
                ? "ok"
                : flightDetailRoute
                  ? "issue"
                  : "partial"
            }
            detail={`GET /flight/QA1 → ${flightDetailRoute?.status ?? "…"}`}
          />
          <ChecklistRow
            label="Family share page"
            status={
              shareRoute?.ok ? "ok" : shareRoute ? "issue" : "partial"
            }
            detail={`GET /share/QA1 → ${shareRoute?.status ?? "…"}`}
          />
          <ChecklistRow
            label="Saved flights"
            status={
              savedRoute?.ok && hasSavedFlights
                ? "ok"
                : savedRoute?.ok
                  ? "partial"
                  : "issue"
            }
            detail={
              hasSavedFlights
                ? "Route OK and savedFlights populated."
                : "/saved reachable; save a flight to turn green."
            }
          />
          <ChecklistRow
            label="Favorite airports"
            status={
              homeRoute?.ok && hasFavorites
                ? "ok"
                : homeRoute?.ok
                  ? "partial"
                  : "issue"
            }
            detail={
              hasFavorites
                ? "Star an airport stored under favoriteAirports."
                : "Star an airport on Home to populate."
            }
          />
          <ChecklistRow
            label="Alerts"
            status={
              alertsRoute?.ok && hasAlerts
                ? "ok"
                : alertsRoute?.ok
                  ? "partial"
                  : "issue"
            }
            detail="/alerts plus flightAlertTimeline localStorage."
          />
          <ChecklistRow
            label="Install app"
            status={installPromptAvailable}
            detail={
              standalone
                ? "Running as installed PWA."
                : deferredInstall
                  ? "Native install flow can be triggered."
                  : "Use supported Chrome/Edge on HTTPS; prompt may not appear in dev."
            }
          />
          <ChecklistRow
            label="Offline page"
            status={
              offlineRoute?.ok ? "ok" : offlineRoute ? "issue" : "partial"
            }
            detail={`GET /offline → ${offlineRoute?.status ?? "…"}`}
          />
        </Section>

        {/* 4. Cache inspector */}
        <Section title="4. Cache inspector">
          {row(
            "Service Worker Cache API",
            cacheApiSummary ?? "…"
          )}
          {row(
            "Tab session FIDS mirror (sessionStorage)",
            sessionFids
              ? `${sessionFids.approxEntryCount} airport(s) · ~${formatBytes(sessionCacheBytes)}`
              : "No snapshot — open Home and load an airport"
          )}
          {sessionFids && sessionFids.airportKeys.length > 0 ? (
            <ul className="mt-2 space-y-2 font-mono text-[11px] text-gray-400">
              {sessionFids.airportKeys.map((code) => {
                const t = sessionFids.fetchedAtByAirport[code];
                const c = sessionFids.flightCountsByAirport[code];
                return (
                  <li key={code} className="rounded-lg bg-black/30 px-2 py-1.5">
                    <span className="text-gray-200">{code}</span> · dep{" "}
                    {c?.dep ?? "?"} / arr {c?.arr ?? "?"} · refreshed{" "}
                    {t
                      ? new Date(t).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "medium",
                        })
                      : "—"}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-gray-500">
              Cached airports list appears after successful loads on Home.
            </p>
          )}
          {row(
            "Last refresh (newest cached airport)",
            lastRefreshMs
              ? new Date(lastRefreshMs).toLocaleString(undefined, {
                  dateStyle: "full",
                  timeStyle: "medium",
                })
              : "—"
          )}
        </Section>

        {/* 5. LocalStorage inspector */}
        <Section title="5. LocalStorage inspector">
          {row("Approx. total size", formatBytes(totalLsBytes))}
          <div className="mt-3 space-y-3">
            {lsKeys.map(({ label, key, len, preview }) => (
              <div
                key={key}
                className="rounded-xl border border-white/5 bg-black/25 p-3"
              >
                <p className="font-mono text-xs text-emerald-400/90">
                  {label}
                </p>
                <p className="mt-1 font-mono text-[10px] text-gray-500">
                  key: {key}
                </p>
                <p className="mt-2 break-all font-mono text-[11px] text-gray-300">
                  {len === 0 ? (
                    <span className="text-gray-600">empty</span>
                  ) : (
                    preview
                  )}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* 6. Responsive preview */}
        <Section title="6. Responsive test preview">
          <p className="mb-3 text-xs text-gray-500">
            Embeds Home in a fixed-width frame for quick layout checks.
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["iPhone", PREVIEW_WIDTHS.iphone],
                ["Android", PREVIEW_WIDTHS.android],
                ["Tablet", PREVIEW_WIDTHS.tablet],
                ["Desktop", PREVIEW_WIDTHS.desktop],
              ] as const
            ).map(([name, w]) => (
              <button
                key={name}
                type="button"
                onClick={() => setPreviewW(previewW === w ? null : w)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  previewW === w
                    ? "border-sky-500/60 bg-sky-500/20 text-sky-100"
                    : "border-white/15 bg-white/5 text-gray-200 hover:bg-white/10"
                }`}
              >
                {name} ({w}px)
              </button>
            ))}
            {previewW ? (
              <button
                type="button"
                onClick={() => setPreviewW(null)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-gray-400"
              >
                Close frame
              </button>
            ) : null}
          </div>
          {previewW ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-2">
              <p className="mb-2 text-center font-mono text-[10px] text-gray-500">
                {previewW}px wide · same origin
              </p>
              <iframe
                title="Responsive preview"
                src="/"
                className="mx-auto block rounded-lg bg-gray-950"
                style={{
                  width: previewW,
                  maxWidth: "100%",
                  height: "min(70vh, 720px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            </div>
          ) : null}
        </Section>

        {/* 7. Build readiness */}
        <Section title="7. Build readiness">
          <ChecklistRow
            label="Console errors (this page session)"
            status={pageErrors === 0 ? "ok" : "issue"}
            detail={`window error events since load: ${pageErrors}. Use DevTools for full console review.`}
          />
          <ChecklistRow
            label="TypeScript / ESLint"
            status="partial"
            detail="Run locally: npm run build && npm run lint (cannot be verified inside the browser)."
          />
          <ChecklistRow
            label="Web app manifest"
            status={
              manifestOk === null
                ? "partial"
                : manifestOk
                  ? "ok"
                  : "issue"
            }
            detail="/manifest.json must parse and include icons[]"
          />
          <ChecklistRow
            label="PWA icons"
            status={
              iconsOk === null ? "partial" : iconsOk ? "ok" : "issue"
            }
            detail="HEAD /icons/icon-192.png and /icons/icon-512.png"
          />
          <ChecklistRow
            label="Environment / public URL"
            status={
              server?.rapidApiKeyConfigured && server.nextPublicSiteUrlConfigured
                ? "ok"
                : server?.rapidApiKeyConfigured
                  ? "partial"
                  : "issue"
            }
            detail="From /api/debug/status: RAPIDAPI_KEY and NEXT_PUBLIC_SITE_URL"
          />
          <ChecklistRow
            label="Routes respond"
            status={
              routeProbes.length === 0
                ? "partial"
                : routesAllOk
                  ? "ok"
                  : "issue"
            }
            detail={
              <ul className="mt-1 space-y-1 font-mono text-[10px]">
                {routeProbes.map((r) => (
                  <li key={r.path}>
                    <span className={r.ok ? "text-emerald-400" : "text-red-300"}>
                      {r.ok ? "OK" : "FAIL"}
                    </span>{" "}
                    {r.path} {r.status}
                  </li>
                ))}
              </ul>
            }
          />
        </Section>

        {/* 8. Deployment checklist */}
        <Section title="8. Deployment checklist">
          {row(
            "RAPIDAPI_KEY",
            server ? (
              server.rapidApiKeyConfigured ? (
                <span className="text-emerald-400">Present (value hidden)</span>
              ) : (
                <span className="text-red-300">Missing — APIs return 503</span>
              )
            ) : (
              "…"
            )
          )}
          {row(
            "Vercel ready",
            server?.vercelEnv ? (
              <span className="text-emerald-400">
                VERCEL_ENV={server.vercelEnv}
              </span>
            ) : (
              <span className="text-amber-200/90">
                No VERCEL_ENV (local or non-Vercel). Production deploy should set
                env vars in project settings.
              </span>
            )
          )}
          {row(
            "PWA ready",
            manifestOk && iconsOk ? (
              <span className="text-emerald-400">Manifest + icons probed OK</span>
            ) : (
              <span className="text-amber-200/90">
                Re-run checks; confirm manifest and icons.
              </span>
            )
          )}
          {row(
            "SEO ready",
            server?.nextPublicSiteUrlConfigured ? (
              <span className="text-emerald-400">
                NEXT_PUBLIC_SITE_URL set · host {server.nextPublicSiteUrlHost}
              </span>
            ) : (
              <span className="text-amber-200/90">
                Set NEXT_PUBLIC_SITE_URL for canonical / OG URLs in production.
              </span>
            )
          )}
          {row(
            "Share pages ready",
            shareRoute?.ok ? (
              <span className="text-emerald-400">
                /share/[flight] responds ({shareRoute.status})
              </span>
            ) : (
              <span className="text-red-300/90">
                Share route probe failed — verify dynamic route.
              </span>
            )
          )}
        </Section>

        <section className="mt-8 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs text-amber-100/90">
          <p className="font-semibold">Manual QA</p>
          <p className="mt-2 leading-relaxed text-amber-100/80">
            Throttle network in DevTools, test board mode on a mid-tier phone,
            and run Lighthouse on the production URL after deploy.
          </p>
        </section>
      </div>
    </div>
  );
}
