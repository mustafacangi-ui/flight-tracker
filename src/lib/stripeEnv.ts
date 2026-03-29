/**
 * Stripe (phase 1 — checkout wiring comes next). Price IDs for Checkout Session.
 */
export function getStripePublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
}

export function getStripePriceIds(): { monthly: string; yearly: string } {
  return {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY?.trim() ?? "",
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY?.trim() ?? "",
  };
}
