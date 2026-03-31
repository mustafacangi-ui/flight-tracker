export const APP_TOAST_EVENT = "routewings-app-toast";

export type AppToastPayload = {
  message: string;
  variant?: "success" | "warning" | "error";
};

export function showAppToast(payload: AppToastPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(APP_TOAST_EVENT, { detail: payload }));
}
