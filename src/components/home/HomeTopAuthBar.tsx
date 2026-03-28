"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import RouteWingsAuthModal from "../RouteWingsAuthModal";
import { useUpgradeModal } from "../UpgradeModalProvider";
import {
  clearRouteWingsSession,
  getRouteWingsSession,
  ROUTE_WINGS_SESSION_EVENT,
  setRouteWingsSession,
  type RouteWingsSession,
} from "../../lib/routeWingsSessionStorage";

type AuthIntent = "login" | "signup";

function initials(session: RouteWingsSession): string {
  const n = session.displayName?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0][0];
      const b = parts[1][0];
      if (a && b) return (a + b).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  return session.email.slice(0, 2).toUpperCase();
}

function ProfileIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function HomeTopAuthBar() {
  const menuId = useId();
  const { openUpgrade } = useUpgradeModal();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<RouteWingsSession | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<AuthIntent>("signup");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setSession(getRouteWingsSession());
    const sync = () => setSession(getRouteWingsSession());
    window.addEventListener(ROUTE_WINGS_SESSION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ROUTE_WINGS_SESSION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const openAuth = useCallback((intent: AuthIntent) => {
    setAuthIntent(intent);
    setAuthOpen(true);
    setMenuOpen(false);
  }, []);

  const handleAuthContinue = useCallback(
    (payload: { email: string; displayName: string }) => {
      setRouteWingsSession({
        email: payload.email,
        displayName:
          payload.displayName.trim() ||
          payload.email.split("@")[0] ||
          "Traveler",
      });
    },
    []
  );

  const logout = useCallback(() => {
    clearRouteWingsSession();
    setMenuOpen(false);
  }, []);

  const loggedIn = Boolean(session);

  return (
    <>
      <header className="sticky top-0 z-40 mb-4 w-full border-b border-white/[0.06] bg-gray-950/85 backdrop-blur-xl sm:mb-5">
        <div className="mx-auto flex w-full max-w-[600px] items-center justify-between gap-3 px-3 py-3 sm:px-6">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-xl py-1 pr-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/25 bg-gradient-to-br from-slate-800/90 to-slate-950 text-base shadow-inner ring-1 ring-white/5 transition group-hover:border-cyan-400/40"
                aria-hidden
              >
                ✈
              </span>
              <span className="text-sm font-bold tracking-tight text-white transition group-hover:text-cyan-100/95 sm:text-base">
                RouteWings
              </span>
            </Link>
          </motion.div>

          <div className="flex shrink-0 items-center gap-2" ref={wrapRef}>
            {!loggedIn ? (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openAuth("login")}
                    className="rounded-xl border border-white/28 bg-black/35 px-4 py-2 text-sm font-semibold text-gray-100 shadow-inner shadow-black/30 transition hover:border-white/45 hover:bg-black/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                  >
                    Login
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openAuth("signup")}
                    className="rounded-xl border border-blue-400/45 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(37,99,235,0.45)] ring-1 ring-blue-400/25 transition hover:border-sky-300/55 hover:from-blue-500 hover:via-sky-500 hover:to-cyan-400 hover:shadow-[0_12px_36px_rgba(56,189,248,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                  >
                    Sign Up
                  </motion.button>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openAuth("login")}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-gray-200 transition hover:border-cyan-500/35 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 sm:hidden"
                  aria-label="Open sign in"
                >
                  <ProfileIcon className="h-5 w-5" />
                </motion.button>
              </>
            ) : (
              <div className="relative">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-500/30 bg-gradient-to-br from-slate-700/80 to-slate-900 text-xs font-bold uppercase tracking-wide text-cyan-100 shadow-md shadow-black/30 transition hover:border-cyan-400/50 hover:from-slate-600/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                  aria-controls={menuOpen ? menuId : undefined}
                  aria-label="Account menu"
                >
                  {initials(session!)}
                </motion.button>

                <AnimatePresence>
                  {menuOpen ? (
                    <motion.div
                      id={menuId}
                      role="menu"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                      }}
                      className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-[min(calc(100vw-2rem),16rem)] origin-top-right rounded-2xl border border-white/10 bg-gray-950/95 py-2 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                    >
                      <p className="border-b border-white/10 px-4 py-2 text-xs text-gray-500">
                        <span className="block truncate font-medium text-gray-300">
                          {session!.displayName || session!.email.split("@")[0]}
                        </span>
                        <span className="block truncate">{session!.email}</span>
                      </p>
                      <nav className="py-1">
                        <Link
                          href="/"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-200 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          My Flights
                        </Link>
                        <Link
                          href="/saved"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-200 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          Saved Flights
                        </Link>
                        <Link
                          href="/alerts"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-200 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          Notifications
                        </Link>
                        <Link
                          href="/roadmap"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-200 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          Family Sharing
                        </Link>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setMenuOpen(false);
                            openUpgrade();
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-blue-300 transition hover:bg-blue-500/10 hover:text-blue-200"
                        >
                          Upgrade to Pro
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={logout}
                          className="w-full border-t border-white/10 px-4 py-2.5 text-left text-sm text-rose-300/90 transition hover:bg-rose-500/10 hover:text-rose-200"
                        >
                          Logout
                        </button>
                      </nav>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </header>

      <RouteWingsAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        intent={authIntent}
        onContinue={handleAuthContinue}
      />
    </>
  );
}
