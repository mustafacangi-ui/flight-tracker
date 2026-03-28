"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useState } from "react";

const EXAMPLE_ALERTS = [
  { title: "TK1234 delayed by 20 min", body: "New estimated departure 14:40" },
  { title: "Gate changed to B16", body: "Turkish Airlines · Istanbul" },
  { title: "Boarding started", body: "TK1234 · Group 1 now boarding" },
  { title: "Flight landed safely", body: "Welcome home — baggage at carousel 4" },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called after browser permission prompt (default: request + optional close). */
  onEnable?: (permission: NotificationPermission) => void;
  onMaybeLater?: () => void;
};

function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  );
}

function IosStyleNotificationRow({
  title,
  body,
  delay,
}: {
  title: string;
  body: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 shadow-lg shadow-black/20 backdrop-blur-xl"
    >
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/25 text-blue-300 ring-1 ring-blue-500/30">
          <PlaneIcon className="h-4 w-4 -rotate-45" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              RouteWings
            </p>
            <span className="shrink-0 text-[10px] text-slate-500">now</span>
          </div>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-white">
            {title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{body}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function RouteWingsPushNotificationModal({
  open,
  onClose,
  onEnable,
  onMaybeLater,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );

  useEffect(() => {
    if (!open) return;
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, [open]);

  const handleEnable = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    if (onEnable) {
      const result =
        Notification.permission === "granted"
          ? "granted"
          : (await Notification.requestPermission());
      onEnable(result);
      setPermission(result);
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") onClose();
    } catch {
      setPermission(Notification.permission);
    }
  }, [onClose, onEnable]);

  const handleMaybeLater = useCallback(() => {
    onMaybeLater?.();
    onClose();
  }, [onClose, onMaybeLater]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-[210] bg-slate-950/75 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="fixed left-1/2 top-1/2 z-[211] w-[min(100vw-1.25rem,22.5rem)] -translate-x-1/2 -translate-y-1/2 sm:w-[min(100vw-2rem,24rem)]"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-700/80 bg-slate-900/95 shadow-[0_32px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-600/[0.07] to-transparent" />

              <div className="relative px-5 pb-6 pt-7 sm:px-6 sm:pb-7 sm:pt-8">
                <div className="mx-auto mb-5 flex w-full max-w-[5.5rem] flex-col items-center">
                  <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-slate-800 to-slate-950 text-blue-400 shadow-inner shadow-black/40 ring-1 ring-white/10">
                    <PlaneIcon className="h-9 w-9 -rotate-45" />
                  </div>
                </div>

                <h2
                  id={titleId}
                  className="text-center text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]"
                >
                  Never Miss a Flight Update
                </h2>
                <p
                  id={descId}
                  className="mx-auto mt-2 max-w-[20rem] text-center text-sm leading-relaxed text-slate-400"
                >
                  Get instant alerts for delays, gate changes, boarding and
                  landing updates
                </p>

                <div className="mt-6 space-y-2.5">
                  {EXAMPLE_ALERTS.map((n, i) => (
                    <IosStyleNotificationRow
                      key={n.title}
                      title={n.title}
                      body={n.body}
                      delay={0.06 * i}
                    />
                  ))}
                </div>

                {permission !== "unsupported" && permission !== "default" ? (
                  <p className="mt-4 text-center text-xs text-slate-500">
                    Notifications:{" "}
                    <span className="font-medium text-slate-400">{permission}</span>
                  </p>
                ) : null}
                {permission === "unsupported" ? (
                  <p className="mt-4 text-center text-xs text-amber-200/80">
                    Notifications aren&apos;t supported in this browser.
                  </p>
                ) : null}

                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    type="button"
                    disabled={permission === "unsupported"}
                    onClick={() => void handleEnable()}
                    className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/35 transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Enable Notifications
                  </button>
                  <button
                    type="button"
                    onClick={handleMaybeLater}
                    className="w-full rounded-2xl border border-slate-600/90 bg-slate-800/50 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                  >
                    Maybe Later
                  </button>
                </div>

                <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
                  You can disable notifications anytime
                </p>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
