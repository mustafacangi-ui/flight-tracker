/** Chromium `beforeinstallprompt` (not in lib.dom by default). */
export type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function isBeforeInstallPromptEvent(
  e: Event
): e is BeforeInstallPromptEvent {
  return (
    "prompt" in e &&
    typeof (e as BeforeInstallPromptEvent).prompt === "function"
  );
}
