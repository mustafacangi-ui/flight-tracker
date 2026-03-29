"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { isStoreOnboardingComplete } from "../../lib/storeOnboardingStorage";

/**
 * First visit to home: send users through `/onboarding` once (localStorage).
 */
export default function StoreOnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || pathname !== "/") return;
    if (isStoreOnboardingComplete()) return;
    router.replace("/onboarding");
  }, [hydrated, pathname, router]);

  return null;
}
