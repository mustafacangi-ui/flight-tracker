const QUICK_TAB_KEY = "quickAccessTab";

export type QuickAccessTab = "airports" | "flights";

export function dispatchQuickAccessTab(tab: QuickAccessTab): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("quickAccessSetTab", { detail: tab }));
}

export function setQuickAccessTabForNextHomeVisit(tab: QuickAccessTab): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(QUICK_TAB_KEY, tab);
  } catch {
    /* ignore */
  }
}

export function consumeQuickAccessTab(): QuickAccessTab | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(QUICK_TAB_KEY);
    sessionStorage.removeItem(QUICK_TAB_KEY);
    if (v === "airports" || v === "flights") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function setScrollToSearchOnHome(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem("scrollToMobileSearch", "1");
  } catch {
    /* ignore */
  }
}

export function consumeScrollToSearch(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem("scrollToMobileSearch") === "1") {
      sessionStorage.removeItem("scrollToMobileSearch");
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
