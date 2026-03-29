"use client";

import AnalyticsProvider from "./AnalyticsProvider";
import AppSplashScreen from "./AppSplashScreen";
import CapacitorNativeBridge from "./CapacitorNativeBridge";
import FeedbackFAB from "./FeedbackFAB";
import MobileShell from "./mobile/MobileShell";
import PwaInstallCoordinator from "./pwa/PwaInstallCoordinator";
import { PwaInstallProvider } from "./pwa/PwaInstallContext";
import ServiceWorkerRegister from "./ServiceWorkerRegister";
import RouteWingsOnboarding from "./RouteWingsOnboarding";
import PushPromotionHost from "./PushPromotionHost";
import SupabaseAuthListener from "./SupabaseAuthListener";
import { UpgradeModalProvider } from "./UpgradeModalProvider";

type Props = {
  children: React.ReactNode;
};

export default function ClientAppRoot({ children }: Props) {
  return (
    <PwaInstallProvider>
      <ServiceWorkerRegister />
      <AppSplashScreen>
        <UpgradeModalProvider>
          <AnalyticsProvider>
            <CapacitorNativeBridge />
            <SupabaseAuthListener />
            <MobileShell>{children}</MobileShell>
            <PushPromotionHost />
            <RouteWingsOnboarding />
            <FeedbackFAB />
          </AnalyticsProvider>
        </UpgradeModalProvider>
      </AppSplashScreen>
      <PwaInstallCoordinator />
    </PwaInstallProvider>
  );
}
