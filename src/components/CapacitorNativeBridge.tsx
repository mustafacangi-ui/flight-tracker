"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { routewingsDeepLinkToPath } from "../lib/capacitor/deepLink";
import { captureError } from "../lib/monitoring/captureError";

export default function CapacitorNativeBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const navigateFromUrl = (url: string) => {
      const path = routewingsDeepLinkToPath(url);
      if (path) router.push(path);
    };

    void SplashScreen.hide().catch(() => {
      /* ignore */
    });

    void StatusBar.setStyle({ style: Style.Dark }).catch(() => {
      /* ignore */
    });
    void StatusBar.setBackgroundColor({ color: "#0f172a" }).catch(() => {
      /* ignore */
    });

    let listener: { remove: () => Promise<void> } | undefined;

    void App.getLaunchUrl()
      .then((res) => {
        if (res?.url) navigateFromUrl(res.url);
      })
      .catch((e) => {
        captureError(e, {
          area: "deep_link_parse",
          tags: { phase: "getLaunchUrl" },
          level: "warning",
        });
      });

    void App.addListener("appUrlOpen", ({ url }) => {
      navigateFromUrl(url);
    }).then((handle) => {
      listener = handle;
    });

    return () => {
      void listener?.remove();
    };
  }, [router]);

  return null;
}
