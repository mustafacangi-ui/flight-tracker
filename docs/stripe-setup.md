# Stripe setup (RouteWings / FiyatRotasi Premium)

Phase 1 uses **Stripe Checkout** (hosted payment page) for subscriptions and **webhooks** to sync Supabase user metadata.

## Dashboard checklist

1. **Create products**
   - **Monthly** — recurring product with a monthly price (e.g. $6.99/mo). Copy the **Price ID** (`price_…`).
   - **Yearly** — recurring product with a yearly price (e.g. $59/yr). Copy the **Price ID** (`price_…`).

2. **API keys**
   - Developers → API keys → **Secret key** (`sk_live_…` or `sk_test_…` for test mode).

3. **Webhook endpoint**
   - Developers → Webhooks → **Add endpoint**.
   - **URL:** `https://www.fiyatrotasi.com/api/stripe/webhook` (or your deployment origin + `/api/stripe/webhook`).
   - Subscribe to events your handler uses (e.g. `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` — match `src/app/api/stripe/webhook/route.ts`).
   - Copy the **Signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.

4. **Customer portal** (optional but recommended)
   - Configure the billing portal in Stripe so users can manage/cancel subscriptions; link from your app when you add it.

## Required environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `STRIPE_SECRET_KEY` | Server only | Create Checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | Server only | Verify webhook signatures |
| `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY` | Client + server | Monthly subscription price ID |
| `NEXT_PUBLIC_STRIPE_PRICE_YEARLY` | Client + server | Yearly subscription price ID |

Checkout is **enabled** only when all of the following are non-empty (after trim):

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY`
- `NEXT_PUBLIC_STRIPE_PRICE_YEARLY`

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is optional for hosted Checkout (no Elements on-site) but useful for future in-app flows and for release-check “browser” diagnostics.

Optional URL overrides (defaults point at production):

- `STRIPE_CHECKOUT_SUCCESS_URL` / `STRIPE_SUCCESS_URL`
- `STRIPE_CHECKOUT_CANCEL_URL` / `STRIPE_CANCEL_URL`

See `.env.example` for placeholders.

## Test mode

- Use **test** API keys and test price IDs in a non-production Vercel environment.
- **Test card:** `4242 4242 4242 4242`, any future expiry, any CVC, any postal code.
- Trigger webhooks with **Stripe CLI** (`stripe listen --forward-to localhost:3000/api/stripe/webhook`) or the Dashboard “Send test webhook”.

## Verify in the app

1. `/debug/release-check` — **Stripe Checkout (server)** should show **Configured** when env vars are set; **Premium & Stripe** section should show **Pass** when the config API reports enabled.
2. Signed-in user → Premium modal → **Continue to Checkout** → completes on Stripe → success page → Premium reflected after webhook processing.

## Related code

- Checkout: `src/app/api/stripe/checkout/route.ts`
- Webhook: `src/app/api/stripe/webhook/route.ts`
- Config flag: `src/app/api/stripe/config/route.ts`, `src/lib/stripe/isStripeConfigured.ts`
- Premium modal: `src/components/PremiumUpgradeModal.tsx`
