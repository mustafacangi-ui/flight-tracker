"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import AirportFavoriteStar from "../AirportFavoriteStar";
import {
  getAirportInsightsMock,
  operationalBadgeClass,
  operationalLabel,
  trafficBadgeClass,
  trafficLabel,
  weatherPlaceholderFromMock,
} from "../../lib/airportInsightsMock";
import type { SimplifiedAirport } from "../../lib/airportSearchTypes";
import { getEffectiveAirportTimeZone } from "../../lib/formatAirportTime";
import FlightCardLiveRow from "../FlightCardLiveRow";
import { displayFlightTrackContext } from "../../lib/flightCardLink";
import { formatFlightsFromApi, type DisplayFlight } from "../../lib/formatFlights";
import type { AeroAirportFlight } from "../../lib/flightTypes";
import { trackEvent } from "../../lib/localAnalytics";
import {
  favoriteAirportFromSelection,
  toggleFavoriteAirport,
  type FavoriteAirport,
} from "../../lib/quickAccessStorage";
import { recordRecentAirportSearch } from "../../lib/recentSearchesStorage";
import { useUpgradeModal } from "../UpgradeModalProvider";

type TabId = "departures" | "arrivals" | "delays" | "terminals" | "lounges";

const TABS: { id: TabId; label: string }[] = [
  { id: "departures", label: "Departures" },
  { id: "arrivals", label: "Arrivals" },
  { id: "delays", label: "Delays" },
  { id: "terminals", label: "Terminals" },
  { id: "lounges", label: "Lounges" },
];

type ApiFlightsResponse = {
  departures?: AeroAirportFlight[];
  arrivals?: AeroAirportFlight[];
  error?: string;
};

function delayRiskScoreFromMock(arrivalDelayRisk: string): number {
  const s = arrivalDelayRisk.toLowerCase();
  if (s.includes("elevated")) return 8;
  if (s.includes("moderate")) return 6;
  if (s.includes("minor")) return 4;
  return 2;
}

function hashBars(code: string): number[] {
  let h = 0;
  for (let i = 0; i < code.length; i += 1) h = (h << 5) - h + code.charCodeAt(i);
  h = Math.abs(h);
  return Array.from({ length: 12 }, (_, i) => 25 + ((h + i * 17) % 55));
}

function isDelayedFlight(f: DisplayFlight): boolean {
  return (
    f.statusLabel.toLowerCase().includes("delay") ||
    (f.statusRaw?.toLowerCase().includes("delay") ?? false)
  );
}

function toFavorite(meta: SimplifiedAirport | null, code: string): FavoriteAirport {
  if (meta) {
    return {
      code: meta.code.trim().toUpperCase(),
      name: meta.name.trim() || code,
      city: meta.city.trim() || code,
    };
  }
  return favoriteAirportFromSelection({
    code,
    name: `${code} Airport`,
  });
}

function FlightMiniCard({
  f,
  hubCode,
  airportTimeZone,
}: {
  f: DisplayFlight;
  hubCode: string;
  airportTimeZone: string;
}) {
  const router = useRouter();
  const ctx = displayFlightTrackContext(f, hubCode, airportTimeZone);
  const dest =
    f.direction === "departure"
      ? f.destinationCity || f.destinationCode || "—"
      : f.originName || f.originCode || "—";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(ctx.trackHref)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(ctx.trackHref);
        }
      }}
      className="w-full cursor-pointer rounded-2xl border border-slate-800/90 bg-slate-900/50 p-3.5 text-left transition hover:scale-[1.02] hover:border-blue-500/40 hover:bg-slate-900/80 hover:shadow-[0_0_28px_rgba(59,130,246,0.18)] sm:p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-base font-bold text-white">{f.number}</span>
        <span className="shrink-0 font-mono text-xs text-slate-400">{f.time}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{f.airlineName ?? "—"}</p>
      <p className="mt-2 text-sm text-slate-300">
        {f.direction === "departure" ? "To" : "From"} {dest}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
          {f.statusLabel}
        </span>
        {isDelayedFlight(f) ? (
          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-200">
            Delayed
          </span>
        ) : null}
      </div>
      <FlightCardLiveRow
        className="mt-3 border-t border-slate-800/80 pt-3"
        trackHref={ctx.trackHref}
        flightNumber={f.number}
        originLabel={ctx.originLabel}
        destLabel={ctx.destLabel}
        estimatedArrivalHm={ctx.estimatedArrivalHm}
      />
    </div>
  );
}

type Props = { airportCode: string };

export default function AirportDetailClient({ airportCode }: Props) {
  const code = airportCode.trim().toUpperCase();
  const router = useRouter();
  const { openUpgrade } = useUpgradeModal();

  const [meta, setMeta] = useState<SimplifiedAirport | null>(null);
  const [departures, setDepartures] = useState<DisplayFlight[]>([]);
  const [arrivals, setArrivals] = useState<DisplayFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("departures");

  const insight = useMemo(() => getAirportInsightsMock(code), [code]);
  const wx = useMemo(() => weatherPlaceholderFromMock(insight), [insight]);
  const delayScore = delayRiskScoreFromMock(insight.arrivalDelayRisk);
  const bars = useMemo(() => hashBars(code), [code]);

  const tz = useMemo(
    () =>
      getEffectiveAirportTimeZone(code, meta ? { code: meta.code, timezone: meta.timezone } : null),
    [code, meta]
  );

  const fmt = useMemo(() => ({ airportTimeZone: tz }), [tz]);

  const favPayload = useMemo(() => toFavorite(meta, code), [meta, code]);

  useEffect(() => {
    recordRecentAirportSearch(code);
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/airports?query=${encodeURIComponent(code)}`,
          { cache: "no-store" }
        );
        const data = (await res.json()) as {
          airports?: SimplifiedAirport[];
        };
        if (cancelled) return;
        const hit = data.airports?.find(
          (a) => a.code.trim().toUpperCase() === code
        );
        setMeta(hit ?? null);
      } catch {
        if (!cancelled) setMeta(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const loadFlights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/flights?airport=${encodeURIComponent(code)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as ApiFlightsResponse;
      if (!res.ok) {
        setError(data.error ?? "Could not load flights.");
        setDepartures([]);
        setArrivals([]);
        return;
      }
      const dep = data.departures ?? [];
      const arr = data.arrivals ?? [];
      setDepartures(formatFlightsFromApi(dep, [], fmt));
      setArrivals(formatFlightsFromApi([], arr, fmt));
    } catch {
      setError("Network error.");
      setDepartures([]);
      setArrivals([]);
    } finally {
      setLoading(false);
    }
  }, [code, fmt]);

  useEffect(() => {
    void loadFlights();
  }, [loadFlights]);

  const delayedAll = useMemo(() => {
    const seen = new Set<string>();
    const out: DisplayFlight[] = [];
    for (const f of [...departures, ...arrivals]) {
      if (!isDelayedFlight(f) || seen.has(f.id)) continue;
      seen.add(f.id);
      out.push(f);
    }
    return out;
  }, [departures, arrivals]);

  const trending = useMemo(() => {
    const pool = [...departures];
    return pool.slice(0, 6);
  }, [departures]);

  const airportName = meta?.name?.trim() || `${code} Airport`;
  const city = meta?.city?.trim() || "—";
  const country = meta?.country?.trim() || "—";

  const terminalsMock = useMemo(
    () => [
      {
        id: "INT",
        title: "International",
        detail: "Check-in zones A–E · Security north pier",
      },
      {
        id: "DOM",
        title: "Domestic",
        detail: "Gates D12–D48 · Fast security lanes",
      },
      {
        id: "SAT",
        title: "Satellite",
        detail: "Bus gate connections · Schengen mix",
      },
    ],
    []
  );

  const loungesMock = useMemo(
    () => [
      {
        name: "RouteWings Club",
        terminal: "International",
        hours: "05:00 – 23:00",
      },
      {
        name: "Alliance Lounge",
        terminal: "International",
        hours: "24h (selected days)",
      },
      {
        name: "Express Lounge",
        terminal: "Domestic",
        hours: "06:00 – 22:00",
      },
    ],
    []
  );

  const saveAirport = useCallback(() => {
    trackEvent("save_airport_favorite", { airport: code });
    toggleFavoriteAirport(favPayload);
  }, [code, favPayload]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#060910] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(37,99,235,0.14),transparent)]" />
      <div className="relative mx-auto max-w-2xl px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pb-16 lg:max-w-4xl">
        <Link
          href="/"
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Home
        </Link>

        {/* Hero */}
        <header className="relative mt-6 overflow-hidden rounded-3xl border border-slate-800/90 bg-gradient-to-br from-slate-900/95 via-slate-950 to-slate-950 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-blue-600/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-24 w-48 bg-sky-500/10 blur-2xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-400/90">
                Airport
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {airportName}
              </h1>
              <p className="mt-1 font-mono text-lg text-blue-300/90">{code}</p>
              <p className="mt-3 text-sm text-slate-400">
                {city}
                {city !== "—" && country !== "—" ? " · " : " "}
                {country}
              </p>
            </div>
            <AirportFavoriteStar airport={favPayload} size="md" />
          </div>

          <div className="relative mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Current weather
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-sky-100">
                {wx.temperature}
              </p>
              <p className="text-sm font-medium text-slate-200">{wx.condition}</p>
              <p className="mt-2 text-xs text-slate-500">{wx.wind}</p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Delay risk score
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                {delayScore}
                <span className="text-lg font-medium text-slate-500">/10</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-200/85">
                {wx.delayRisk}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Operations
              </p>
              <span
                className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${operationalBadgeClass(insight.operational)}`}
              >
                {operationalLabel(insight.operational)}
              </span>
              <p className="mt-3 text-xs text-slate-500">
                Illustrative snapshot — confirm with your airline.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={saveAirport}
            className="relative mt-6 w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/35 transition hover:bg-blue-500 sm:w-auto sm:px-8"
          >
            Save this airport
          </button>
        </header>

        {/* Tabs */}
        <div className="mt-8 -mx-1 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition sm:px-4 ${
                tab === t.id
                  ? "border-blue-500/50 bg-blue-600/20 text-white ring-1 ring-blue-500/30"
                  : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <section className="mt-6">
          {tab === "departures" || tab === "arrivals" ? (
            <div>
              {loading ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  Loading flights…
                </p>
              ) : error ? (
                <p className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {(tab === "departures" ? departures : arrivals).map((f) => (
                    <li key={f.id}>
                      <FlightMiniCard
                        f={f}
                        hubCode={code}
                        airportTimeZone={tz}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {!loading &&
              !error &&
              (tab === "departures" ? departures : arrivals).length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  No {tab} to show right now.
                </p>
              ) : null}
            </div>
          ) : null}

          {tab === "delays" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Flights with a delay signal at {code}.
              </p>
              {loading ? (
                <p className="text-sm text-slate-500">Loading…</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {delayedAll.map((f) => (
                    <li key={`${f.id}-delay`}>
                      <FlightMiniCard
                        f={f}
                        hubCode={code}
                        airportTimeZone={tz}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {!loading && delayedAll.length === 0 ? (
                <p className="rounded-2xl border border-slate-800 bg-slate-900/40 py-10 text-center text-sm text-slate-500">
                  No delayed flights in the current board snapshot.
                </p>
              ) : null}
            </div>
          ) : null}

          {tab === "terminals" ? (
            <ul className="space-y-3">
              {terminalsMock.map((t) => (
                <li
                  key={t.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-400/90">
                    {t.id}
                  </p>
                  <p className="mt-1 font-semibold text-white">{t.title}</p>
                  <p className="mt-2 text-sm text-slate-400">{t.detail}</p>
                </li>
              ))}
              <p className="text-xs text-slate-600">
                Terminal map is illustrative — check airport signage on site.
              </p>
            </ul>
          ) : null}

          {tab === "lounges" ? (
            <ul className="space-y-3">
              {loungesMock.map((l) => (
                <li
                  key={l.name}
                  className="flex flex-col gap-1 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div>
                    <p className="font-semibold text-white">{l.name}</p>
                    <p className="text-xs text-slate-500">{l.terminal}</p>
                  </div>
                  <p className="font-mono text-xs text-slate-400">{l.hours}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {/* Delay intelligence */}
        <section className="mt-10 rounded-3xl border border-slate-800/90 bg-slate-900/35 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Delay intelligence</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {insight.weatherDelayHint} Combined with current traffic:{" "}
            <span className="font-medium text-slate-200">
              {trafficLabel(insight.traffic).toLowerCase()}
            </span>{" "}
            load on movements today.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${trafficBadgeClass(insight.traffic)}`}
            >
              {trafficLabel(insight.traffic)}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${operationalBadgeClass(insight.operational)}`}
            >
              {operationalLabel(insight.operational)}
            </span>
          </div>
        </section>

        {/* Weather risk */}
        <section className="mt-6 rounded-3xl border border-slate-800/90 bg-slate-900/35 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Weather risk</h2>
          <p className="mt-2 text-sm text-slate-400">
            Wind {insight.windDescriptor.toLowerCase()} · Visibility{" "}
            {insight.visibility}. {insight.weatherDelayHint}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-[10px] font-semibold uppercase text-slate-500">
                Ceiling / feel
              </p>
              <p className="mt-1 text-sm text-slate-200">{wx.condition}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-[10px] font-semibold uppercase text-slate-500">
                Impact on flow
              </p>
              <p className="mt-1 text-sm text-amber-200/90">{wx.delayRisk}</p>
            </div>
          </div>
        </section>

        {/* Traffic chart */}
        <section className="mt-6 rounded-3xl border border-slate-800/90 bg-slate-900/35 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-lg font-bold text-white">Airport traffic</h2>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${trafficBadgeClass(insight.traffic)}`}
            >
              {trafficLabel(insight.traffic)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Relative movement intensity by hour (illustrative).
          </p>
          <div className="mt-6 flex h-28 items-end justify-between gap-1 px-1">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-blue-900/40 to-blue-500/70"
                style={{ height: `${h}%` }}
                title={`Slot ${i + 1}`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[9px] font-medium uppercase tracking-wider text-slate-600">
            <span>6h</span>
            <span>Now</span>
            <span>+6h</span>
          </div>
        </section>

        {/* Trending */}
        <section className="mt-6 rounded-3xl border border-slate-800/90 bg-slate-900/35 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Trending flights</h2>
          <p className="mt-1 text-sm text-slate-500">
            Busy departures from this board snapshot.
          </p>
          {trending.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No data yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {trending.map((f) => {
                const tctx = displayFlightTrackContext(f, code, tz);
                return (
                  <li key={f.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(tctx.trackHref)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(tctx.trackHref);
                        }
                      }}
                      className="flex w-full cursor-pointer flex-col gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 px-4 py-3 text-left transition hover:scale-[1.01] hover:border-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.15)]"
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="font-mono font-semibold text-white">
                          {f.number}
                        </span>
                        <span className="text-xs text-slate-400">
                          {f.destinationCity || f.destinationCode}
                        </span>
                      </div>
                      <FlightCardLiveRow
                        compact
                        trackHref={tctx.trackHref}
                        flightNumber={f.number}
                        originLabel={tctx.originLabel}
                        destLabel={tctx.destLabel}
                        estimatedArrivalHm={tctx.estimatedArrivalHm}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Premium CTA */}
        <section className="mt-8 rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.07] via-slate-900/60 to-blue-600/[0.1] p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80">
            RouteWings Pro
          </p>
          <h2 className="mt-2 text-lg font-bold text-white">
            Unlock premium airport insights
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Live METAR hooks, queue wait times, lounge capacity, and predictive
            delay models — coming to Pro first.
          </p>
          <button
            type="button"
            onClick={() =>
              openUpgrade({ blockedFeature: "airport_pro_insights" })
            }
            className="mt-4 w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 sm:w-auto sm:px-8"
          >
            Explore Pro
          </button>
        </section>
      </div>
    </div>
  );
}
