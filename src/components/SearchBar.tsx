"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  AirportsApiResponse,
  SimplifiedAirport,
} from "../lib/airportSearchTypes";
import type { SavedFlight } from "../lib/quickAccessStorage";
import { loadSavedFlights } from "../lib/quickAccessStorage";

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

type AirportSuggestion = {
  type: "airport";
  code: string;
  name: string;
  city?: string;
};

type FlightSuggestion = {
  type: "flight";
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureCity?: string;
  arrivalCity?: string;
  status: string;
  departureTime?: string;
  source: "saved" | "live";
};

type Suggestion = AirportSuggestion | FlightSuggestion;

type Props = {
  onSearch?: (value: string) => void;
};

function normalizeFlightNumber(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

function isFlightNumberLike(query: string): boolean {
  return /^[A-Z]{2,3}\d{1,4}$/i.test(query.trim());
}

function isLikelyFlightSearch(query: string): boolean {
  const q = query.trim().toUpperCase();
  if (/^[A-Z]{2,3}\d/.test(q)) return true;
  if (q.length <= 3 && /^[A-Z]+$/.test(q)) return false;
  if (q.length > 3 && /\d/.test(q)) return true;
  return false;
}

function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return "";
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function getStatusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("delay")) return "bg-amber-500/20 text-amber-300";
  if (s.includes("cancel")) return "bg-red-500/20 text-red-300";
  if (s.includes("board") || s.includes("gate")) return "bg-blue-500/20 text-blue-300";
  if (s.includes("depart") || s.includes("airborne")) return "bg-emerald-500/20 text-emerald-300";
  if (s.includes("land") || s.includes("arriv")) return "bg-emerald-500/20 text-emerald-300";
  return "bg-slate-500/20 text-slate-300";
}

export default function SearchBar({ onSearch }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchResultsCache = useRef(new Map<string, Suggestion[]>());

  const fetchSuggestions = useCallback(async (q: string) => {
    const cacheKey = q.toLowerCase();
    const cached = searchResultsCache.current.get(cacheKey);
    if (cached) {
      setSuggestions(cached);
      setHighlightedIndex(0);
      setFetchError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      const results: Suggestion[] = [];
      const isFlightSearch = isLikelyFlightSearch(q);
      const normalizedQuery = normalizeFlightNumber(q);

      // Always search for airports
      const airportRes = await fetch(`/api/airports?query=${encodeURIComponent(q)}`);
      if (airportRes.ok) {
        const airportData = (await airportRes.json()) as AirportsApiResponse;
        const airportSuggestions: AirportSuggestion[] = (airportData.airports ?? [])
          .slice(0, 4)
          .map((a) => ({
            type: "airport",
            code: a.code,
            name: a.name,
            city: a.city,
          }));
        results.push(...airportSuggestions);
      }

      // Search for flights if query looks like a flight number
      if (isFlightSearch || q.length >= 2) {
        const seenFlights = new Set<string>();
        
        // First: search saved flights client-side (prioritize these)
        try {
          const savedFlights = loadSavedFlights();
          const matchingSaved = savedFlights
            .filter((f) => {
              const flightNum = normalizeFlightNumber(f.flightNumber);
              return flightNum.startsWith(normalizedQuery) || 
                     flightNum === normalizedQuery ||
                     (normalizedQuery.length <= 3 && flightNum.startsWith(normalizedQuery));
            })
            .slice(0, 3)
            .map((f): FlightSuggestion => ({
              type: "flight",
              flightNumber: f.flightNumber,
              airline: f.airline,
              departureAirport: f.departureAirport,
              arrivalAirport: f.arrivalAirport,
              status: f.status,
              departureTime: f.scheduledTime,
              source: "saved",
            }));
          
          for (const flight of matchingSaved) {
            if (!seenFlights.has(flight.flightNumber)) {
              seenFlights.add(flight.flightNumber);
              results.push(flight);
            }
          }
        } catch {
          // Ignore localStorage errors
        }

        // Second: search live flights from API
        const flightRes = await fetch(`/api/flights/search?query=${encodeURIComponent(q)}`);
        if (flightRes.ok) {
          const flightData = (await flightRes.json()) as { flights: FlightSuggestion[] };
          const liveFlights = (flightData.flights ?? [])
            .slice(0, 4)
            .filter((f) => !seenFlights.has(f.flightNumber));
          
          results.push(...liveFlights);
        }
      }

      searchResultsCache.current.set(cacheKey, results);
      setSuggestions(results);
      setHighlightedIndex(0);
    } catch {
      setFetchError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      setFetchError(null);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) void fetchSuggestions(q);
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const showPanel = open && query.trim().length >= MIN_QUERY_LENGTH;

  const handleSelect = useCallback(
    (s: Suggestion) => {
      setQuery("");
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      setFetchError(null);
      if (s.type === "airport") {
        router.push(`/airport/${encodeURIComponent(s.code)}`);
      } else {
        router.push(`/flight/${encodeURIComponent(s.flightNumber)}`);
      }
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPanel || suggestions.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        const q = query.trim().toUpperCase();
        if (isFlightNumberLike(q)) {
          router.push(`/flight/${encodeURIComponent(q)}`);
        } else if (q.length >= 2) {
          router.push(`/airport/${encodeURIComponent(q)}`);
        }
        setQuery("");
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => (i + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        break;
      case "Enter":
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
        break;
      case "Escape":
        setOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const formatAirportLine = (a: AirportSuggestion) =>
    `${a.code} — ${a.name}${a.city ? `, ${a.city}` : ""}`;

  const renderFlightSuggestion = (f: FlightSuggestion) => {
    const route = `${f.departureAirport} → ${f.arrivalAirport}`;
    const time = formatTime(f.departureTime);
    const statusClass = getStatusBadgeClass(f.status);
    const isSaved = f.source === "saved";
    
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${isSaved ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
            {isSaved ? "Saved" : "Flight"}
          </span>
          <span className="font-medium text-white">{f.flightNumber}</span>
          <span className="text-gray-400">—</span>
          <span className="text-gray-300">{f.airline}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">{route}</span>
          {f.status && (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusClass}`}>
              {f.status}
            </span>
          )}
          {time && <span className="text-gray-500">• {time}</span>}
        </div>
      </div>
    );
  };

  const airportSuggestions = suggestions.filter((s): s is AirportSuggestion => s.type === "airport");
  const flightSuggestions = suggestions.filter((s): s is FlightSuggestion => s.type === "flight");

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
          placeholder="Search airport (IST) or flight (TK123)..."
          className="w-full rounded-xl border border-gray-700 bg-gray-900/80 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none md:px-4 md:py-3"
        />
      </div>

      {showPanel ? (
        <div
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-auto rounded-xl border border-gray-700 bg-gray-900 py-2 shadow-xl shadow-black/40"
          role="listbox"
        >
          {loading ? (
            <p className="px-3 py-2.5 text-sm text-gray-400">Searching…</p>
          ) : fetchError ? (
            <p className="px-3 py-2.5 text-sm text-red-300">{fetchError}</p>
          ) : suggestions.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-gray-400">
              No matches. Press Enter to search {query.trim().toUpperCase()}.
            </p>
          ) : (
            <>
              {airportSuggestions.length > 0 && (
                <div className="px-2 pb-2">
                  <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Airports
                  </div>
                  {airportSuggestions.map((a, index) => (
                    <button
                      key={`airport-${a.code}`}
                      type="button"
                      onClick={() => handleSelect(a)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-gray-800 ${
                        index === highlightedIndex ? "bg-gray-800 text-white" : "text-gray-200"
                      }`}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
                        Airport
                      </span>
                      <span>{formatAirportLine(a)}</span>
                    </button>
                  ))}
                </div>
              )}
              {flightSuggestions.length > 0 && (
                <div className="border-t border-gray-800 px-2 pt-2">
                  <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Flights
                  </div>
                  {flightSuggestions.map((f, index) => {
                    const globalIndex = airportSuggestions.length + index;
                    return (
                      <button
                        key={`flight-${f.flightNumber}`}
                        type="button"
                        onClick={() => handleSelect(f)}
                        className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-gray-800 ${
                          globalIndex === highlightedIndex ? "bg-gray-800 text-white" : "text-gray-200"
                        }`}
                        onMouseEnter={() => setHighlightedIndex(globalIndex)}
                      >
                        {renderFlightSuggestion(f)}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
