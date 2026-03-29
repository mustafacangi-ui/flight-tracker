"use client";

import { motion } from "framer-motion";

import {
  AnalyticsEvents,
  trackProductEvent,
} from "../../lib/analytics/telemetry";
import type { BeforeInstallPromptEvent } from "../../lib/pwa/beforeInstallPromptEvent";

type Props = {
  iosHint: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onDismiss: () => void;
  onInstalled: () => void;
};

function PlaneIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8 42h18l28-22h16l-10 22h22l8-12h14l-6 18 6 18H94l-8-12H64l10 22H48L28 42H8v-12z"
        fill="url(#pwa-plane)"
        opacity={0.95}
      />
      <defs>
        <linearGradient id="pwa-plane" x1="8" y1="20" x2="112" y2="60">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function PwaInstallCard({
  iosHint,
  deferredPrompt,
  onDismiss,
  onInstalled,
}: Props) {
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    trackProductEvent(AnalyticsEvents.pwa_install_clicked, {
      surface: "coordinator_card",
    });
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        trackProductEvent(AnalyticsEvents.pwa_install_success, {
          surface: "coordinator_card",
        });
        onInstalled();
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div
      role="region"
      aria-label="Install app"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-blue-500/35 bg-slate-950/75 p-4 shadow-[0_0_40px_rgba(37,99,235,0.2),0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-sky-500/15 backdrop-blur-xl sm:rounded-3xl sm:p-5"
    >
      <div className="flex gap-3">
        <div className="hidden shrink-0 sm:block">
          <PlaneIllustration className="h-16 w-24" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-400/85">
                RouteWings
              </p>
              <h2 className="mt-1 text-base font-bold text-white sm:text-lg">
                Install the app
              </h2>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded-full p-1 text-slate-500 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {iosHint ? (
              <>
                On iPhone: tap{" "}
                <span className="font-semibold text-sky-200">Share</span>, then{" "}
                <span className="font-semibold text-sky-200">
                  Add to Home Screen
                </span>{" "}
                for an app-like experience and offline access to saved flights.
              </>
            ) : deferredPrompt ? (
              <>
                Add RouteWings to your home screen for quick launch, smoother
                navigation, and offline access to pages you&apos;ve opened before.
              </>
            ) : (
              <>
                In Chrome or Edge: open the{" "}
                <span className="font-semibold text-sky-200">⋮</span> menu and
                choose <span className="font-semibold text-sky-200">Install app</span>{" "}
                or watch for the install icon in the address bar. Saved flights
                stay available from device storage when you&apos;re offline.
              </>
            )}
          </p>
          {!iosHint && deferredPrompt ? (
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 py-3 text-sm font-bold text-white shadow-[0_10px_32px_rgba(37,99,235,0.35)] transition hover:brightness-110"
            >
              Install RouteWings
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
