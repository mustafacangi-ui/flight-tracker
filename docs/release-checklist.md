# Release QA checklist (RouteWings)

Use before TestFlight, Play internal track, or a major web release. Record owner + date in your issue tracker.

## OAuth testing

- [ ] **Google** — Sign in from header/modal; lands back on app with session; no `rw_oauth_error` query.
- [ ] **Google** — Sign out and sign in again; cookies/session refresh correctly.
- [ ] **Redirect URLs** — Production callback URL matches Supabase + Google Cloud console (`/auth/callback`).
- [ ] **www / apex** — If both hostnames exist, OAuth works from the canonical site URL in env.

## Stripe testing

- [ ] **Config** — `/api/stripe/config` reports checkout enabled when expected.
- [ ] **Checkout** — Logged-in user opens Premium modal → Checkout opens Stripe hosted page.
- [ ] **Success** — After test payment, redirect to `/premium/success` and Pro state updates (or webhook path verified).
- [ ] **Cancel** — Cancel returns to premium page without charging.
- [ ] **Webhook** — Dashboard shows events; `customer.subscription.*` / `invoice.*` handled (see `docs/launch-day-checklist.md`).

## Push testing

- [ ] **Permission** — Browser prompts; subscription row created (if using Supabase sync).
- [ ] **Send** — Test notification path works where implemented (`/api/push/test` or worker).
- [ ] **Worker** — PM2 (or cron) worker runs without errors; tracked flights update (see logs).

## Family tracking testing

- [ ] **Create link** — Premium user can create family link (if applicable to build).
- [ ] **Open link** — Incognito / second device loads family view; flight updates visible.
- [ ] **Revoke / expiry** — Behavior matches product spec.

## Live radar testing

- [ ] **API** — `/api/live/aircraft-position?flight=TK1` returns 200 (position may be null if aircraft on ground / no coverage).
- [ ] **UI** — Live flight page map loads; graceful empty state when no position.
- [ ] **Fallbacks** — With only OpenSky (no RapidAPI), behavior is acceptable or clearly messaged.

## PWA testing

- [ ] **Install** — Chrome/Edge install prompt or “Add to Home Screen” on iOS Safari.
- [ ] **Standalone** — Installed app opens without browser chrome; deep links still work.
- [ ] **Offline** — `/offline` or offline shell behaves as designed; no infinite spinners on core flows.

## Apple login testing

- [ ] **Sign in with Apple** — Completes via Supabase; same session rules as Google.
- [ ] **Supabase dashboard** — Apple provider + secret key valid; Services ID / return URLs match production.

## Deep link testing (native)

- [ ] `routewings://flight/TK1` → in-app flight route (or equivalent).
- [ ] `routewings://live/TK1` → live page.
- [ ] `routewings://family/TOKEN` → family page.
- [ ] Cold start vs warm — URL opens correct screen.

## Offline mode testing

- [ ] Airplane mode after load — Cached views / messages are sane.
- [ ] Recovery — Reconnect refreshes data without hard refresh requirement.

## Responsive / mobile testing

- [ ] iPhone Safari — Home, flight detail, live map, bottom nav, safe areas.
- [ ] Android Chrome — Same critical paths.
- [ ] Small width — No horizontal overflow on key pages.
- [ ] iPad — Layout uses width well (nav + content).

## Error monitoring verification

- [ ] **Sentry** — DSN set; trigger a test error in staging; event appears (no PII in extras).
- [ ] **Release** — Events tagged with release/environment as expected.
- [ ] **Source maps** — Stack traces readable in Sentry (if upload configured).

---

See also: `docs/device-test-matrix.md`, `docs/launch-day-checklist.md`, internal page `/debug/release-check`.
