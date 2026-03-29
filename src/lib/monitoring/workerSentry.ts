/**
 * Sentry for Node scripts (e.g. PM2 push worker). Separate from Next.js SDK bundle.
 */

import * as Sentry from "@sentry/node";

let initialized = false;

export function initWorkerSentry(): void {
  if (initialized) return;
  const dsn =
    process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE?.trim(),
    tracesSampleRate: 0,
  });
  initialized = true;
}

export function captureWorkerError(
  error: unknown,
  context: { area: string; tags?: Record<string, string> }
): void {
  if (!initialized) return;
  if (process.env.NODE_ENV === "development") {
    console.log(`[monitoring] captured error in ${context.area} (worker)`);
  }
  Sentry.withScope((scope) => {
    scope.setTag("area", context.area);
    if (context.tags) {
      for (const [k, v] of Object.entries(context.tags)) {
        scope.setTag(k, v);
      }
    }
    const err =
      error instanceof Error ? error : new Error(String(error));
    Sentry.captureException(err);
  });
}
