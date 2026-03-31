"use client";

import { useEffect, useState } from "react";

import {
  APP_TOAST_EVENT,
  type AppToastPayload,
} from "../lib/appToast";

export default function AppToastHost() {
  const [toast, setToast] = useState<AppToastPayload | null>(null);

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<AppToastPayload>).detail;
      if (!d?.message) return;
      setToast(d);
      window.setTimeout(() => setToast(null), 3800);
    };
    window.addEventListener(APP_TOAST_EVENT, on);
    return () => window.removeEventListener(APP_TOAST_EVENT, on);
  }, []);

  if (!toast) return null;

  const border =
    toast.variant === "error"
      ? "border-rose-500/40 bg-rose-950/90 text-rose-50"
      : toast.variant === "warning"
        ? "border-amber-500/40 bg-amber-950/90 text-amber-50"
        : "border-emerald-500/35 bg-slate-950/95 text-emerald-50";

  return (
    <div
      role="status"
      className={`pointer-events-none fixed bottom-24 left-1/2 z-[80] max-w-[min(92vw,24rem)] -translate-x-1/2 rounded-2xl border px-4 py-3 text-center text-sm font-medium shadow-lg shadow-black/40 ${border}`}
    >
      {toast.message}
    </div>
  );
}
