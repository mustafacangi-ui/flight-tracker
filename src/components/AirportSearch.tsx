"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import AirportFavoriteStar from "./AirportFavoriteStar";
import ErrorState from "./ErrorState";
import { RATE_LIMIT_MESSAGE } from "../lib/apiMessages";
import type {
  AirportsApiResponse,
  SimplifiedAirport,
} from "../lib/airportSearchTypes";
import { favoriteAirportFromSimplified } from "../lib/quickAccessStorage";

const DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 3;

type Props = {
  onSelectAirport: (airport: {
    code: string;
    name: string;
    timezone?: string;
  }) => void;
};

export default function AirportSearch({ onSelectAirport }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SimplifiedAirport[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  /** Session cache: normalized query → last successful airport list (skips `/api/airports`). */
  const searchResultsCache = useRef(new Map<string, SimplifiedAirport[]>());

  useEffect(() => {
    const q = query.trim();

    if (q.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      setFetchError(null);
      return;
    }

    let cancelled = false;

    const timeout = setTimeout(() => {
      void (async () => {
        const cacheKey = q.toLowerCase();
        const cached = searchResultsCache.current.get(cacheKey);
        if (cached) {
          if (!cancelled) {
            setResults(cached);
            setFetchError(null);
            setLoading(false);
          }
          return;
        }

        setLoading(true);
        setFetchError(null);
        try {
          const res = await fetch(
            `/api/airports?query=${encodeURIComponent(q)}`
          );

          let data: Partial<AirportsApiResponse> = {};
          try {
            data = (await res.json()) as AirportsApiResponse;
          } catch {
            /* ignore parse errors */
          }

          if (cancelled) return;
          if (!res.ok) {
            if (res.status === 429) {
              setFetchError(RATE_LIMIT_MESSAGE);
            } else {
              setResults([]);
              setFetchError(
                data.error ?? "Could not load airports. Try again shortly."
              );
            }
            return;
          }
          const list = [...(data.airports ?? [])];
          searchResultsCache.current.set(cacheKey, list);
          setResults(list);
          if (data.error) setFetchError(data.error);
          else setFetchError(null);
        } catch {
          if (!cancelled) {
            setResults([]);
            setFetchError(
              "Network error. Check your connection and try again."
            );
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, retryNonce]);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const showPanel = open && query.trim().length >= MIN_QUERY_LENGTH;

  const handleSelect = useCallback(
    (a: SimplifiedAirport) => {
      const name = [a.city?.trim(), a.name?.trim()].filter(Boolean).join(" - ");
      onSelectAirport({
        code: a.code,
        name: name.length > 0 ? name : a.code,
        ...(a.timezone ? { timezone: a.timezone } : {}),
      });
      setQuery("");
      setResults([]);
      setLoading(false);
      setOpen(false);
      setFetchError(null);
    },
    [onSelectAirport]
  );

  const formatLine = (a: SimplifiedAirport) =>
    `${a.city} - ${a.name} (${a.code})`;

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1 md:gap-1.5">
      <label htmlFor="airport-search" className="text-[11px] text-gray-400 md:text-xs">
        Search airport
      </label>
      <input
        id="airport-search"
        type="text"
        value={query}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="At least 3 characters (e.g. ist, lhr)"
        className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none md:px-4"
      />

      {showPanel ? (
        <div
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-xl shadow-black/40"
          role="listbox"
        >
          {loading ? (
            <p className="px-3 py-2.5 text-sm text-gray-400">Searching…</p>
          ) : fetchError ? (
            <div className="p-2">
              <ErrorState
                title="Airport search failed"
                description={fetchError}
                onRetry={() => setRetryNonce((n) => n + 1)}
                retryLabel="Try again"
                className="border-red-500/25 bg-red-500/[0.06] py-4 text-left"
              />
            </div>
          ) : results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-gray-400">No matching airports</p>
          ) : (
            results.map((a) => (
              <div
                key={`${a.code}-${a.name}-${a.city}`}
                className="flex items-center gap-1 border-b border-white/5 last:border-0"
                role="presentation"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 px-3 py-2.5 text-left text-sm text-gray-200 transition hover:bg-gray-800"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(a)}
                >
                  {formatLine(a)}
                </button>
                <AirportFavoriteStar
                  airport={favoriteAirportFromSimplified(a)}
                  size="sm"
                  className="mr-2 shrink-0"
                />
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
