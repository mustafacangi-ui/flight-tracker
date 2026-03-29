# RouteWings mobile app (Capacitor)

The native iOS and Android shells load the **same Next.js app** from a remote URL. This matches the current stack (API routes, server features) without a static export.

## Prerequisites

- Node.js and npm (same as the web app).
- **macOS + Xcode** for iOS builds.
- **Android Studio** (SDK, platform tools) for Android builds.

## Configuration

1. Copy `.env.example` to `.env.local` if needed.
2. Set **`CAPACITOR_SERVER_URL`** to the URL the WebView should open:
   - **Local dev:** `http://YOUR_LAN_IP:3000` (use your machine’s LAN address, not `localhost`, so a phone or emulator can reach it). Run `npm run dev` on the host.
   - **Production:** your deployed HTTPS origin, e.g. `https://www.fiyatrotasi.com`.

`capacitor.config.ts` loads `.env` and `.env.local` via `dotenv` so `npx cap sync` picks up `CAPACITOR_SERVER_URL`.

## Sync web assets into native projects

After changing `capacitor.config.ts`, plugins, or files under `capacitor-www/`:

```bash
npm run cap:sync
```

This runs `npx cap sync` and copies `out/` into the native projects, updates native dependencies, and regenerates `capacitor.config.json` inside each platform.

## Open native IDEs

```bash
npm run cap:open:ios
npm run cap:open:android
```

Or:

```bash
npx cap open ios
npx cap open android
```

## Test locally

1. Start Next.js: `npm run dev` (default port 3000).
2. Set `CAPACITOR_SERVER_URL` to `http://<your-ip>:3000` in `.env.local`.
3. Run `npm run cap:sync`.
4. Build and run from Xcode or Android Studio on a device or emulator.

**Android:** HTTP URLs require `cleartext` (handled automatically in config when the URL starts with `http://`).

**iOS:** You may need to allow arbitrary loads for plain HTTP during dev (App Transport Security), or use HTTPS (e.g. tunnel).

## Release builds

### iOS

1. Open the workspace in Xcode (`npm run cap:open:ios`).
2. Select the **App** target → **Signing & Capabilities** → set your team and bundle ID if needed (`com.routewings.app`).
3. Choose **Any iOS Device** or a device, then **Product → Archive** for App Store distribution.
4. Use **Organizer** to upload to App Store Connect.

### Android

1. Open the project in Android Studio (`npm run cap:open:android`).
2. **Build → Generate Signed Bundle / APK** and follow the wizard (upload key for Play Console).
3. For Play Store, prefer **Android App Bundle (AAB)**.

Set **`CAPACITOR_SERVER_URL`** to production HTTPS before the release `cap sync` so release builds point at the live site.

## Splash screen and status bar

Configured in `capacitor.config.ts` under `plugins.SplashScreen` and `plugins.StatusBar`. Runtime tweaks run in `CapacitorNativeBridge` (hide splash, dark status bar on native).

## Deep links

Custom scheme: **`routewings`**

Examples:

- `routewings://flight/TK1234` → `/flight/TK1234`
- `routewings://live/TK1234` → `/live/TK1234`
- `routewings://family/ABC123` → `/family/ABC123`

iOS: `CFBundleURLTypes` in `ios/App/App/Info.plist`.  
Android: `intent-filter` on `MainActivity` in `AndroidManifest.xml`.

Handling is implemented in `src/lib/capacitor/deepLink.ts` and `src/components/CapacitorNativeBridge.tsx`.

## Web build

The Next.js app is unchanged for web: `npm run build` / `npm start`. The `capacitor-www/` folder is a **minimal static placeholder** for Capacitor’s `webDir` (the repo’s `/out/` path is reserved for optional `next export` and is gitignored).

## Troubleshooting

- **Blank WebView:** Check `CAPACITOR_SERVER_URL`, device network, and that the dev server binds to `0.0.0.0` if needed (`next dev` typically does).
- **Changes not reflected:** Run `npm run cap:sync` again after config or `capacitor-www/` updates.
