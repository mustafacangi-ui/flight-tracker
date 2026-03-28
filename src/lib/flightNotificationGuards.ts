import { getTrackingMeta } from "./flightTrackingStorage";
import { isWithinQuietHoursNow } from "./notificationGlobalSettings";

export function shouldDeliverBrowserNotification(flightNumber: string): boolean {
  const meta = getTrackingMeta(flightNumber);
  if (meta.notificationsDisabled) return false;
  if (meta.snoozeUntil != null && Date.now() < meta.snoozeUntil) return false;
  if (isWithinQuietHoursNow()) return false;
  return true;
}
