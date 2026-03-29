/** iPhone / iPad (incl. iPadOS desktop UA). */
export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOS;
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)");
  if (mq.matches) return true;
  return Boolean(
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function canShowNativeInstallPrompt(): boolean {
  return typeof window !== "undefined" && "BeforeInstallPromptEvent" in window;
}
