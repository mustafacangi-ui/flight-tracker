"use client";

import { useEffect } from "react";

import {
  AnalyticsEvents,
  type AnalyticsEventName,
  trackProductEvent,
} from "../lib/analytics/telemetry";

export type TrackableAppPage =
  | "home"
  | "premium"
  | "live_track"
  | "family"
  | "saved";

const PAGE_EVENT: Record<TrackableAppPage, AnalyticsEventName> = {
  home: AnalyticsEvents.home_page_viewed,
  premium: AnalyticsEvents.premium_page_viewed,
  live_track: AnalyticsEvents.live_track_page_viewed,
  family: AnalyticsEvents.family_page_viewed,
  saved: AnalyticsEvents.saved_flights_page_viewed,
};

/**
 * Fire a single page-view product event on mount (PostHog when configured).
 */
export function useTrackPageView(
  page: TrackableAppPage,
  props?: Record<string, unknown>
): void {
  useEffect(() => {
    trackProductEvent(PAGE_EVENT[page], props);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: track once per mount
  }, [page]);
}
