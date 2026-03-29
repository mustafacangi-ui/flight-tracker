const CARD = "rw_pwa_install_card_dismissed";
const FAB = "rw_pwa_install_fab_dismissed";
const LOGIN_BANNER = "rw_pwa_login_install_banner_dismissed";

export function isInstallCardDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(CARD) === "1";
  } catch {
    return true;
  }
}

export function dismissInstallCard(): void {
  try {
    localStorage.setItem(CARD, "1");
  } catch {
    /* ignore */
  }
}

export function isInstallFabDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(FAB) === "1";
  } catch {
    return true;
  }
}

export function dismissInstallFab(): void {
  try {
    localStorage.setItem(FAB, "1");
  } catch {
    /* ignore */
  }
}

export function isLoginInstallBannerDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(LOGIN_BANNER) === "1";
  } catch {
    return true;
  }
}

export function dismissLoginInstallBanner(): void {
  try {
    localStorage.setItem(LOGIN_BANNER, "1");
  } catch {
    /* ignore */
  }
}
