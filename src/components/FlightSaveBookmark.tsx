"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

import { useSavedFlights } from "../hooks/useSavedFlights";
import { usePremiumFlag } from "../hooks/usePremiumFlag";
import { useUpgradeModal } from "./UpgradeModalProvider";
import {
  AnalyticsEvents,
  trackProductEvent,
} from "../lib/analytics/telemetry";
import { showAppToast } from "../lib/appToast";
import { trackEvent } from "../lib/localAnalytics";
import { dispatchFlightSavedEvent } from "../lib/pushEvents";
import { canAddSavedFlight } from "../lib/premiumTier";
import { savedFlightIdentityKey } from "../lib/savedFlightIdentity";
import {
  isSavedFlightInList,
  removeSavedFlightByIdentity,
  toggleSavedFlight,
  upsertSavedFlight,
  type SavedFlight,
} from "../lib/quickAccessStorage";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "../lib/supabase/client";

type Props = {
  payload: SavedFlight;
  className?: string;
};

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

export default function FlightSaveBookmark({ payload, className = "" }: Props) {
  const { savedFlights, refresh } = useSavedFlights();
  const { openUpgrade } = useUpgradeModal();
  const premium = usePremiumFlag();
  const [busy, setBusy] = useState(false);
  const saved = isSavedFlightInList(payload, savedFlights);

  return (
    <button
      type="button"
      disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1.5 text-[11px] font-medium text-gray-200 backdrop-blur-sm transition duration-200 hover:border-white/18 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-[0.97] md:px-2.5 md:text-xs disabled:opacity-60 ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void (async () => {
          if (busy) return;

          const supabase =
            isSupabaseConfigured() ? createBrowserSupabaseClient() : null;
          const {
            data: { user },
          } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

          const atLimit =
            !saved &&
            !premium &&
            !canAddSavedFlight(savedFlights.length, false);

          if (atLimit) {
            openUpgrade({ blockedFeature: "saved_flights_limit" });
            return;
          }

          if (user) {
            setBusy(true);
            try {
              if (saved) {
                const match = savedFlights.find(
                  (x) =>
                    savedFlightIdentityKey(x) === savedFlightIdentityKey(payload)
                );
                if (match?.serverId) {
                  const res = await fetch(
                    `/api/saved-flights?id=${encodeURIComponent(match.serverId)}`,
                    { method: "DELETE", credentials: "same-origin" }
                  );
                  if (!res.ok) {
                    showAppToast({
                      message: "Could not remove saved flight",
                      variant: "error",
                    });
                    return;
                  }
                  console.log("[saved-flights] delete success (bookmark)");
                }
                removeSavedFlightByIdentity(match ?? payload);
                refresh();
                showAppToast({
                  message: "Removed from saved flights",
                  variant: "success",
                });
                trackProductEvent(AnalyticsEvents.flight_unsaved, {
                  flight_number: payload.flightNumber,
                });
              } else {
                const res = await fetch("/api/saved-flights", {
                  method: "POST",
                  credentials: "same-origin",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                if (res.status === 409) {
                  console.log("[saved-flights] duplicate prevented (bookmark)");
                  showAppToast({
                    message: "This flight is already in your saved list",
                    variant: "warning",
                  });
                  return;
                }
                if (res.status === 403) {
                  const j = (await res.json()) as { code?: string };
                  if (j.code === "FREE_LIMIT") {
                    console.log("[saved-flights] free limit reached (bookmark)");
                    openUpgrade({ blockedFeature: "saved_flights_limit" });
                    return;
                  }
                  showAppToast({
                    message: "Could not save flight",
                    variant: "error",
                  });
                  return;
                }
                if (!res.ok) {
                  showAppToast({
                    message: "Could not save flight",
                    variant: "error",
                  });
                  return;
                }
                const body = (await res.json()) as { flight?: SavedFlight };
                if (body.flight) {
                  upsertSavedFlight(body.flight);
                  refresh();
                }
                console.log("[saved-flights] insert success (bookmark)");
                showAppToast({ message: "Flight saved", variant: "success" });
                trackProductEvent(AnalyticsEvents.flight_saved, {
                  flight_number: payload.flightNumber,
                });
                trackEvent("save_flight", { flightNumber: payload.flightNumber });
                dispatchFlightSavedEvent();
              }
            } finally {
              setBusy(false);
            }
            return;
          }

          const { saved: nowSaved } = toggleSavedFlight(payload);
          refresh();
          if (nowSaved) {
            trackProductEvent(AnalyticsEvents.flight_saved, {
              flight_number: payload.flightNumber,
            });
            trackEvent("save_flight", { flightNumber: payload.flightNumber });
            dispatchFlightSavedEvent();
            showAppToast({ message: "Flight saved", variant: "success" });
          } else {
            trackProductEvent(AnalyticsEvents.flight_unsaved, {
              flight_number: payload.flightNumber,
            });
            showAppToast({
              message: "Removed from saved flights",
              variant: "success",
            });
          }
        })();
      }}
      aria-pressed={saved}
      aria-label={saved ? "Saved — tap to remove" : "Save flight"}
    >
      <motion.span
        key={saved ? "on" : "off"}
        initial={{ scale: 0.82, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        className={
          saved
            ? "text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.35)]"
            : "text-white/45 hover:text-amber-200/70"
        }
      >
        <BookmarkIcon filled={saved} />
      </motion.span>
      <AnimatePresence mode="wait">
        <motion.span
          key={saved ? "saved" : "save"}
          initial={{ opacity: 0, x: 4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.15 }}
          className="hidden sm:inline"
        >
          {saved ? "Saved" : "Save Flight"}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
