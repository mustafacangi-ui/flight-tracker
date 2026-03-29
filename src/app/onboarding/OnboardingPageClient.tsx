"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import OnboardingCarousel, {
  type OnboardingCarouselSlide,
} from "../../components/onboarding/OnboardingCarousel";
import OnboardingSlide from "../../components/onboarding/OnboardingSlide";
import { usePwaInstallRequest } from "../../components/pwa/PwaInstallContext";
import { completeStoreOnboarding, isStoreOnboardingComplete } from "../../lib/storeOnboardingStorage";

function RadarVisual() {
  return (
    <div className="relative flex h-36 w-36 items-center justify-center sm:h-44 sm:w-44">
      <div className="absolute inset-0 rounded-full border border-sky-500/25 bg-sky-500/5" />
      <div className="absolute inset-3 rounded-full border border-sky-400/20" />
      <div className="absolute inset-8 rounded-full border border-emerald-400/30" />
      <div className="absolute h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
      <svg
        className="absolute inset-0 h-full w-full text-sky-400/40"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <line x1="50" y1="50" x2="50" y2="12" stroke="currentColor" strokeWidth="0.5" />
        <line x1="50" y1="50" x2="88" y2="50" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <span className="relative text-4xl" aria-hidden>
        ✈️
      </span>
    </div>
  );
}

function FamilyVisual() {
  return (
    <div className="flex items-center justify-center gap-2 text-5xl sm:text-6xl" aria-hidden>
      <span>👨‍👩‍👧</span>
      <span className="text-slate-600">→</span>
      <span className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-2xl">
        WA
      </span>
    </div>
  );
}

function PushVisual() {
  return (
    <div className="relative flex h-36 w-full max-w-xs items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-left shadow-xl backdrop-blur-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
          RouteWings
        </p>
        <p className="mt-1 text-sm font-medium text-white">Gate change — TK1</p>
        <p className="text-xs text-slate-400">Now boarding at A12</p>
      </div>
      <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
        1
      </span>
    </div>
  );
}

function PremiumVisual() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-600/30 to-indigo-900/40 px-6 py-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
          Pro
        </p>
        <p className="mt-1 text-lg font-bold text-white">Live map · Family</p>
      </div>
    </div>
  );
}

export default function OnboardingPageClient() {
  const router = useRouter();
  const { requestInstallCard } = usePwaInstallRequest();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (isStoreOnboardingComplete()) {
      router.replace("/");
    }
  }, [hydrated, router]);

  const finish = useCallback(() => {
    completeStoreOnboarding();
    requestInstallCard();
    router.push("/");
    router.refresh();
  }, [requestInstallCard, router]);

  const slides: OnboardingCarouselSlide[] = useMemo(
    () => [
      {
        key: "track",
        content: (
          <OnboardingSlide
            title="Real-time flight tracking"
            subtitle="Follow departures, arrivals, and aircraft movement with a live radar-style map when available."
            bullets={["Live board data for major airports", "Map view on supported flights"]}
            visual={<RadarVisual />}
          />
        ),
      },
      {
        key: "family",
        content: (
          <OnboardingSlide
            title="Family sharing"
            subtitle="Share a flight with people you trust. Send links that open straight in RouteWings or your chat apps."
            bullets={["Private family tracking links (Pro)", "Easy to share via WhatsApp and more"]}
            visual={<FamilyVisual />}
          />
        ),
      },
      {
        key: "push",
        content: (
          <OnboardingSlide
            title="Push notifications"
            subtitle="Turn on alerts for the flights you care about — delays, gate changes, and key status updates."
            bullets={["Gate and terminal updates where data allows", "Stay ahead when schedules shift"]}
            visual={<PushVisual />}
          />
        ),
      },
      {
        key: "premium",
        content: (
          <OnboardingSlide
            title="Premium features"
            subtitle="Unlock unlimited saved flights, live maps, family links, and deeper board tools with Pro."
            bullets={["Subscriptions via Stripe", "Cancel or manage anytime in your account flow"]}
            visual={<PremiumVisual />}
          />
        ),
      },
    ],
    []
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060a12] text-slate-500">
        Loading…
      </div>
    );
  }

  if (isStoreOnboardingComplete()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060a12] text-slate-500">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#060a12] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-1/4 top-0 h-[55%] w-[65%] rounded-full bg-blue-600/[0.08] blur-3xl" />
        <div className="absolute -left-1/4 bottom-0 h-1/2 w-2/3 rounded-full bg-sky-500/[0.06] blur-3xl" />
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <OnboardingCarousel
          slides={slides}
          onComplete={finish}
          completeLabel="Install & continue"
          nextLabel="Next"
          skipLabel="Skip"
        />
      </div>
    </div>
  );
}
