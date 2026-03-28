import {
  loadGlobalNotificationSettings,
  type AlertSoundMode,
} from "./notificationGlobalSettings";

function playSoftChime(): void {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    o.type = "sine";
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.4);
    setTimeout(() => void ctx.close(), 500);
  } catch {
    /* ignore */
  }
}

function playAirportStyle(): void {
  try {
    const ctx = new AudioContext();
    const times = [0, 0.12, 0.24];
    times.forEach((t, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 520 + i * 140;
      o.type = "square";
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.08);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.1);
    });
    setTimeout(() => void ctx.close(), 600);
  } catch {
    /* ignore */
  }
}

export function playAlertSoundForMode(mode: AlertSoundMode): void {
  if (mode === "silent") return;
  if (mode === "soft") playSoftChime();
  else playAirportStyle();
}

export function playAlertSoundIfEnabled(): void {
  const { sound } = loadGlobalNotificationSettings();
  playAlertSoundForMode(sound);
}
