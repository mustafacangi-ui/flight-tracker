# Vercel production release — deployment & QA checklist

Use this for the **final** Flight Tracker MVP release on Vercel.

---

## 1. Environment variables

### Required

| Variable         | Required | Notes                                                |
| ---------------- | -------- | ---------------------------------------------------- |
| `RAPIDAPI_KEY`   | **Yes**  | Powers `/api/flights`, `/api/airports`, server FIDS. |

### Recommended

| Variable                  | Notes                                                                 |
| ------------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`    | Canonical URL (e.g. `https://your-app.vercel.app`) for OG / metadata. |

### Verify

- [ ] **Local:** `.env.local` exists with `RAPIDAPI_KEY=...` (never commit this file).
- [ ] **Vercel:** Project → Settings → Environment Variables → same names, **exact spelling** (`RAPIDAPI_KEY`, not `RAPIDAPI` / `rapidapi_key`).
- [ ] **Production** env selected for Production deploys; Preview optional.
- [ ] After adding vars, **redeploy** (env is read at build/runtime per Vercel behavior).

**Smoke check:** open `/debug` → “RAPIDAPI_KEY” should show **set (value hidden)** in production.

---

## 2. API routes & pages

Manually hit or use `/debug` probes + click-through:

| Route / area              | Expect |
| ------------------------- | ------ |
| `GET /api/flights?airport=IST` | `200` + JSON when key set; `503` if key missing. |
| `GET /api/airports?query=ist`  | `200` + JSON when key set. |
| `/flight/[flightNumber]`  | Detail UI (e.g. mock `TK1234`). |
| `/share/[flightNumber]`   | Family view or “not found” for unknown codes. |
| `/saved`                  | Saved flights + favorites UI. |
| `/alerts`                 | Timeline + sound / quiet hours. |
| `/debug`                  | QA dashboard (noindex). |

- [ ] All of the above load without 500s after deploy.

---

## 3. Important user flows

- [ ] **Flow 1:** Search airport → pick from list / quick chip → see flights load.
- [ ] **Flow 2:** Toggle **Departures** / **Arrivals**.
- [ ] **Flow 3:** Toggle **Cards** / **Board** (board scrolls horizontally on small screens).
- [ ] **Flow 4:** Open a flight card → **flight detail** page.
- [ ] **Flow 5:** Open **family share** link (`/share/...`) for a known mock flight.
- [ ] **Flow 6:** **Star** airport; **save** flight from card; confirm on `/saved`.
- [ ] **Flow 7:** **Track flight** → preferences modal → alerts timeline updates when applicable.

---

## 4. Responsive design

Test in DevTools device mode or real devices:

- [ ] **iPhone** width (e.g. 390px): search, bottom nav, cards, board overflow.
- [ ] **Android** width (e.g. 360px): same.
- [ ] **Tablet** (768px+): layout doesn’t clip; board usable.
- [ ] **Desktop** (1280px+): max-width columns, optional desktop flight actions.
- [ ] **Landscape** on phone: board + headers still usable.

---

## 5. Browser support

Spot-check the same core flow (search → flights → open detail):

- [ ] **Chrome** (desktop + Android)
- [ ] **Safari** (iOS + macOS)
- [ ] **Edge**
- [ ] **Firefox**

---

## 6. Loading & edge states

- [ ] **Slow API:** DevTools throttling → skeletons / loading; no stuck blank screen.
- [ ] **No results:** empty airport → **EmptyState** + action where implemented.
- [ ] **Rate limit:** 429 path → user sees message + retry / cached data behavior.
- [ ] **Airport search:** &lt; 3 chars → no request; empty results → copy is clear.
- [ ] **Offline:** visit `/offline` or go offline → offline page / SW behavior as configured.

---

## 7. PWA behavior

- [ ] **`/manifest.json`** returns 200 and valid JSON.
- [ ] **Install prompt** appears on supported browsers (and card can dismiss).
- [ ] **Icons:** 192 / 512 / apple-touch render when installed or added to home screen.
- [ ] **Splash:** app shell / theme colors reasonable (`manifest` + layout `themeColor`).
- [ ] **Offline page** reachable and linked from SW or nav where applicable.

---

## 8. Performance

- [ ] **No unnecessary duplicate calls:** same airport in-session uses cache until refresh policy.
- [ ] **Board mode:** scroll and row animations acceptable on a mid-tier phone.
- [ ] **Family share:** first load reasonable (no huge blocking scripts).
- [ ] **Images:** OG uses fixed icons; no giant unoptimized bitmaps in critical path.
- [ ] Run **Lighthouse** (mobile) on production URL; fix obvious regressions.

---

## 9. QA debug page

- [ ] **`/debug`** loads after deploy.
- [ ] Server section shows **`RAPIDAPI_KEY` set** in production.
- [ ] API probes **OK** for flights + airports (when key valid).
- [ ] **Do not** share `/debug` publicly if you treat diagnostics as sensitive; it is **`noindex`**.

---

## 10. Final deploy steps (local → Vercel)

```bash
npm run lint
npm run build
git add .
git commit -m "Finalize flight tracker MVP"
git push
```

Then in **Vercel**:

- [ ] Confirm latest commit builds **green**.
- [ ] Open **production URL** and run sections **1–9** quickly.
- [ ] Optional: enable **Deployment Protection** or remove `/debug` route post-audit.

---

## Quick reference

| Doc / file        | Purpose                    |
| ----------------- | -------------------------- |
| `.env.example`    | Variable names for setup.  |
| `src/app/debug/`  | QA dashboard (noindex).    |
| `src/app/api/debug/status` | Safe server flags only. |
