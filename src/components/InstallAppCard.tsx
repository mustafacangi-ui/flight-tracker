"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

import {
  isStandaloneDisplayMode,
  useInstallPrompt,
} from "../hooks/useInstallPrompt";
import {
  AnalyticsEvents,
  trackProductEvent,
} from "../lib/analytics/telemetry";

export default function InstallAppCard() {
  const {
    canInstall,
    promptInstall,
    dismissInstallCard,
    dismissed,
    hydrated,
  } = useInstallPrompt();
  const promptShownLogged = useRef(false);

  useEffect(() => {
    if (
      hydrated &&
      canInstall &&
      !dismissed &&
      !isStandaloneDisplayMode() &&
      !promptShownLogged.current
    ) {
      promptShownLogged.current = true;
      trackProductEvent(AnalyticsEvents.pwa_install_prompt_shown, {
        surface: "home_install_card",
      });
    }
  }, [hydrated, canInstall, dismissed]);

  if (
    !hydrated ||
    isStandaloneDisplayMode() ||
    dismissed ||
    !canInstall
  ) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -2,
        boxShadow: "0 20px 56px rgba(59,130,246,0.12)",
        borderColor: "rgba(96,165,250,0.35)",
      }}
      className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_10px_36px_rgba(0,0,0,0.3)] backdrop-blur-md transition-colors duration-300"
      role="dialog"
      aria-labelledby="install-card-title"
    >
      <p
        id="install-card-title"
        className="text-sm font-semibold leading-snug text-white"
      >
        Install Flight Tracker
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
        Get faster access and live updates directly from your home screen.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            void (async () => {
              trackProductEvent(AnalyticsEvents.pwa_install_clicked, {
                surface: "home_install_card",
              });
              const ok = await promptInstall();
              if (ok) {
                trackProductEvent(AnalyticsEvents.pwa_install_success, {
                  surface: "home_install_card",
                });
              }
            })();
          }}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:flex-1"
        >
          Install App
        </button>
        <button
          type="button"
          onClick={dismissInstallCard}
          className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-medium text-gray-200 transition hover:bg-white/[0.08] sm:flex-1"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}
