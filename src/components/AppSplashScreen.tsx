"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

const SESSION_KEY = "flightAppSplashSeen";

type Props = {
  children: ReactNode;
};

export default function AppSplashScreen({ children }: Props) {
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        setSplash(false);
        return;
      }
    } catch {
      setSplash(false);
      return;
    }

    const minMs = 1200;
    const t0 = performance.now();

    const finish = () => {
      const wait = Math.max(0, minMs - (performance.now() - t0));
      window.setTimeout(() => {
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* ignore */
        }
        setSplash(false);
      }, wait);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }
  }, []);

  return (
    <div className="relative min-h-full">
      {children}
      <AnimatePresence>
        {splash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020817]"
            aria-busy="true"
            aria-label="Loading"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl"
              aria-hidden
            >
              ✈️
            </motion.div>
            <div
              className="mt-6 h-8 w-8 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500"
              aria-hidden
            />
            <p className="mt-6 text-sm text-gray-400">
              Loading live flights...
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
