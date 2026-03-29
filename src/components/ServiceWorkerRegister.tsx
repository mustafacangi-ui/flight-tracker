"use client";

import { useEffect } from "react";

import { captureError } from "../lib/monitoring/captureError";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
    if (process.env.NODE_ENV !== "production" && !vapid) return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch((e) => {
      captureError(e, {
        area: "service_worker",
        extras: { summary: "register /sw.js failed" },
        level: "warning",
      });
    });
  }, []);

  return null;
}
