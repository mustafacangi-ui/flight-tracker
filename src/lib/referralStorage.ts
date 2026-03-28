/**
 * Referral code for "invite friends → unlock Pro" campaigns (local stub).
 * Server-side validation would come with billing.
 */

export const REFERRAL_CODE_KEY = "flightApp_myReferralCode";

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i += 1) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

export function getOrCreateReferralCode(): string {
  if (typeof window === "undefined") return "DEMO";
  try {
    let c = localStorage.getItem(REFERRAL_CODE_KEY)?.trim();
    if (!c) {
      c = randomCode();
      localStorage.setItem(REFERRAL_CODE_KEY, c);
    }
    return c;
  } catch {
    return "DEMO";
  }
}

export function buildReferralShareUrl(): string {
  if (typeof window === "undefined") return "";
  const code = getOrCreateReferralCode();
  const u = new URL(window.location.origin);
  u.pathname = "/";
  u.searchParams.set("ref", code);
  return u.toString();
}

export function referralInviteMessage(): string {
  const url = typeof window !== "undefined" ? buildReferralShareUrl() : "";
  return `Join me on Flight Tracker — we both get closer to Pro perks.\n${url}\n\n(Future: invite friends and unlock 1 month of premium.)`;
}
