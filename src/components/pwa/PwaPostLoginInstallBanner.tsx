"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import {
  getRouteWingsSession,
  ROUTE_WINGS_SESSION_EVENT,
} from "../../lib/routeWingsSessionStorage";
import {
  isStandaloneDisplay,
  PWA_STORAGE,
  readDismissed,
  writeDismissed,
} from "../../lib/pwa/pwaStorage";
import { usePwaInstallRequest } from "./PwaInstallContext";

export default function PwaPostLoginInstallBanner() {
  const { requestInstallCard } = usePwaInstallRequest();
  const [loggedIn, setLoggedIn] = useState(false);
  const [dismissed, setDismissed] = useState(() =>
    typeof window !== "undefined"
      ? readDismissed(PWA_STORAGE.dismissPostLoginBanner)
      : false
  );
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
  }, []);

  useEffect(() => {
    const sync = () => setLoggedIn(Boolean(getRouteWingsSession()));
    sync();
    window.addEventListener(ROUTE_WINGS_SESSION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ROUTE_WINGS_SESSION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const dismiss = useCallback(() => {
    writeDismissed(PWA_STORAGE.dismissPostLoginBanner);
    setDismissed(true);
  }, []);

  if (standalone || dismissed || !loggedIn) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-blue-500/20 bg-slate-950/90 px-3 py-2.5 shadow-[0_8px_32px_rgba(37,99,235,0.12)] backdrop-blur-md sm:px-4"
    >
      <div className="mx-auto flex max-w-[600px] flex-wrap items-center justify-between gap-2 sm:flex-nowrap">
        <p className="min-w-0 flex-1 text-xs leading-snug text-slate-300 sm:text-sm">
          <span className="font-semibold text-sky-200/95">Install RouteWings</span>{" "}
          for a faster app-like experience.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              requestInstallCard();
            }}
            className="rounded-xl border border-blue-500/40 bg-blue-600/25 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600/40"
          >
            How to install
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:text-slate-300"
            aria-label="Dismiss install reminder"
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
}
