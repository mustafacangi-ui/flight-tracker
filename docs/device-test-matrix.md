# Device & browser test matrix

Track pass/fail per build. Use `/debug/release-check` for quick environment smoke checks; this matrix is for **manual** UX and compatibility.

| Area | iPhone Safari | Android Chrome | Desktop Chrome | Desktop Safari | Firefox | Edge | iPad |
|------|---------------|----------------|----------------|----------------|---------|------|------|
| Home / airport search | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Flight detail | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Live map / radar | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Auth (Google) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Auth (Apple) | ☐ | — | — | ☐ | — | — | ☐ |
| Premium / Stripe | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Push opt-in | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| PWA install / standalone | ☐ | ☐ | ☐ | — | ☐ | ☐ | ☐ |
| Family link (guest) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Blog / SEO pages | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

**Notes**

- **Apple Sign In** — Primarily Safari / iOS; mark “—” where not applicable.
- **PWA** — Desktop Safari PWA support is limited; focus on “Add to Tab” / bookmark flows if needed.
- **iPad** — Test both portrait and landscape for map + bottom navigation overlap.
- **Firefox** — Confirm push and install UX; some APIs differ from Chromium.

**Build / version:** _________________ **Tester:** _________________ **Date:** _________________
