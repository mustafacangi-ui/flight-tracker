"use client";

import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  AnalyticsEvents,
  trackProductEvent,
} from "../../lib/analytics/telemetry";
import {
  isBeforeInstallPromptEvent,
  type BeforeInstallPromptEvent,
} from "../../lib/pwa/beforeInstallPromptEvent";
import {
  isIosSafari,
  isStandaloneDisplay,
  PWA_STORAGE,
  readDismissed,
  writeDismissed,
} from "../../lib/pwa/pwaStorage";
import { usePwaInstallRequest } from "./PwaInstallContext";
import PwaFloatingInstallButton from "./PwaFloatingInstallButton";
import PwaInstallCard from "./PwaInstallCard";

function initialDismissed(key: string): boolean {
  if (typeof window === "undefined") return false;
  return readDismissed(key);
}

export default function PwaInstallCoordinator() {
  const { installCardNonce } = usePwaInstallRequest();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [cardDismissed, setCardDismissed] = useState(() =>
    initialDismissed(PWA_STORAGE.dismissInstallCard)
  );
  const [fabDismissed, setFabDismissed] = useState(() =>
    initialDismissed(PWA_STORAGE.dismissInstallFab)
  );
  const [forcedCard, setForcedCard] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const cardPromptLogged = useRef(false);
  const fabPromptLogged = useRef(false);

  useEffect(() => {
    setIos(isIosSafari());
    setStandalone(isStandaloneDisplay());
  }, []);

  useEffect(() => {
    if (installCardNonce > 0) setForcedCard(true);
  }, [installCardNonce]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onBip = (e: Event) => {
      if (!isBeforeInstallPromptEvent(e)) return;
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (standalone) return null;

  const canPrompt = Boolean(deferredPrompt) || ios;
  const showCard =
    (!cardDismissed || forcedCard) && (canPrompt || forcedCard);
  const showFab = canPrompt && !fabDismissed;

  useEffect(() => {
    if (showCard && !cardPromptLogged.current) {
      cardPromptLogged.current = true;
      trackProductEvent(AnalyticsEvents.pwa_install_prompt_shown, {
        surface: "coordinator_card",
      });
    }
  }, [showCard]);

  useEffect(() => {
    if (showFab && !fabPromptLogged.current) {
      fabPromptLogged.current = true;
      trackProductEvent(AnalyticsEvents.pwa_install_prompt_shown, {
        surface: "coordinator_fab",
      });
    }
  }, [showFab]);

  const dismissCard = useCallback(() => {
    writeDismissed(PWA_STORAGE.dismissInstallCard);
    setCardDismissed(true);
    setForcedCard(false);
  }, []);

  const dismissFab = useCallback(() => {
    writeDismissed(PWA_STORAGE.dismissInstallFab);
    setFabDismissed(true);
  }, []);

  const onInstalled = useCallback(() => {
    setDeferredPrompt(null);
    setForcedCard(false);
  }, []);

  const fabClick = useCallback(async () => {
    if (deferredPrompt) {
      trackProductEvent(AnalyticsEvents.pwa_install_clicked, {
        surface: "coordinator_fab",
      });
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          trackProductEvent(AnalyticsEvents.pwa_install_success, {
            surface: "coordinator_fab",
          });
          onInstalled();
        }
      } catch {
        /* ignore */
      }
      return;
    }
    setForcedCard(true);
    setCardDismissed(false);
  }, [deferredPrompt, onInstalled]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-center px-3 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px)+0.5rem)] md:pb-6">
        <AnimatePresence>
          {showCard ? (
            <div className="pointer-events-auto w-full max-w-lg">
              <PwaInstallCard
                iosHint={ios && !deferredPrompt}
                deferredPrompt={deferredPrompt}
                onDismiss={dismissCard}
                onInstalled={onInstalled}
              />
            </div>
          ) : null}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {showFab ? (
          <PwaFloatingInstallButton
            visible
            onClick={() => void fabClick()}
            onDismiss={dismissFab}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
