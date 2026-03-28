/**
 * i18n rollout plan (implementation: next-intl, lingui, or paraglide).
 */

export const I18N_LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "tr", label: "Turkish", native: "Türkçe" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "ar", label: "Arabic", native: "العربية" },
] as const;

export const I18N_ROLLOUT_PHASES = [
  "Phase 1: Extract UI strings to message catalogs; default en.",
  "Phase 2: Add tr + de; RTL layout pass for ar.",
  "Phase 3: Locale-based date/time (airport tz preserved).",
  "Phase 4: SEO hreflang + translated OG where needed.",
] as const;
