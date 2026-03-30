/**
 * Server-side Stripe Checkout readiness (secret + recurring price IDs).
 * Do not rely on this in the browser for `STRIPE_SECRET_KEY` — use `/api/stripe/config` instead.
 */
export function isStripeConfigured(): boolean {
  const secret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const monthly = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY?.trim() ?? "";
  const yearly = process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY?.trim() ?? "";
  return Boolean(secret && monthly && yearly);
}
