"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

import { useFlightTracking } from "../hooks/useFlightTracking";
import {
  FLIGHT_TRACKING_UPDATED_EVENT,
  getTrackingMeta,
  setNotificationsDisabledForFlight,
} from "../lib/flightTrackingStorage";
import { canEnableTrackingForFlight } from "../lib/premiumTier";
import {
  AnalyticsEvents,
  trackProductEvent,
} from "../lib/analytics/telemetry";
import { trackEvent } from "../lib/localAnalytics";
import { useUpgradeModal } from "./UpgradeModalProvider";

type Props = {
  flightNumber: string;
  className?: string;
  onOpenPrefs?: () => void;
};

export default function TrackFlightButton({
  flightNumber,
  className = "",
  onOpenPrefs,
}: Props) {
  const { isFlightTracked, setFlightTracked } = useFlightTracking();
  const { openUpgrade } = useUpgradeModal();
  const tracked = isFlightTracked(flightNumber);
  const [notifOff, setNotifOff] = useState(false);

  useEffect(() => {
    const sync = () => {
      setNotifOff(getTrackingMeta(flightNumber).notificationsDisabled ?? false);
    };
    sync();
    window.addEventListener(FLIGHT_TRACKING_UPDATED_EVENT, sync);
    return () => window.removeEventListener(FLIGHT_TRACKING_UPDATED_EVENT, sync);
  }, [flightNumber]);

  const label = !tracked
    ? "Track Flight"
    : notifOff
      ? "Notifications Off"
      : "Tracking Enabled";

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1.5 text-[11px] font-medium text-gray-200 backdrop-blur-sm transition duration-200 hover:border-white/18 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-[0.97] md:px-2.5 md:text-xs ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!tracked) {
          if (!canEnableTrackingForFlight(flightNumber)) {
            openUpgrade({ blockedFeature: "track_flight" });
            return;
          }
          setFlightTracked(flightNumber, true);
          trackProductEvent(AnalyticsEvents.flight_tracked, {
            flight_number: flightNumber,
            enabled: true,
          });
          trackEvent("track_flight_on");
          onOpenPrefs?.();
          return;
        }
        if (notifOff) {
          setNotificationsDisabledForFlight(flightNumber, false);
          return;
        }
        setFlightTracked(flightNumber, false);
        trackEvent("track_flight_off");
      }}
      aria-pressed={tracked}
    >
      <motion.span
        key={tracked ? (notifOff ? "muted" : "on") : "off"}
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className={
          notifOff
            ? "text-amber-200/80"
            : tracked
              ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.35)]"
              : "text-white/50"
        }
        aria-hidden
      >
        ◉
      </motion.span>
      <AnimatePresence mode="wait">
        <motion.span
          key={label}
          initial={{ opacity: 0, x: 4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.12 }}
          className="hidden sm:inline"
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
