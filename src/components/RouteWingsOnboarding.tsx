"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  isOnboardingComplete,
  saveOnboardingComplete,
  type OnboardingPreferences,
} from "../lib/onboardingStorage";
import { recordRecentAirportSearch } from "../lib/recentSearchesStorage";

const SPLASH_SEEN_KEY = "flightAppSplashSeen";
const TOTAL_STEPS = 5;

const GOALS = [
  { id: "own", label: "Track my own flights" },
  { id: "family", label: "Track family flights" },
  { id: "airport_alerts", label: "Get airport alerts" },
  { id: "routes", label: "Save favorite routes" },
] as const;

const AIRPORTS = ["IST", "SAW", "FRA", "BER", "LHR", "DXB"] as const;

const NOTIFS = [
  { id: "delays", label: "Delays" },
  { id: "gate", label: "Gate changes" },
  { id: "boarding", label: "Boarding" },
  { id: "landing", label: "Landing" },
] as const;

function PlaneWatermark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
    >
      <path
        d="M60 20 L95 55 L75 58 L88 95 L68 98 L58 72 L42 72 L32 98 L12 95 L25 58 L5 55 Z"
        fill="currentColor"
        opacity="0.06"
      />
      <path
        d="M20 88 Q60 72 100 88"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.12"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SmallPlane({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  );
}

function toggleInSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export default function RouteWingsOnboarding() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<Set<string>>(new Set());
  const [airports, setAirports] = useState<Set<string>>(new Set());
  const [notifs, setNotifs] = useState<Set<string>>(new Set());

  useEffect(() => {
    setHydrated(true);
    if (isOnboardingComplete()) {
      setVisible(false);
      return;
    }
    const poll = window.setInterval(() => {
      try {
        if (sessionStorage.getItem(SPLASH_SEEN_KEY)) {
          setSplashDone(true);
          window.clearInterval(poll);
        }
      } catch {
        setSplashDone(true);
        window.clearInterval(poll);
      }
    }, 80);
    const fallback = window.setTimeout(() => {
      setSplashDone(true);
      window.clearInterval(poll);
    }, 2800);
    return () => {
      window.clearInterval(poll);
      window.clearTimeout(fallback);
    };
  }, []);

  const progress = (step + 1) / TOTAL_STEPS;

  const welcomeCopy = useMemo(() => {
    const codes = [...airports];
    const g = goals;
    const parts: string[] = [];
    if (g.has("family")) parts.push("stay close to family");
    if (g.has("own")) parts.push("own trips");
    if (g.has("airport_alerts")) parts.push("airport pulse");
    if (g.has("routes")) parts.push("favorite routes");
    const focus =
      parts.length > 0
        ? parts.slice(0, 2).join(" & ")
        : "every flight that matters to you";
    const apt =
      codes.length > 0
        ? ` We’ll highlight ${codes.slice(0, 3).join(", ")}${codes.length > 3 ? "…" : ""} on your board.`
        : " Pick an airport on the home screen whenever you’re ready.";
    return { focus, apt };
  }, [airports, goals]);

  const finish = useCallback(() => {
    const prefs: OnboardingPreferences = {
      goals: [...goals],
      airports: [...airports],
      notifications: [...notifs],
    };
    saveOnboardingComplete(prefs);
    for (const code of airports) {
      recordRecentAirportSearch(code);
    }
    try {
      localStorage.setItem(
        "flightApp_onboardingNotifPrefs",
        JSON.stringify([...notifs])
      );
    } catch {
      /* ignore */
    }
    setVisible(false);
    router.push("/");
    router.refresh();
  }, [airports, goals, notifs, router]);

  const next = useCallback(() => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else finish();
  }, [finish, step]);

  const back = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  if (!hydrated || !visible || !splashDone) return null;

  return (
    <div
      className="fixed inset-0 z-[125] flex flex-col bg-[#060a12] text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rw-onb-title"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-1/4 top-0 h-[60%] w-[70%] rounded-full bg-blue-600/[0.07] blur-3xl" />
        <div className="absolute -left-1/4 bottom-0 h-1/2 w-2/3 rounded-full bg-sky-500/[0.05] blur-3xl" />
        <PlaneWatermark className="absolute -right-8 bottom-8 h-48 w-48 text-white md:h-64 md:w-64" />
        <PlaneWatermark className="absolute left-4 top-24 h-32 w-32 -rotate-12 text-blue-400 md:left-12" />
      </div>

      <div className="relative px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <div className="mx-auto flex max-w-md items-center gap-3 pt-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400"
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
            />
          </div>
          <span className="text-[10px] font-semibold tabular-nums text-slate-500">
            {step + 1}/{TOTAL_STEPS}
          </span>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-1 flex-col"
            >
              {step === 0 ? (
                <>
                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 text-blue-400 shadow-inner ring-1 ring-white/10">
                      <SmallPlane className="h-8 w-8 -rotate-45" />
                    </div>
                    <h1
                      id="rw-onb-title"
                      className="text-2xl font-bold tracking-tight sm:text-3xl"
                    >
                      Welcome to RouteWings
                    </h1>
                    <p className="mt-3 max-w-[22rem] text-base leading-relaxed text-slate-400 sm:text-lg">
                      Track flights, save routes and stay connected with family
                    </p>
                  </div>
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <div className="pt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-400/90">
                      Your goals
                    </p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                      What do you want to do?
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Tap all that apply — we’ll shape your experience.
                    </p>
                  </div>
                  <div className="mt-6 flex flex-col gap-2.5">
                    {GOALS.map((g) => {
                      const on = goals.has(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setGoals((s) => toggleInSet(s, g.id))}
                          className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition sm:py-4 ${
                            on
                              ? "border-blue-500/50 bg-blue-600/15 text-white ring-1 ring-blue-500/25"
                              : "border-slate-700/90 bg-slate-900/40 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <div className="pt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-400/90">
                      Airports
                    </p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                      Which airports do you use most?
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      We’ll pin them to your recent searches.
                    </p>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {AIRPORTS.map((code) => {
                      const on = airports.has(code);
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() =>
                            setAirports((s) => toggleInSet(s, code))
                          }
                          className={`rounded-2xl border py-4 text-center text-base font-semibold tabular-nums transition ${
                            on
                              ? "border-blue-500/50 bg-blue-600/20 text-white ring-1 ring-blue-500/30"
                              : "border-slate-700/90 bg-slate-900/40 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          {code}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <div className="pt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-400/90">
                      Alerts
                    </p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                      What should we notify you about?
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Choose the moments you care about most.
                    </p>
                  </div>
                  <div className="mt-6 flex flex-col gap-2.5">
                    {NOTIFS.map((n) => {
                      const on = notifs.has(n.id);
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setNotifs((s) => toggleInSet(s, n.id))}
                          className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${
                            on
                              ? "border-blue-500/50 bg-blue-600/15 text-white ring-1 ring-blue-500/25"
                              : "border-slate-700/90 bg-slate-900/40 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          {n.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {step === 4 ? (
                <>
                  <div className="flex flex-1 flex-col justify-center">
                    <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                      <SmallPlane className="h-7 w-7 -rotate-45" />
                    </div>
                    <h2 className="text-center text-xl font-bold tracking-tight sm:text-2xl">
                      Welcome to RouteWings
                    </h2>
                    <p className="mx-auto mt-3 max-w-[24rem] text-center text-sm font-medium text-slate-300">
                      You&apos;re all set — your experience is tailored for you.
                    </p>
                    <p className="mx-auto mt-4 max-w-[24rem] text-center text-base leading-relaxed text-slate-400">
                      We&apos;ll help you with{" "}
                      <span className="font-medium text-slate-200">
                        {welcomeCopy.focus}
                      </span>
                      .
                      {welcomeCopy.apt}
                    </p>
                  </div>
                </>
              ) : null}
            </motion.div>
          </AnimatePresence>

          <div className="mt-auto flex flex-col gap-3 pt-6">
            {step > 0 ? (
              <button
                type="button"
                onClick={back}
                className="self-start text-sm font-medium text-slate-500 transition hover:text-slate-300"
              >
                ← Back
              </button>
            ) : null}
            <motion.button
              type="button"
              onClick={next}
              layout
              className="w-full rounded-2xl bg-blue-600 py-4 text-base font-semibold text-white shadow-lg shadow-blue-950/35 transition hover:bg-blue-500 active:scale-[0.99]"
            >
              {step === TOTAL_STEPS - 1
                ? "Start Tracking Flights"
                : "Continue"}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
