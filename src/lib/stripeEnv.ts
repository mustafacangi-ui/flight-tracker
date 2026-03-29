/**
 * Stripe Checkout + webhooks (server uses secret; browser uses public price IDs).
 */
export function getStripeSecretKey(): string {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? "";
}

export function getStripeWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
}

export function getStripePublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
}

export function getStripePriceIds(): { monthly: string; yearly: string } {
  return {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY?.trim() ?? "",
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY?.trim() ?? "",
  };
}

/** Server can create Checkout sessions (secret + both recurring prices). */
export function isStripeCheckoutConfigured(): boolean {
  const { monthly, yearly } = getStripePriceIds();
  return Boolean(getStripeSecretKey() && monthly && yearly);
}

/**
 * Success/cancel return URLs for Checkout.
 * Override with STRIPE_CHECKOUT_SUCCESS_URL / STRIPE_CHECKOUT_CANCEL_URL for local dev.
 */
export function getStripeCheckoutReturnUrls(): {
  successUrl: string;
  cancelUrl: string;
} {
  const success =
    process.env.STRIPE_CHECKOUT_SUCCESS_URL?.trim() ||
    process.env.STRIPE_SUCCESS_URL?.trim() ||
    "https://www.fiyatrotasi.com/premium/success";
  const cancel =
    process.env.STRIPE_CHECKOUT_CANCEL_URL?.trim() ||
    process.env.STRIPE_CANCEL_URL?.trim() ||
    "https://www.fiyatrotasi.com/premium";
  return { successUrl: success, cancelUrl: cancel };
}
