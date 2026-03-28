"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

import { setScrollToSearchOnHome } from "../../lib/mobileNavSession";

type TabId = "search" | "saved" | "alerts" | "share";

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "search", label: "Search", icon: "🔍" },
  { id: "saved", label: "Saved", icon: "★" },
  { id: "alerts", label: "Alerts", icon: "🔔" },
  { id: "share", label: "Share", icon: "↗" },
];

function scrollToId(id: string) {
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isFlightPage = pathname?.startsWith("/flight/") ?? false;

  const goSearch = useCallback(() => {
    if (pathname === "/") {
      scrollToId("mobile-search");
      document.getElementById("flight-code-search")?.focus();
    } else {
      setScrollToSearchOnHome();
      router.push("/");
    }
  }, [pathname, router]);

  const goSaved = useCallback(() => {
    router.push("/saved");
  }, [router]);

  const goAlerts = useCallback(() => {
    if (isFlightPage) {
      scrollToId("flight-alerts");
      return;
    }
    router.push("/alerts");
  }, [isFlightPage, router]);

  const doShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = "Flight Tracker";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled or error */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  }, []);

  const onTab = (id: TabId) => {
    switch (id) {
      case "search":
        goSearch();
        break;
      case "saved":
        goSaved();
        break;
      case "alerts":
        goAlerts();
        break;
      case "share":
        void doShare();
        break;
      default:
        break;
    }
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden"
      aria-label="Main"
    >
      <div className="rounded-t-3xl border-t border-white/10 bg-gray-950/80 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div
          className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-1.5 pt-2"
          style={{
            paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTab(t.id)}
              aria-label={t.label}
              className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium text-gray-400 outline-none transition duration-200 hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-cyan-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-[0.97] active:bg-white/[0.06]"
            >
              <span className="text-lg leading-none" aria-hidden>
                {t.icon}
              </span>
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
