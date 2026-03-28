"use client";

import { useCallback, useEffect, useState } from "react";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const INSTALL_PROMPT_DISMISS_KEY = "installFlightTrackerDismissed";

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(INSTALL_PROMPT_DISMISS_KEY) === "1");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hydrated || isStandaloneDisplayMode() || dismissed) return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, [dismissed, hydrated]);

  const promptInstall = useCallback(async () => {
    if (!deferred) return false;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      return choice.outcome === "accepted";
    } catch {
      setDeferred(null);
      return false;
    }
  }, [deferred]);

  const dismissInstallCard = useCallback(() => {
    try {
      localStorage.setItem(INSTALL_PROMPT_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
    setDeferred(null);
  }, []);

  return {
    /** `beforeinstallprompt` captured; browser can show native install UI. */
    canInstall: deferred != null,
    promptInstall,
    dismissInstallCard,
    dismissed,
    /** False on first paint until localStorage is read (avoid install UI flash). */
    hydrated,
  };
}
