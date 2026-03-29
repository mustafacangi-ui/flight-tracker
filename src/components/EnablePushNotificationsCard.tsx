"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { urlBase64ToUint8Array } from "../lib/pushClient";
import { ROUTE_WINGS_SESSION_EVENT } from "../lib/routeWingsSessionStorage";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "../lib/supabase/client";
import {
  AnalyticsEvents,
  trackProductEvent,
} from "../lib/analytics/telemetry";
import NotificationPreferencesModal from "./NotificationPreferencesModal";

type Props = {
  variant?: "inline" | "floating";
  onDismiss?: () => void;
  className?: string;
};

export default function EnablePushNotificationsCard({
  variant = "inline",
  onDismiss,
  className = "",
}: Props) {
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";

  const refreshAuth = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setSignedIn(false);
      return;
    }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setSignedIn(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setSignedIn(Boolean(user));
  }, []);

  useEffect(() => {
    void refreshAuth();
    window.addEventListener(ROUTE_WINGS_SESSION_EVENT, refreshAuth);
    const id = window.setInterval(refreshAuth, 8000);
    const supabase = createBrowserSupabaseClient();
    const authListener = supabase?.auth.onAuthStateChange(() => {
      void refreshAuth();
    });
    return () => {
      window.removeEventListener(ROUTE_WINGS_SESSION_EVENT, refreshAuth);
      window.clearInterval(id);
      authListener?.data.subscription.unsubscribe();
    };
  }, [refreshAuth]);

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.ready.then((reg) => {
      void reg.pushManager.getSubscription().then((s) => {
        setSubscribed(Boolean(s));
      });
    });
  }, [permission]);

  const ensureServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!("serviceWorker" in navigator)) return null;
    try {
      return await navigator.serviceWorker.register("/sw.js");
    } catch {
      return null;
    }
  };

  const enablePush = async () => {
    setError(null);
    setTestMsg(null);
    if (!vapidPublic) {
      setError("VAPID public key is not configured (NEXT_PUBLIC_VAPID_PUBLIC_KEY).");
      return;
    }
    if (!signedIn) {
      setError("Sign in with Google to enable push on this device.");
      return;
    }
    if (permission === "unsupported") {
      setError("Notifications are not supported in this browser.");
      return;
    }
    setBusy(true);
    try {
      const p =
        permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;
      setPermission(p);
      if (p !== "granted") {
        setError("Notification permission was not granted.");
        setBusy(false);
        return;
      }
      const reg = await ensureServiceWorker();
      if (!reg) {
        setError("Could not register the service worker.");
        setBusy(false);
        return;
      }
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            vapidPublic
          ) as BufferSource,
        });
      }
      const json = sub.toJSON();
      if (!json.keys?.p256dh || !json.keys?.auth) {
        setError("Invalid push subscription keys.");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: json }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || res.statusText);
      }
      setSubscribed(true);
      trackProductEvent(AnalyticsEvents.push_notifications_enabled, {
        variant,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Subscribe failed.");
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setTestMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const j = (await res.json()) as { sent?: number; error?: string };
      if (!res.ok) throw new Error(j.error || res.statusText);
      setTestMsg(`Sent ${j.sent ?? 0} notification(s).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Test failed.");
    } finally {
      setBusy(false);
    }
  };

  const wrapper =
    variant === "floating"
      ? "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 right-3 z-[190] mx-auto max-w-md sm:left-1/2 sm:right-auto sm:w-full sm:-translate-x-1/2"
      : "";

  if (!isSupabaseConfigured()) {
    return null;
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl transition duration-300 hover:border-blue-500/35 hover:shadow-[0_20px_50px_rgba(59,130,246,0.18)] sm:rounded-2xl sm:p-5 ${wrapper} ${className}`.trim()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/30 to-sky-500/20 text-lg shadow-inner ring-1 ring-blue-400/25">
            🔔
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold tracking-tight text-white sm:text-base">
              Flight alerts
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Get gate changes, delays, and boarding updates for saved and tracked
              flights — even when the app is in the background.
            </p>
            {!signedIn ? (
              <p className="mt-2 text-xs font-medium text-amber-200/90">
                Sign in with Google to sync push subscriptions to your account.
              </p>
            ) : null}
            {!vapidPublic ? (
              <p className="mt-2 text-xs text-slate-500">
                Add{" "}
                <code className="rounded bg-black/30 px-1 py-0.5 text-[10px]">
                  NEXT_PUBLIC_VAPID_PUBLIC_KEY
                </code>{" "}
                to enable web push.
              </p>
            ) : null}
            {error ? (
              <p className="mt-2 text-xs text-red-400/95" role="alert">
                {error}
              </p>
            ) : null}
            {testMsg ? (
              <p className="mt-2 text-xs text-emerald-300/90">{testMsg}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || subscribed || permission === "denied"}
                onClick={() => void enablePush()}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_24px_rgba(37,99,235,0.4)] transition hover:from-blue-500 hover:to-sky-400 disabled:pointer-events-none disabled:opacity-40 sm:text-sm"
              >
                {subscribed ? "Push enabled" : "Enable notifications"}
              </button>
              <button
                type="button"
                disabled={!signedIn}
                onClick={() => setPrefsOpen(true)}
                className="rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/[0.08] disabled:opacity-40 sm:text-sm"
              >
                Preferences
              </button>
              <button
                type="button"
                disabled={busy || !subscribed}
                onClick={() => void sendTest()}
                className="rounded-xl border border-sky-500/35 bg-sky-500/10 px-4 py-2.5 text-xs font-semibold text-sky-100 transition hover:border-sky-400/50 hover:bg-sky-500/15 disabled:opacity-40 sm:text-sm"
              >
                Send test
              </button>
              {variant === "floating" && onDismiss ? (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="ml-auto rounded-xl px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
                >
                  Dismiss
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>

      <NotificationPreferencesModal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
      />
    </>
  );
}
