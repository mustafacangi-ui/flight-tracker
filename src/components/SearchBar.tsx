"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { RATE_LIMIT_MESSAGE } from "../lib/apiMessages";
import type {
  AirportsApiResponse,
  SimplifiedAirport,
} from "../lib/airportSearchTypes";

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

type Props = {
  onSearch?: (value: string) => void;
};

export default function SearchBar({ onSearch }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SimplifiedAirport[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
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
            setHighlightedIndex(0);
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
          setHighlightedIndex(0);
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
  }, [query]);

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
      setQuery("");
      setResults([]);
      setLoading(false);
      setOpen(false);
      setFetchError(null);
      // Redirect to airport page
      router.push(`/airport/${encodeURIComponent(a.code)}`);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPanel || results.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        // If no results shown but user pressed Enter, try to navigate with the raw query
        const code = query.trim().toUpperCase();
        if (code.length >= 2) {
          router.push(`/airport/${encodeURIComponent(code)}`);
          setQuery("");
        }
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => (i + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => (i - 1 + results.length) % results.length);
        break;
      case "Enter":
        e.preventDefault();
        handleSelect(results[highlightedIndex]);
        break;
      case "Escape":
        setOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const formatLine = (a: SimplifiedAirport) =>
    `${a.code} — ${a.name}${a.city ? `, ${a.city}` : ""}`;

  return (
    <div ref={rootRef} className="relative flex w-full flex-col gap-2.5">
      <div className="flex w-full flex-col gap-2 md:flex-row md:items-stretch md:gap-2">
        <input
          ref={inputRef}
          id="flight-code-search"
          type="text"
          value={query}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search airport (IST, SAW, FRA...)"
          className="w-full rounded-xl border border-gray-700 bg-gray-900/80 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none md:px-4 md:py-3"
        />
      </div>

      {showPanel ? (
        <div
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-xl border border-gray-700 bg-gray-900 py-1 shadow-xl shadow-black/40"
          role="listbox"
        >
          {loading ? (
            <p className="px-3 py-2.5 text-sm text-gray-400">Searching…</p>
          ) : fetchError ? (
            <p className="px-3 py-2.5 text-sm text-red-300">{fetchError}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-gray-400">
              No matching airports. Press Enter to try {query.trim().toUpperCase()}.
            </p>
          ) : (
            results.map((a, index) => (
              <button
                key={`${a.code}-${a.name}`}
                type="button"
                onClick={() => handleSelect(a)}
                className={`w-full px-3 py-2.5 text-left text-sm transition hover:bg-gray-800 ${
                  index === highlightedIndex
                    ? "bg-gray-800 text-white"
                    : "text-gray-200"
                }`}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {formatLine(a)}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
