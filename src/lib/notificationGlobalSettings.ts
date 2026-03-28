/**
 * Global alert sound + quiet hours (local time).
 */

import { loadTrackedFlightNumbers } from "./flightTrackingStorage";

export type AlertSoundMode = "silent" | "soft" | "airport";

export type GlobalNotificationSettings = {
  sound: AlertSoundMode;
  quietHoursEnabled: boolean;
  /** "HH:MM" 24h local */
  quietStart: string;
  quietEnd: string;
  /** When on, quiet hours are skipped while at least one flight is tracked */
  quietHoursDisableDuringTravel: boolean;
};

export const GLOBAL_NOTIFICATION_SETTINGS_KEY = "globalNotificationSettings";
export const GLOBAL_NOTIFICATION_SETTINGS_EVENT =
  "globalNotificationSettingsUpdated";

const DEFAULT: GlobalNotificationSettings = {
  sound: "soft",
  quietHoursEnabled: false,
  quietStart: "23:00",
  quietEnd: "07:00",
  quietHoursDisableDuringTravel: false,
};

function notify(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GLOBAL_NOTIFICATION_SETTINGS_EVENT));
}

export function loadGlobalNotificationSettings(): GlobalNotificationSettings {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(GLOBAL_NOTIFICATION_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT };
    const p = JSON.parse(raw) as Partial<GlobalNotificationSettings>;
    return {
      sound:
        p.sound === "silent" || p.sound === "soft" || p.sound === "airport"
          ? p.sound
          : DEFAULT.sound,
      quietHoursEnabled: Boolean(p.quietHoursEnabled),
      quietStart:
        typeof p.quietStart === "string" && /^\d{1,2}:\d{2}$/.test(p.quietStart)
          ? p.quietStart
          : DEFAULT.quietStart,
      quietEnd:
        typeof p.quietEnd === "string" && /^\d{1,2}:\d{2}$/.test(p.quietEnd)
          ? p.quietEnd
          : DEFAULT.quietEnd,
      quietHoursDisableDuringTravel: Boolean(
        p.quietHoursDisableDuringTravel ?? DEFAULT.quietHoursDisableDuringTravel
      ),
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveGlobalNotificationSettings(
  partial: Partial<GlobalNotificationSettings>
): void {
  if (typeof window === "undefined") return;
  const cur = loadGlobalNotificationSettings();
  localStorage.setItem(
    GLOBAL_NOTIFICATION_SETTINGS_KEY,
    JSON.stringify({ ...cur, ...partial })
  );
  notify();
}

function parseHm(s: string): number {
  const [h, m] = s.split(":").map((x) => parseInt(x, 10));
  return (h * 60 + m) % (24 * 60);
}

/** True if current **local** clock is inside quiet window (wraps midnight). */
export function isWithinQuietHoursNow(): boolean {
  const s = loadGlobalNotificationSettings();
  if (!s.quietHoursEnabled) return false;
  if (s.quietHoursDisableDuringTravel && loadTrackedFlightNumbers().length > 0) {
    return false;
  }
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const a = parseHm(s.quietStart);
  const b = parseHm(s.quietEnd);
  if (a === b) return false;
  if (a < b) return cur >= a && cur < b;
  return cur >= a || cur < b;
}
