import type { User } from "@supabase/supabase-js";

import {
  clearRouteWingsSession,
  setRouteWingsSession,
} from "./routeWingsSessionStorage";

function displayNameFromUser(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fromMeta =
    (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta?.name === "string" && meta.name.trim()) ||
    (typeof meta?.display_name === "string" && meta.display_name.trim()) ||
    "";
  if (fromMeta) return fromMeta;
  const email = user.email?.trim();
  if (email) return email.split("@")[0] || "Traveler";
  return "Traveler";
}

/** Persist Supabase user to existing RouteWings header session shape. */
export function applySupabaseUserToRouteWingsSession(user: User): void {
  const email = user.email?.trim();
  if (!email) return;
  setRouteWingsSession({
    email,
    displayName: displayNameFromUser(user),
  });
}
