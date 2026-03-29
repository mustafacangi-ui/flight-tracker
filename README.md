This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Sign in with Apple (Phase 1)

RouteWings uses **Supabase Auth** with `signInWithOAuth({ provider: "apple" })`. The app sends users to the same `/auth/callback` route as Google OAuth.

### Redirect URLs (must match exactly)

Add these in **Supabase → Authentication → URL configuration → Redirect URLs**:

- `http://localhost:3000/auth/callback`
- `https://www.fiyatrotasi.com/auth/callback`

### Apple Developer setup

1. **Apple Developer account** with access to Certificates, Identifiers & Profiles.
2. **App ID** (e.g. `com.yourcompany.routewings`) with **Sign In with Apple** capability enabled.
3. **Services ID** (e.g. `com.yourcompany.routewings.web`) — used as **Client ID** in Supabase. Type: *Services IDs*. Enable *Sign In with Apple* and associate your App ID.
4. **Return URLs** on the Services ID: same as Supabase redirect URLs above (localhost + production).
5. **Key** for Sign In with Apple: create a key with *Sign In with Apple* enabled. Note **Key ID** and download the **private key** (`.p8`, one-time download).
6. **Team ID** — from Apple Developer membership page.

### Supabase Apple provider

In **Supabase → Authentication → Providers → Apple**:

- **Services ID** → Apple Services ID (Client ID).
- **Secret Key** → JWT secret per [Supabase Apple guide](https://supabase.com/docs/guides/auth/social-login/auth-apple) (Team ID, Key ID, Client ID, and `.p8` private key).
- Enable the provider.

### Environment variables

Apple credentials are configured in **Supabase**, not required in this Next.js app for OAuth to work. Optional placeholders `APPLE_CLIENT_ID` / `APPLE_SECRET` in `.env.example` are for documentation; the auth modal only needs `NEXT_PUBLIC_SUPABASE_*` to start Apple login.

### User-facing note

Apple may provide a **private relay email** or hide the real address — the auth modal shows a short hint for users.
