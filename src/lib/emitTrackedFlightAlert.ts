import { addAlertTimelineEntry } from "./alertHistoryStorage";
import { playAlertSoundIfEnabled } from "./alertSound";
import { showFlightBrowserNotification } from "./browserFlightNotify";
import {
  shouldDeliverBrowserNotification,
} from "./flightNotificationGuards";
import { getTrackingMeta } from "./flightTrackingStorage";
import { isWithinQuietHoursNow } from "./notificationGlobalSettings";
import { isFlightTracked } from "./flightTrackingStorage";
import { trackEvent } from "./localAnalytics";
import {
  type NotifyPrefKey,
  isNotifyEnabled,
} from "./savedFlightNotifyPrefs";

function kindToPref(
  kind:
    | "gate"
    | "delayed"
    | "boarding"
    | "departed"
    | "landed"
    | "cancelled"
    | "baggage"
    | "reminder1h"
    | "reminder30m"
    | "atGate"
): NotifyPrefKey {
  switch (kind) {
    case "gate":
      return "gateChanged";
    case "boarding":
      return "boardingStarts";
    case "delayed":
      return "delayed";
    case "departed":
      return "departed";
    case "landed":
      return "landed";
    case "atGate":
      return "arrivedAtGate";
    case "cancelled":
      return "cancelled";
    case "baggage":
      return "baggageClaim";
    case "reminder1h":
      return "beforeDeparture1h";
    case "reminder30m":
      return "beforeDeparture30m";
    default:
      return "delayed";
  }
}

function browserTitle(kind: string, flightNumber: string): string {
  const fn = flightNumber.trim().toUpperCase();
  switch (kind) {
    case "departed":
      return `${fn} has departed`;
    case "landed":
      return `${fn} has landed`;
    case "gate":
      return `${fn} gate change`;
    case "boarding":
      return `${fn} boarding`;
    case "delayed":
      return `${fn} delayed`;
    case "landing":
      return `${fn} landing soon`;
    default:
      return `Flight ${fn}`;
  }
}

/**
 * Timeline + optional browser notification + sound when flight is tracked and prefs allow.
 */
export function emitTrackedFlightAlert(opts: {
  flightNumber: string;
  text: string;
  kind:
    | "gate"
    | "delayed"
    | "boarding"
    | "departed"
    | "landed"
    | "cancelled"
    | "baggage"
    | "reminder1h"
    | "reminder30m"
    | "atGate";
}): void {
  const fn = opts.flightNumber.trim();
  if (!fn) return;
  if (!isFlightTracked(fn)) return;

  const meta = getTrackingMeta(fn);
  if (meta.notificationsDisabled) return;
  if (meta.snoozeUntil != null && Date.now() < meta.snoozeUntil) return;

  addAlertTimelineEntry({
    flightNumber: fn,
    text: opts.text,
    kind: opts.kind,
  });
  trackEvent("alert_emitted", { kind: opts.kind });

  const pref = kindToPref(opts.kind);
  if (!isNotifyEnabled(fn, pref)) return;

  const canPush = shouldDeliverBrowserNotification(fn);
  if (canPush) {
    showFlightBrowserNotification(
      browserTitle(opts.kind, fn),
      opts.text
    );
  }

  const allowSound =
    canPush &&
    !isWithinQuietHoursNow() &&
    typeof document !== "undefined" &&
    document.visibilityState === "visible";
  if (allowSound) {
    playAlertSoundIfEnabled();
  }
}
