"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import MobileBottomNav from "./MobileBottomNav";
import MobileQuickFab from "./MobileQuickFab";

export default function MobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex min-h-full flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-0">
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
      </div>
      <MobileBottomNav />
      <MobileQuickFab />
    </>
  );
}
