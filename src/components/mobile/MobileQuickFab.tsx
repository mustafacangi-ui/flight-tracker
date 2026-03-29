"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { setScrollToSearchOnHome } from "../../lib/mobileNavSession";

export default function MobileQuickFab() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const goSearchAirport = useCallback(() => {
    setOpen(false);
    if (pathname === "/") {
      document.getElementById("mobile-search")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLInputElement>("#airport-search")
          ?.focus();
      });
    } else {
      setScrollToSearchOnHome();
      router.push("/");
    }
  }, [pathname, router]);

  const openSavedFlights = useCallback(() => {
    setOpen(false);
    router.push("/saved");
  }, [router]);

  const shareCurrent = useCallback(async () => {
    setOpen(false);
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = "Flight Tracker";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px)+0.5rem)] right-4 z-40 md:hidden"
      ref={panelRef}
    >
      {open ? (
        <div className="absolute bottom-14 right-0 flex w-56 flex-col gap-2 rounded-2xl border border-white/10 bg-gray-950/95 p-2 shadow-xl backdrop-blur-xl">
          <button
            type="button"
            onClick={goSearchAirport}
            className="rounded-xl px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/10"
          >
            Search Airport
          </button>
          <button
            type="button"
            onClick={openSavedFlights}
            className="rounded-xl px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/10"
          >
            Open Saved Flights
          </button>
          <button
            type="button"
            onClick={() => void shareCurrent()}
            className="rounded-xl px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/10"
          >
            Share Current Flight
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-blue-600 text-3xl font-light leading-none text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-95"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={open ? "Close quick actions" : "Quick actions"}
      >
        {open ? "×" : "+"}
      </button>
    </div>
  );
}
