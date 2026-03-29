import type Stripe from "stripe";

/** Stripe Invoice webhook payloads may omit `subscription` on the TS surface; read defensively. */
export function subscriptionIdFromInvoice(
  invoice: Stripe.Invoice
): string | null {
  const raw = (
    invoice as unknown as {
      subscription?: string | Stripe.Subscription | null;
    }
  ).subscription;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && "id" in raw) return raw.id;
  return null;
}
