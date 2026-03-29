"use client";

import { useTrackPageView } from "../../hooks/useTrackPageView";

/** Client mount helper for server-rendered family page analytics. */
export default function FamilyPageViewTracker() {
  useTrackPageView("family");
  return null;
}
