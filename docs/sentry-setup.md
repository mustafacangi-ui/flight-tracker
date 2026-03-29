# Sentry setup (RouteWings)

Production error tracking uses [`@sentry/nextjs`](https://docs.sentry.io/platforms/javascript/guides/nextjs/). If `NEXT_PUBLIC_SENTRY_DSN` is **not** set, the SDK does not initialize and all capture helpers **no-op** — the app behaves as before.

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel + local | Required for any reporting (browser + Node when `SENTRY_DSN` omitted). |
| `SENTRY_DSN` | Server / worker only | Optional override instead of public DSN on the server. |
| `SENTRY_ENVIRONMENT` | Server / edge / worker | e.g. `production`, `staging`. |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Client | Optional; defaults to `NODE_ENV`. |
| `SENTRY_RELEASE` | Build + runtime | Release name (commit SHA or semver). |
| `SENTRY_AUTH_TOKEN` | CI / local build | Upload source maps (optional). |
| `SENTRY_ORG` | Build | Sentry org slug for webpack plugin. |
| `SENTRY_PROJECT` | Build | Sentry project slug for webpack plugin. |

On Vercel, `VERCEL_GIT_COMMIT_SHA` is used as `NEXT_PUBLIC_SENTRY_RELEASE` when `SENTRY_RELEASE` is unset (see `next.config.ts`).

## Local development

1. Create a project in Sentry and copy the **Next.js** DSN.
2. Add to `.env.local`:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=development
```

3. Restart `npm run dev`. In development, `[monitoring] captured error in …` lines appear in the console when helpers run.

## PM2 push worker

`scripts/checkFlightChanges.ts` calls `initWorkerSentry()` using the same DSN env vars as the app. Ensure `.env` / `.env.local` on the worker host includes `NEXT_PUBLIC_SENTRY_DSN` or `SENTRY_DSN` if you want worker errors in Sentry.

## What we capture (high level)

- **OAuth:** Google/Apple client failures; `/auth/callback` exchange errors (no OAuth `code` or tokens in payloads).
- **Stripe:** Checkout session creation failures; webhook signature and handler errors.
- **Data providers:** AeroDataBox airport FIDS failures; OpenSky / AviationStack live-position exceptions; live radar API route throws.
- **PWA:** Service worker registration failures.
- **Native:** Deep link handling errors on Capacitor.
- **Worker:** Tracked-flight query failures and per-row processing errors.

## User context

`MonitoringContextSync` sets Sentry user **`id`** (Supabase user id when signed in), **`tier`** (`premium` / `free` / `unknown`), and **`route`** (pathname). **Email, tokens, and payment payloads are not** attached to events.

## Source maps

Configure `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` in your build environment so `withSentryConfig` can upload maps. Builds succeed without them; stack traces may be harder to read.

## Further reading

- [Sentry Next.js manual setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)
- Project helper: `src/lib/monitoring/captureError.ts`
