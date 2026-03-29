# Google OAuth production smoke test (FiyatRotasi / RouteWings)

Use this after deploying changes that touch Supabase Auth, callback URLs, or cookies. Production canonical site: **https://www.fiyatrotasi.com**.

## Preconditions

- Supabase **Redirect URLs** include exactly:
  - `http://localhost:3000/auth/callback`
  - `https://www.fiyatrotasi.com/auth/callback`
- Google Cloud Console **Authorized redirect URIs** for the OAuth client match Supabase’s Google provider callback (per Supabase docs), not necessarily your app URL.
- Optional: set server env `DEBUG_OAUTH_SUCCESS=1` so a successful OAuth round-trip lands on `/?oauth=success` (client shows a short banner and refreshes session).

## Desktop (Chrome)

1. Open **https://www.fiyatrotasi.com** (prefer **www**; apex may 307 to www on `/auth/callback`).
2. Open DevTools → **Application** → **Cookies** for `www.fiyatrotasi.com`.
3. Click **Sign in** → **Continue with Google**.
4. **Redirect chain (expected)**:
   - Google account chooser / consent.
   - Redirect to **`https://www.fiyatrotasi.com/auth/callback?code=...`** (and PKCE/state params as issued by Supabase).
   - 302/307 to **`/`** or **`/?oauth=success`** if debug flag is on.
5. After return:
   - Cookies: Supabase-related cookies present (names depend on Supabase version; typically `sb-*` project ref).
   - UI: header shows signed-in state (e.g. profile / account menu).
6. **Refresh persistence**: hard refresh (Ctrl+Shift+R); session should remain; UI still signed in.
7. **Sign out** then repeat once to confirm cold login.

## Internal debug page

Open **`/debug`** and check **OAuth / session (this browser)**:

- **Canonical origin** should be `https://www.fiyatrotasi.com` on production www (or apex after any client-side normalization).
- **OAuth callback URL** should match the registered Supabase URL.
- **Supabase session user id** non-empty when logged in.
- **document.cookie segments** &gt; 0 when session cookies are set.

## Mobile Safari (iOS)

1. Open **https://www.fiyatrotasi.com** in Safari.
2. Sign in with Google; complete system/Google UI.
3. Confirm you land on the site (not a blank or error page).
4. Close the tab, open a new tab to the same origin, confirm you remain signed in (or sign in again if cookies are session-only and cleared—document actual behavior).

## Android Chrome

1. Same as Safari: open **https://www.fiyatrotasi.com**, Google sign-in, confirm home loads and header reflects auth.
2. Background the browser, return; pull to refresh; confirm session still reflected in UI.

## Failure notes

- **Redirect URI mismatch**: verify Supabase redirect list and that production uses **www** callback consistently.
- **Apex vs www**: OAuth callback should hit **www**; middleware may redirect apex `/auth/callback` to www to preserve PKCE cookies on one host.
- **UI not updating after login**: check browser console for `[auth]` logs; confirm `OAuthReturnHandler` runs when using `?oauth=success`; confirm `SupabaseAuthListener` runs and `router.refresh()` fires on `SIGNED_IN` / tab visible.
