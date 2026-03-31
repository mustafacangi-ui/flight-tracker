"use client";

import { useState } from "react";

const EXAMPLE_CHIPS = ["IST", "FRA", "JFK", "TK123"];

type Props = {
  onSearch: (value: string) => void;
};

export default function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState("");

  const runSearch = (searchValue: string) => {
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
      setValue("");
    }
  };

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="flex w-full flex-col gap-2 md:flex-row md:items-stretch md:gap-2">
        <input
          id="flight-code-search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch(value);
          }}
          placeholder="Airport (IST) or flight (TK123)"
          className="w-full rounded-xl border border-gray-700 bg-gray-900/80 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none md:px-4 md:py-3"
        />

        <button
          type="button"
          onClick={() => runSearch(value)}
          className="w-full shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 md:w-auto md:px-6 md:py-3"
        >
          Search
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500">Try:</span>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => runSearch(chip)}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-amber-200/80 transition hover:border-amber-400/40 hover:bg-white/[0.08]"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
