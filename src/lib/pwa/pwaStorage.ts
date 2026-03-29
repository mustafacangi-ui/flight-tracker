/** localStorage keys for PWA install UX */

export const PWA_STORAGE = {
  dismissInstallCard: "rw_pwa_dismiss_install_card",
  dismissInstallFab: "rw_pwa_dismiss_install_fab",
  dismissPostLoginBanner: "rw_pwa_dismiss_post_login_banner",
} as const;

export function readDismissed(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeDismissed(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)");
  if (mq.matches) return true;
  return Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone
  );
}

export function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iPadOs =
    /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  const iOS = /iPad|iPhone|iPod/.test(ua) || iPadOs;
  const webkit = /WebKit/.test(ua);
  const notChrome = !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit && notChrome;
}
