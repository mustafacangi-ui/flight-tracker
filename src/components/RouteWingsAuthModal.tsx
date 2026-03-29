"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useState } from "react";

import { signInWithApple } from "../lib/auth/appleLogin";
import { captureError } from "../lib/monitoring/captureError";
import {
  AnalyticsEvents,
  trackProductEvent,
} from "../lib/analytics/telemetry";
import { getOAuthRedirectToClient } from "../lib/oauthRedirect";
import { createBrowserSupabaseClient } from "../lib/supabase/client";

type AuthMethod = "email" | "magic";

export type RouteWingsAuthPayload = {
  email: string;
  displayName: string;
  method: AuthMethod;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** After user completes auth form (terms + email). */
  onContinue?: (payload: RouteWingsAuthPayload) => void;
  /** Error from OAuth redirect query (e.g. cancelled sign-in). */
  oauthReturnError?: string | null;
  onDismissOauthReturnError?: () => void;
  /** Headline variant when opened from Login vs Sign Up. */
  intent?: "login" | "signup";
};

function OAuthButtonSpinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin text-slate-300 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5Z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.2 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2c-2.1 1.6-4.7 2.4-7.3 2.4-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.5 16.1 44 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.4 5.7-6.2 7.4l6.2 5.2C39 37.1 44 31.1 44 24c0-1.3-.1-2.3-.4-3.5Z"
      />
    </svg>
  );
}

/** Apple mark — monochrome on dark (align with Apple marketing guidelines). */
function AppleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-white"
      aria-hidden
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

type PushModalProps = {
  open: boolean;
  onClose: () => void;
  onEnable: () => void;
  onMaybeLater: () => void;
  permission: NotificationPermission | "unsupported";
};

function PushNotificationModal({
  open,
  onClose,
  onEnable,
  onMaybeLater,
  permission,
}: PushModalProps) {
  const titleId = useId();

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close notifications dialog"
            className="fixed inset-0 z-[210] bg-slate-950/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed left-1/2 top-1/2 z-[211] w-[min(92vw,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:w-[min(92vw,24rem)] sm:p-6"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15 ring-1 ring-sky-400/25">
                <svg
                  className="h-7 w-7 text-sky-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
            </div>
            <h2
              id={titleId}
              className="text-center text-lg font-semibold tracking-tight text-white"
            >
              Live flight alerts
            </h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-slate-400">
              Get notified in real time so you never miss a beat at the gate.
            </p>
            <ul className="mt-4 space-y-2.5 rounded-xl border border-slate-800/80 bg-slate-950/50 px-3 py-3 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-sky-400" aria-hidden>
                  ◆
                </span>
                Gate changes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-sky-400" aria-hidden>
                  ◆
                </span>
                Delays &amp; schedule updates
              </li>
              <li className="flex items-center gap-2">
                <span className="text-sky-400" aria-hidden>
                  ◆
                </span>
                Boarding started
              </li>
              <li className="flex items-center gap-2">
                <span className="text-sky-400" aria-hidden>
                  ◆
                </span>
                Landing updates
              </li>
            </ul>
            {permission !== "unsupported" ? (
              <p className="mt-3 text-center text-xs text-slate-500">
                Current permission:{" "}
                <span className="font-medium text-slate-400">{permission}</span>
              </p>
            ) : (
              <p className="mt-3 text-center text-xs text-amber-200/70">
                Notifications are not supported in this browser.
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={permission === "unsupported"}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                onClick={onEnable}
              >
                Enable notifications
              </button>
              <button
                type="button"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
                onClick={onMaybeLater}
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default function RouteWingsAuthModal({
  open,
  onClose,
  onContinue,
  oauthReturnError = null,
  onDismissOauthReturnError,
  intent = "signup",
}: Props) {
  const [method, setMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null
  );
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [pushOpen, setPushOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");

  const titleId = useId();

  const authBusy = oauthLoading !== null;

  useEffect(() => {
    if (open) {
      trackProductEvent(AnalyticsEvents.login_started, { intent });
    }
  }, [open, intent]);

  useEffect(() => {
    if (!open) {
      setPushOpen(false);
      setFormError(null);
      setOauthLoading(null);
      setOauthError(null);
      return;
    }
    if (typeof Notification === "undefined") {
      setNotifPermission("unsupported");
      return;
    }
    setNotifPermission(Notification.permission);
  }, [open, pushOpen]);

  const handleGoogleOAuth = useCallback(async () => {
    onDismissOauthReturnError?.();
    setOauthError(null);
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setOauthError(
        "Sign-in is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }
    setOauthLoading("google");
    trackProductEvent(AnalyticsEvents.google_login_clicked);
    try {
      const redirectTo = getOAuthRedirectToClient();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      let supabaseHost = "(unset)";
      try {
        if (supabaseUrl) supabaseHost = new URL(supabaseUrl).hostname;
      } catch {
        supabaseHost = "(invalid URL)";
      }
      console.log("[auth] signInWithOAuth start", {
        redirectTo,
        provider: "google",
        windowHref: window.location.href,
        windowHostname: window.location.hostname,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "(unset)",
        NEXT_PUBLIC_SUPABASE_HOST: supabaseHost,
      });
      console.log("[auth] google redirectTo", redirectTo);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        console.error("[auth] Google OAuth error", error.message);
        captureError(new Error(error.message), {
          area: "google_oauth",
          tags: { phase: "signInWithOAuth" },
        });
        setOauthError(error.message);
        setOauthLoading(null);
        return;
      }
      let providerUrlHost: string | null = null;
      if (data?.url) {
        try {
          providerUrlHost = new URL(data.url).hostname;
        } catch {
          providerUrlHost = "(parse error)";
        }
      }
      console.log("[auth] Google OAuth success → navigate to provider", {
        providerUrlHost,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      console.error("[auth] Google OAuth exception", e);
      captureError(e, {
        area: "google_oauth",
        tags: { phase: "exception" },
      });
      setOauthError(msg);
      setOauthLoading(null);
    }
  }, [onDismissOauthReturnError]);

  const handleAppleOAuth = useCallback(async () => {
    onDismissOauthReturnError?.();
    setOauthError(null);
    setOauthLoading("apple");
    trackProductEvent(AnalyticsEvents.apple_login_clicked);
    try {
      const result = await signInWithApple();
      if (!result.ok) {
        setOauthError(result.error);
        setOauthLoading(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      console.error("[auth] Apple OAuth exception", e);
      captureError(e, {
        area: "apple_oauth",
        tags: { phase: "exception" },
      });
      setOauthError(msg);
      setOauthLoading(null);
    }
  }, [onDismissOauthReturnError]);

  const handleContinue = useCallback(() => {
    if (authBusy) return;
    setFormError(null);
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (!agreed) {
      setFormError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }
    if (method === "magic") {
      trackProductEvent(AnalyticsEvents.magic_link_requested, {
        has_display_name: Boolean(displayName.trim()),
      });
    }
    onContinue?.({
      email: trimmed,
      displayName: displayName.trim(),
      method,
    });
    setPushOpen(true);
  }, [agreed, authBusy, displayName, email, method, onContinue]);

  const handleEnableNotifications = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    try {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
      if (result === "granted") {
        setPushOpen(false);
        onClose();
      }
    } catch {
      setNotifPermission(Notification.permission);
    }
  }, [onClose]);

  const handlePushMaybeLater = useCallback(() => {
    setPushOpen(false);
    onClose();
  }, [onClose]);

  const handleBackdropClose = useCallback(() => {
    if (pushOpen) return;
    onClose();
  }, [onClose, pushOpen]);

  return (
    <>
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[200] flex min-h-screen items-center justify-center bg-slate-950 p-4 sm:p-6">
            <motion.button
              type="button"
              aria-label="Close sign-in"
              className="absolute inset-0 bg-slate-950/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleBackdropClose}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative z-[201] w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-5 text-white shadow-2xl sm:p-8"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 6 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              <button
                type="button"
                onClick={() => {
                  setPushOpen(false);
                  onClose();
                }}
                className="absolute right-4 top-4 z-10 text-2xl leading-none text-slate-400 transition hover:text-white sm:right-5 sm:top-5"
                aria-label="Close"
              >
                ×
              </button>

              <div className="mb-5 pr-8 sm:mb-6">
                <h1
                  id={titleId}
                  className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
                >
                  {intent === "login"
                    ? "Welcome back"
                    : "Join RouteWings"}
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  {intent === "login"
                    ? "Sign in to sync saved flights, alerts, and family sharing across devices."
                    : "Save flights, get live alerts and share routes with your family."}
                </p>
              </div>

              <div className="relative mb-4 flex items-center justify-center sm:mb-5">
                <div className="absolute inset-x-0 border-t border-slate-700" />
                <span className="relative bg-slate-900 px-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-500 sm:text-sm sm:normal-case sm:tracking-normal sm:text-slate-500">
                  Continue with
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => void handleGoogleOAuth()}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-4 text-base font-medium transition hover:bg-slate-700 disabled:pointer-events-none disabled:opacity-45"
                >
                  {oauthLoading === "google" ? (
                    <OAuthButtonSpinner />
                  ) : (
                    <GoogleIcon />
                  )}
                  Google
                </button>

                <div>
                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={() => void handleAppleOAuth()}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black p-4 text-base font-medium text-white shadow-[0_0_24px_rgba(37,99,235,0.12)] ring-1 ring-white/5 transition hover:bg-neutral-950 hover:ring-white/10 disabled:pointer-events-none disabled:opacity-45"
                  >
                    {oauthLoading === "apple" ? (
                      <OAuthButtonSpinner className="h-5 w-5 text-white/80" />
                    ) : (
                      <AppleIcon />
                    )}
                    Apple
                  </button>
                  <p className="mt-2 px-1 text-center text-[11px] leading-snug text-slate-500 sm:text-xs">
                    Apple may hide your email address
                  </p>
                </div>
              </div>

              {oauthError || oauthReturnError ? (
                <p
                  className="mt-3 text-center text-xs leading-snug text-red-400/95"
                  role="alert"
                >
                  {oauthError || oauthReturnError}
                </p>
              ) : null}

              <div className="relative my-5 flex items-center justify-center sm:my-6">
                <div className="absolute inset-x-0 border-t border-slate-700" />
                <span className="relative bg-slate-900 px-4 text-sm text-slate-500">
                  or
                </span>
              </div>

              <div
                className="mb-5 grid grid-cols-2 gap-3"
                role="tablist"
                aria-label="Sign-in method"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === "email"}
                  disabled={authBusy}
                  onClick={() => {
                    if (authBusy) return;
                    setMethod("email");
                  }}
                  className={`rounded-2xl p-3 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-45 ${
                    method === "email"
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Email Login
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === "magic"}
                  disabled={authBusy}
                  onClick={() => {
                    if (authBusy) return;
                    setMethod("magic");
                  }}
                  className={`rounded-2xl p-3 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-45 ${
                    method === "magic"
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Magic Link
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="rw-auth-email"
                    className="mb-2 block text-sm text-slate-400"
                  >
                    Email address
                  </label>
                  <input
                    id="rw-auth-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3.5 text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 sm:py-4"
                  />
                </div>

                <div>
                  <label
                    htmlFor="rw-auth-name"
                    className="mb-2 block text-sm text-slate-400"
                  >
                    Display name
                  </label>
                  <input
                    id="rw-auth-name"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Mustafa"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3.5 text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 sm:py-4"
                  />
                </div>

                <div className="space-y-3 pt-1">
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-400">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 accent-white"
                    />
                    <span>
                      I agree to the Terms of Service and Privacy Policy
                    </span>
                  </label>
                </div>

                {formError ? (
                  <p className="text-sm text-amber-200/90" role="alert">
                    {formError}
                  </p>
                ) : null}

                <button
                  type="button"
                  disabled={authBusy}
                  onClick={handleContinue}
                  className="w-full rounded-2xl bg-blue-600 py-3.5 text-lg font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-45 sm:py-4"
                >
                  Continue to RouteWings ✈️
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <PushNotificationModal
        open={open && pushOpen}
        onClose={() => setPushOpen(false)}
        onEnable={handleEnableNotifications}
        onMaybeLater={handlePushMaybeLater}
        permission={notifPermission}
      />
    </>
  );
}
