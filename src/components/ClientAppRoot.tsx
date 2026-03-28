"use client";

import AnalyticsProvider from "./AnalyticsProvider";
import AppSplashScreen from "./AppSplashScreen";
import FeedbackFAB from "./FeedbackFAB";
import MobileShell from "./mobile/MobileShell";
import ServiceWorkerRegister from "./ServiceWorkerRegister";
import RouteWingsOnboarding from "./RouteWingsOnboarding";
import SupabaseAuthListener from "./SupabaseAuthListener";
import { UpgradeModalProvider } from "./UpgradeModalProvider";

type Props = {
  children: React.ReactNode;
};

export default function ClientAppRoot({ children }: Props) {
  return (
    <>
      <ServiceWorkerRegister />
      <AppSplashScreen>
        <UpgradeModalProvider>
          <AnalyticsProvider>
            <SupabaseAuthListener />
            <MobileShell>{children}</MobileShell>
            <RouteWingsOnboarding />
            <FeedbackFAB />
          </AnalyticsProvider>
        </UpgradeModalProvider>
      </AppSplashScreen>
    </>
  );
}
