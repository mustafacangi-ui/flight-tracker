"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import SiteFooter from "../SiteFooter";
import MobileBottomNav from "./MobileBottomNav";
import MobileQuickFab from "./MobileQuickFab";

const FULL_BLEED_MOBILE_ROUTES = new Set([
  "/onboarding",
  "/privacy",
  "/terms",
]);

export default function MobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const fullBleedMobile =
    pathname != null && FULL_BLEED_MOBILE_ROUTES.has(pathname);

  return (
    <>
      <div
        className={
          fullBleedMobile
            ? "flex min-h-full flex-col md:pb-0"
            : "flex min-h-full flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom,0px)+0.5rem)] md:pb-0"
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <SiteFooter />
      </div>
      <MobileBottomNav />
      {fullBleedMobile ? null : <MobileQuickFab />}
    </>
  );
}
