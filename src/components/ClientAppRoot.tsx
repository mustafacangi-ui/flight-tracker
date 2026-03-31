"use client";

import { Suspense } from "react";

import AnalyticsProvider from "./AnalyticsProvider";
import AppSplashScreen from "./AppSplashScreen";
import CapacitorNativeBridge from "./CapacitorNativeBridge";
import MonitoringContextSync from "./MonitoringContextSync";
import OAuthReturnHandler from "./OAuthReturnHandler";
import FeedbackFAB from "./FeedbackFAB";
import MobileShell from "./mobile/MobileShell";
import PwaInstallCoordinator from "./pwa/PwaInstallCoordinator";
import { PwaInstallProvider } from "./pwa/PwaInstallContext";
import ServiceWorkerRegister from "./ServiceWorkerRegister";
import StoreOnboardingGate from "./onboarding/StoreOnboardingGate";
import RouteWingsOnboarding from "./RouteWingsOnboarding";
import PushPromotionHost from "./PushPromotionHost";
import AppToastHost from "./AppToastHost";
import PremiumEntitlementProvider from "./PremiumEntitlementProvider";
import SavedFlightsCloudSync from "./SavedFlightsCloudSync";
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
        <PremiumEntitlementProvider>
          <UpgradeModalProvider>
            <AnalyticsProvider>
              <CapacitorNativeBridge />
              <MonitoringContextSync />
              <StoreOnboardingGate />
              <SupabaseAuthListener />
              <SavedFlightsCloudSync />
              <AppToastHost />
              <Suspense fallback={null}>
                <OAuthReturnHandler />
              </Suspense>
              <MobileShell>{children}</MobileShell>
              <PushPromotionHost />
              <RouteWingsOnboarding />
              <FeedbackFAB />
            </AnalyticsProvider>
          </UpgradeModalProvider>
        </PremiumEntitlementProvider>
      </AppSplashScreen>
      <PwaInstallCoordinator />
    </PwaInstallProvider>
  );
}
