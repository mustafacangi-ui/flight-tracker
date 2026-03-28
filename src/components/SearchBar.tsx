"use client";

import { useState } from "react";

type Props = {
  onSearch: (value: string) => void;
};

export default function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState("");

  const runSearch = () => {
    onSearch(value);
  };

  return (
    <div className="flex w-full flex-col gap-2 md:flex-row md:items-stretch md:gap-2">
      <input
        id="flight-code-search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") runSearch();
        }}
        placeholder="Airport code (e.g. IST, SAW, LHR)"
        className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white placeholder:text-gray-500 md:px-4 md:py-2"
      />

      <button
        type="button"
        onClick={runSearch}
        className="w-full shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 md:w-auto md:py-2"
      >
        Search
      </button>
    </div>
  );
}
