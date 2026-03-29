# Launch day checklist (RouteWings)

Run in order before flipping traffic or submitting store builds. Keep a dated copy in your runbook.

## Environment verification

- [ ] **Production env** — Vercel (or host) variables match `.env.example` expectations; no stray `localhost` URLs in public vars.
- [ ] **`NEXT_PUBLIC_SITE_URL`** — Matches canonical domain (https, correct host).
- [ ] **Supabase** — Production project; anon URL + keys; auth redirect URLs include production callback.
- [ ] **RapidAPI** — Production key active; quota sufficient for launch traffic estimate.
- [ ] **Optional providers** — OpenSky / AviationStack / ADS-B keys if you rely on them in prod.

## Stripe webhook verification

- [ ] **Webhook URL** — `https://<domain>/api/stripe/webhook` registered in Stripe Dashboard.
- [ ] **Signing secret** — `STRIPE_WEBHOOK_SECRET` matches the active endpoint’s secret.
- [ ] **Test event** — Send `checkout.session.completed` test event; logs/DB reflect success.
- [ ] **Live mode** — Switching from test to live keys + live webhook secret documented.

## Sentry verification

- [ ] **`NEXT_PUBLIC_SENTRY_DSN`** — Set in production.
- [ ] **`SENTRY_ENVIRONMENT`** — `production` (or your prod label).
- [ ] **`SENTRY_RELEASE`** or **Vercel Git SHA** — Release string matches deployed build.
- [ ] **Smoke error** — One controlled error in staging/prod to confirm ingestion.

## Analytics verification

- [ ] **PostHog** (or chosen tool) — `NEXT_PUBLIC_POSTHOG_KEY` / host set.
- [ ] **Live session** — Open prod site; verify event or session in dashboard.
- [ ] **Privacy** — Cookie/consent copy aligned with `/privacy` if required in your region.

## PM2 worker verification

- [ ] **Process** — `pm2 list` shows worker healthy (or equivalent scheduler).
- [ ] **Env on server** — `SUPABASE_SERVICE_ROLE_KEY`, `RAPIDAPI_KEY`, `VAPID_*` present where worker runs.
- [ ] **Logs** — No repeating crash loop; tracked flights cycle completes.

## DNS / domain checks

- [ ] **Apex + www** — Resolve to expected targets; redirect policy (301) matches SEO plan.
- [ ] **Subdomains** — API or preview hosts not accidentally public if undesired.

## SSL checks

- [ ] **Certificate** — Valid chain; no mixed-content warnings on main flows.
- [ ] **HSTS** — If enabled, documented; preload only if policy is permanent.

## App Store / Play Store checks

- [ ] **Bundle IDs** — Match Capacitor config (`com.routewings.app`).
- [ ] **Privacy policy URL** — Live `https://<domain>/privacy`.
- [ ] **Terms** — `https://<domain>/terms` if required.
- [ ] **TestFlight / internal** — Build uploaded; testers invited; `CAPACITOR_SERVER_URL` points to production HTTPS for release candidate.
- [ ] **Screenshots & copy** — Match current UI; see `docs/app-store-copy.md`.

## Post-launch (first hour)

- [ ] Spot-check OAuth, one payment (test mode or small real if policy allows), one push path.
- [ ] Watch Sentry + hosting errors dashboard.
- [ ] Rollback plan documented (previous deployment tag).
