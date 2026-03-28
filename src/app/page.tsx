"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AirportFavoriteStar from "../components/AirportFavoriteStar";
import AirportSearch from "../components/AirportSearch";
import FlightBoard from "../components/FlightBoard";
import FlightList from "../components/FlightList";
import HomeAirportInsights from "../components/HomeAirportInsights";
import HomeQuickWidgets from "../components/HomeQuickWidgets";
import HomeRecentAndTrending from "../components/HomeRecentAndTrending";
import InstallAppCard from "../components/InstallAppCard";
import SearchBar from "../components/SearchBar";
import {
  AirportHeaderSkeleton,
  FlightBoardSkeleton,
  FlightCardSkeletonList,
} from "../components/skeletons/LoadingSkeletons";
import { RATE_LIMIT_EXCEEDED_MESSAGE } from "../lib/apiMessages";
import {
  formatAirportLocalClockParts,
  formatAirportLocalTime,
  formatAirportLongDateUpper,
  getEffectiveAirportTimeZone,
} from "../lib/formatAirportTime";
import { formatFlightsFromApi, type DisplayFlight } from "../lib/formatFlights";
import { parseAirportCode, type AeroAirportFlight } from "../lib/flightTypes";
import { trackEvent } from "../lib/localAnalytics";
import { consumeScrollToSearch } from "../lib/mobileNavSession";
import { favoriteAirportFromSelection } from "../lib/quickAccessStorage";
import { recordRecentAirportSearch } from "../lib/recentSearchesStorage";
import { runDepartureReminders } from "../lib/departureReminders";
import { seedAlertTimelineIfEmpty } from "../lib/mockNotificationSeed";
import { useSmartFlightTracking } from "../hooks/useSmartFlightTracking";
import HomeTopAuthBar from "../components/home/HomeTopAuthBar";
import HomeAviationFacts from "../components/HomeAviationFacts";
import HomeGroupedFlightUpdates from "../components/HomeGroupedFlightUpdates";
import HomeQuickStats from "../components/HomeQuickStats";
import HomeStickyAlertsPreview from "../components/HomeStickyAlertsPreview";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { writeDebugSessionFidsCache } from "../lib/debugFlightSessionCache";

const REFRESH_MS = 5 * 60 * 1000;

type ApiFlightsResponse = {
  departures?: AeroAirportFlight[];
  arrivals?: AeroAirportFlight[];
  error?: string;
  fallback?: boolean;
};

type FlightsCacheEntry = {
  departures: AeroAirportFlight[];
  arrivals: AeroAirportFlight[];
  /** When this payload was last fetched from the API (ms since epoch). */
  fetchedAt: number;
};

export default function Home() {
  const [departures, setDepartures] = useState<DisplayFlight[]>([]);
  const [arrivals, setArrivals] = useState<DisplayFlight[]>([]);
  const [mode, setMode] = useState<"departure" | "arrival">("departure");
  const [viewMode, setViewMode] = useState<"cards" | "board">("cards");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [fetchSucceededOnce, setFetchSucceededOnce] = useState(false);
  const [airport, setAirport] = useState("IST");
  const [selectedAirport, setSelectedAirport] = useState<{
    code: string;
    name: string;
    timezone?: string;
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  /** True only after a successful API response with zero departures and zero arrivals. */
  const [emptyAfterSuccess, setEmptyAfterSuccess] = useState(false);
  /** User tapped refresh; show live-update banner while loading with existing rows. */
  const [manualLiveRefresh, setManualLiveRefresh] = useState(false);

  const airportRef = useRef(airport);
  airportRef.current = airport;

  const selectedAirportRef = useRef(selectedAirport);
  selectedAirportRef.current = selectedAirport;

  const lastUpdatedRef = useRef<Date | null>(null);
  lastUpdatedRef.current = lastUpdated;

  const [freshnessNow, setFreshnessNow] = useState(() => Date.now());

  useEffect(() => {
    setFreshnessNow(Date.now());
  }, [lastUpdated]);

  useEffect(() => {
    if (lastUpdated == null) return;
    const id = window.setInterval(() => setFreshnessNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [lastUpdated]);

  const dataIsLive =
    lastUpdated != null &&
    freshnessNow - lastUpdated.getTime() < REFRESH_MS;

  const [localClockTick, setLocalClockTick] = useState(0);

  const effectiveIanaTz = useMemo(
    () => getEffectiveAirportTimeZone(airport, selectedAirport),
    [airport, selectedAirport]
  );

  const nowForClock = useMemo(() => {
    void effectiveIanaTz;
    void localClockTick;
    return Date.now();
  }, [effectiveIanaTz, localClockTick]);

  const airportClockParts = useMemo(
    () => formatAirportLocalClockParts(nowForClock, effectiveIanaTz),
    [effectiveIanaTz, nowForClock]
  );

  const boardAirportLine = useMemo(() => {
    const displayName = (selectedAirport?.name || airport).toUpperCase();
    const code = (selectedAirport?.code || airport).toUpperCase();
    return `${displayName} (${code})`;
  }, [selectedAirport, airport]);

  const boardDateLine = useMemo(
    () => formatAirportLongDateUpper(nowForClock, effectiveIanaTz),
    [effectiveIanaTz, nowForClock]
  );

  useEffect(() => {
    const id = window.setInterval(
      () => setLocalClockTick((n) => n + 1),
      60_000
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setLocalClockTick((n) => n + 1);
  }, [airport, selectedAirport?.timezone]);

  useEffect(() => {
    seedAlertTimelineIfEmpty();
  }, []);

  useEffect(() => {
    if (!hasSearched) return;
    trackEvent(
      mode === "departure" ? "flight_mode_departure" : "flight_mode_arrival"
    );
  }, [mode, hasSearched]);

  useEffect(() => {
    if (!hasSearched) return;
    trackEvent(
      viewMode === "board" ? "view_mode_board" : "view_mode_cards"
    );
  }, [viewMode, hasSearched]);

  const departuresRef = useRef<DisplayFlight[]>([]);
  const arrivalsRef = useRef<DisplayFlight[]>([]);
  departuresRef.current = departures;
  arrivalsRef.current = arrivals;

  /** Last successful FIDS payload per airport for this browser session (no re-fetch if same code is selected again). */
  const sessionFlightsCache = useRef(
    new Map<string, FlightsCacheEntry>()
  );

  const fetchFlights = useCallback(
    async (code: string, options?: { skipCache?: boolean }) => {
      setLoading(true);
      setError(null);

      if (!options?.skipCache && sessionFlightsCache.current.has(code)) {
        const hit = sessionFlightsCache.current.get(code)!;
        const tz = getEffectiveAirportTimeZone(
          code,
          selectedAirportRef.current
        );
        const fmt = { airportTimeZone: tz };
        setDepartures(formatFlightsFromApi(hit.departures, [], fmt));
        setArrivals(formatFlightsFromApi([], hit.arrivals, fmt));
        setLastUpdated(new Date(hit.fetchedAt));
        setFetchSucceededOnce(true);
        setEmptyAfterSuccess(
          hit.departures.length === 0 && hit.arrivals.length === 0
        );
        setLoading(false);
        writeDebugSessionFidsCache(sessionFlightsCache.current);
        trackEvent("airport_search_success", { airport: code });
        return;
      }

      try {
        const res = await fetch(
          `/api/flights?airport=${encodeURIComponent(code)}`
        );

        let data: Partial<ApiFlightsResponse> = {};
        try {
          data = (await res.json()) as ApiFlightsResponse;
        } catch {
          /* non-JSON body — still handle status below */
        }

        if (!res.ok) {
          if (res.status === 429) {
            setError(data.error ?? RATE_LIMIT_EXCEEDED_MESSAGE);
            const hit = sessionFlightsCache.current.get(code);
            if (hit) {
              setDepartures(formatFlightsFromApi(hit.departures, []));
              setArrivals(formatFlightsFromApi([], hit.arrivals));
              setLastUpdated(new Date(hit.fetchedAt));
              setEmptyAfterSuccess(
                hit.departures.length === 0 && hit.arrivals.length === 0
              );
            } else if (
              data.fallback === true &&
              code === airportRef.current &&
              (departuresRef.current.length > 0 ||
                arrivalsRef.current.length > 0)
            ) {
              /* keep existing flights */
            } else {
              setDepartures([]);
              setArrivals([]);
              setLastUpdated(null);
              setEmptyAfterSuccess(false);
            }
          } else {
            setDepartures([]);
            setArrivals([]);
            setLastUpdated(null);
            setEmptyAfterSuccess(false);
            setError(
              data.error ??
                "Could not load flights. Please try again in a few moments."
            );
          }
          return;
        }

        const entry: FlightsCacheEntry = {
          departures: data.departures ?? [],
          arrivals: data.arrivals ?? [],
          fetchedAt: Date.now(),
        };
        sessionFlightsCache.current.set(code, entry);
        writeDebugSessionFidsCache(sessionFlightsCache.current);

        const tz = getEffectiveAirportTimeZone(
          code,
          selectedAirportRef.current
        );
        const fmt = { airportTimeZone: tz };
        setDepartures(formatFlightsFromApi(entry.departures, [], fmt));
        setArrivals(formatFlightsFromApi([], entry.arrivals, fmt));
        setLastUpdated(new Date(entry.fetchedAt));
        setFetchSucceededOnce(true);
        setEmptyAfterSuccess(
          entry.departures.length === 0 && entry.arrivals.length === 0
        );
        trackEvent("airport_search_success", { airport: code });
      } catch {
        setDepartures([]);
        setArrivals([]);
        setLastUpdated(null);
        setEmptyAfterSuccess(false);
        setError(
          "We couldn’t reach the server. Check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSearch = async (value: string) => {
    const code = parseAirportCode(value);
    recordRecentAirportSearch(code);
    setAirport(code);
    setSelectedAirport({
      code,
      name: code,
      timezone: getEffectiveAirportTimeZone(code, null),
    });
    setHasSearched(true);
    await fetchFlights(code);
  };

  const handleAirportSelect = useCallback(
    (a: { code: string; name: string; timezone?: string }) => {
      recordRecentAirportSearch(a.code);
      setAirport(a.code);
      const tz =
        a.timezone?.trim() || getEffectiveAirportTimeZone(a.code, null);
      setSelectedAirport({ code: a.code, name: a.name, timezone: tz });
      setHasSearched(true);
      void fetchFlights(a.code);
    },
    [fetchFlights]
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pendingAirportOpen");
      if (!raw) return;
      sessionStorage.removeItem("pendingAirportOpen");
      const a = JSON.parse(raw) as {
        code?: string;
        name?: string;
        timezone?: string;
      };
      if (!a?.code) return;
      handleAirportSelect({
        code: a.code.trim().toUpperCase(),
        name: (a.name || a.code).trim(),
        ...(a.timezone?.trim() ? { timezone: a.timezone.trim() } : {}),
      });
    } catch {
      /* ignore */
    }
  }, [handleAirportSelect]);

  useEffect(() => {
    if (!loading && manualLiveRefresh) {
      setManualLiveRefresh(false);
    }
  }, [loading, manualLiveRefresh]);

  useEffect(() => {
    if (!consumeScrollToSearch()) return;
    window.requestAnimationFrame(() => {
      document.getElementById("mobile-search")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      document.getElementById("flight-code-search")?.focus();
    });
  }, []);

  useEffect(() => {
    if (!hasSearched) return;
    if (!fetchSucceededOnce) return;

    const id = window.setInterval(() => {
      const lu = lastUpdatedRef.current;
      if (
        lu != null &&
        Date.now() - lu.getTime() < REFRESH_MS
      ) {
        return;
      }
      void fetchFlights(airportRef.current, { skipCache: true });
    }, REFRESH_MS);

    return () => window.clearInterval(id);
  }, [hasSearched, fetchSucceededOnce, fetchFlights]);

  const showEmpty =
    hasSearched &&
    !loading &&
    emptyAfterSuccess &&
    !error;

  const hasFlightRows = departures.length > 0 || arrivals.length > 0;
  const showLiveUpdateBanner =
    manualLiveRefresh && loading && hasSearched && hasFlightRows;
  const showResultsSkeleton =
    loading &&
    hasSearched &&
    !error &&
    !hasFlightRows &&
    !emptyAfterSuccess;

  const handleManualRefresh = () => {
    if (!hasSearched) return;
    setManualLiveRefresh(true);
    void fetchFlights(airport, { skipCache: true });
  };

  const handleRetryFlights = useCallback(() => {
    if (!hasSearched) return;
    setError(null);
    void fetchFlights(airportRef.current, { skipCache: true });
  }, [hasSearched, fetchFlights]);

  const trackingFlights = mode === "departure" ? departures : arrivals;
  useSmartFlightTracking(trackingFlights, mode, Boolean(
    hasSearched && !loading && hasFlightRows && !error
  ));

  useEffect(() => {
    if (!hasSearched || departures.length === 0) return;
    runDepartureReminders(departures, effectiveIanaTz);
  }, [departures, effectiveIanaTz, hasSearched]);

  const flightsTodayTotal = departures.length + arrivals.length;
  const sampleFlightForFacts = useMemo(() => {
    const list = mode === "departure" ? departures : arrivals;
    return list[0] ?? null;
  }, [mode, departures, arrivals]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-950 text-white">
      <HomeTopAuthBar />
      <div className="mx-auto flex w-full max-w-[600px] min-w-0 flex-col justify-center px-3 py-6 sm:px-6 sm:py-10">
        <main className="flex w-full min-w-0 flex-col gap-6 md:gap-8">
          <motion.div
            id="mobile-search"
            className="scroll-mt-4 space-y-3 md:space-y-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.h1
              className="text-center text-xl font-semibold sm:text-left sm:text-2xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.32 }}
            >
              ✈️ Flight Tracker
            </motion.h1>

            <SearchBar onSearch={handleSearch} />

            <AirportSearch onSelectAirport={handleAirportSelect} />

            <p className="text-center">
              <Link
                href="/roadmap"
                className="text-xs text-gray-500 underline-offset-2 transition hover:text-gray-300 hover:underline"
              >
                Roadmap, Pro & feedback
              </Link>
            </p>
          </motion.div>

          <HomeQuickStats
            flightsToday={flightsTodayTotal}
            hasSearched={hasSearched}
          />

          <HomeStickyAlertsPreview />

          <InstallAppCard />

          <HomeGroupedFlightUpdates />

          <HomeQuickWidgets
            onOpenAirport={(a) => {
              const tz = getEffectiveAirportTimeZone(a.code, null);
              handleAirportSelect({
                code: a.code,
                name:
                  [a.city, a.name].filter(Boolean).join(" - ") || a.code,
                timezone: tz,
              });
            }}
          />

          <HomeRecentAndTrending
            onOpenAirport={(a) => {
              const tz = getEffectiveAirportTimeZone(a.code, null);
              handleAirportSelect({
                code: a.code,
                name:
                  [a.city, a.name].filter(Boolean).join(" - ") || a.code,
                timezone: tz,
              });
            }}
          />

          {error ? (
            <ErrorState
              title="Could not load flights"
              description={
                error.includes("RAPIDAPI_KEY") ||
                error.includes("Missing RAPIDAPI")
                  ? "The flight data service is not configured. Add RAPIDAPI_KEY to your environment (see deployment checklist) and redeploy."
                  : `${error} Please try again in a few moments.`
              }
              onRetry={handleRetryFlights}
              retryLabel="Retry"
            />
          ) : null}

          {hasSearched && !error && !showResultsSkeleton ? (
            <HomeAirportInsights
              airportCode={selectedAirport?.code ?? airport}
            />
          ) : null}

          {hasSearched && hasFlightRows && !error && !showResultsSkeleton ? (
            <HomeAviationFacts
              airportCode={selectedAirport?.code ?? airport}
              airportName={selectedAirport?.name ?? airport}
              sampleFlight={sampleFlightForFacts}
            />
          ) : null}

          {showEmpty ? (
            <EmptyState
              icon={<span aria-hidden>✈</span>}
              title="No flights found"
              description="This airport returned no departures or arrivals. Try another code or search again in a few minutes."
              action={{
                label: "Search another airport",
                onClick: () => {
                  document
                    .getElementById("mobile-search")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  document.getElementById("flight-code-search")?.focus();
                },
              }}
            />
          ) : null}

          {!showEmpty ? (
            <>
              {showLiveUpdateBanner ? (
                <div
                  className="sticky top-2 z-30 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-center text-xs font-medium text-emerald-100 backdrop-blur-md md:text-sm"
                  role="status"
                  aria-live="polite"
                >
                  Updating live flights...
                </div>
              ) : null}

              <div className="flex w-full flex-col gap-2 md:gap-3">
                {showResultsSkeleton ? (
                  <AirportHeaderSkeleton />
                ) : (
                  <div className="mb-3 flex items-start justify-between gap-3 md:mb-5 md:gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400 md:gap-2 md:text-sm">
                        <span aria-hidden>📍</span>
                        <span className="font-medium text-gray-100">
                          {selectedAirport?.name || airport}
                        </span>
                        <span className="text-gray-500">
                          ({selectedAirport?.code || airport})
                        </span>
                        <AirportFavoriteStar
                          airport={favoriteAirportFromSelection({
                            code: selectedAirport?.code ?? airport,
                            name: selectedAirport?.name ?? airport,
                          })}
                          className="-my-1 ml-0.5"
                        />
                      </div>
                      <div className="text-[11px] text-gray-400 md:text-xs">
                        <span aria-hidden>🕒</span>
                        <span className="ml-1">
                          Local time: {airportClockParts.time}
                          {airportClockParts.zoneAbbrev
                            ? ` ${airportClockParts.zoneAbbrev}`
                            : ""}
                        </span>
                      </div>
                      <p className="hidden text-[11px] tracking-tight text-gray-500 sm:block">
                        {effectiveIanaTz}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2 text-[11px] text-gray-400 sm:flex-row sm:items-center sm:gap-2 sm:text-xs">
                      <span className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={handleManualRefresh}
                          disabled={loading || !hasSearched}
                          className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-[10px] font-medium text-gray-200 transition hover:bg-white/[0.1] disabled:opacity-40 md:hidden"
                          aria-label="Refresh flights"
                        >
                          Refresh
                        </button>
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            dataIsLive ? "bg-green-400" : "bg-gray-500"
                          }`}
                          aria-hidden
                        />
                        <span
                          className={
                            dataIsLive ? "font-medium text-emerald-400/95" : ""
                          }
                        >
                          {dataIsLive ? "Live" : "Cached"}
                        </span>
                        {lastUpdated ? (
                          <>
                            <span className="hidden text-gray-600 sm:inline">
                              •
                            </span>
                            <span className="max-w-[9rem] truncate sm:max-w-none">
                              Updated{" "}
                              {formatAirportLocalTime(
                                lastUpdated.getTime(),
                                effectiveIanaTz
                              )}
                            </span>
                          </>
                        ) : null}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex w-full flex-col items-stretch gap-2 md:items-center">
                  <div className="grid grid-cols-2 gap-2 md:flex md:justify-center">
                    <button
                      type="button"
                      onClick={() => setMode("departure")}
                      className={`w-full rounded-lg px-3 py-2.5 text-sm md:w-auto md:px-4 md:py-2 ${
                        mode === "departure"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      Departures
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("arrival")}
                      className={`w-full rounded-lg px-3 py-2.5 text-sm md:w-auto md:px-4 md:py-2 ${
                        mode === "arrival"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      Arrivals
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:flex md:justify-center">
                    <button
                      type="button"
                      onClick={() => setViewMode("cards")}
                      className={`w-full rounded-lg px-3 py-2.5 text-sm md:w-auto md:px-4 md:py-2 ${
                        viewMode === "cards"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      Cards
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode("board")}
                      className={`w-full rounded-lg px-3 py-2.5 text-sm md:w-auto md:px-4 md:py-2 ${
                        viewMode === "board"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      Board
                    </button>
                  </div>
                </div>
              </div>

              {showResultsSkeleton ? (
                viewMode === "cards" ? (
                  <FlightCardSkeletonList count={4} />
                ) : (
                  <FlightBoardSkeleton rows={6} />
                )
              ) : (
                <AnimatePresence mode="wait">
                  {viewMode === "cards" ? (
                    <motion.div
                      key={`cards-${mode}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{
                        duration: 0.28,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <FlightList
                        flights={
                          mode === "departure" ? departures : arrivals
                        }
                        loading={loading}
                        searchedAirportCode={
                          selectedAirport?.code ?? airport
                        }
                        airportTimeZone={effectiveIanaTz}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`board-${mode}`}
                      initial={{ opacity: 0, y: 12, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.99 }}
                      transition={{
                        duration: 0.3,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <FlightBoard
                        flights={
                          mode === "departure" ? departures : arrivals
                        }
                        mode={mode}
                        loading={loading}
                        airportLine={boardAirportLine}
                        localTime={airportClockParts.time}
                        timeZoneAbbrev={
                          airportClockParts.zoneAbbrev || effectiveIanaTz
                        }
                        dateLine={boardDateLine}
                        isLive={dataIsLive}
                        searchedAirportCode={
                          selectedAirport?.code ?? airport
                        }
                        airportTimeZone={effectiveIanaTz}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
