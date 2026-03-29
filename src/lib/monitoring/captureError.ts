import * as Sentry from "@sentry/nextjs";

function hasBrowserDsn(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());
}

function hasServerDsn(): boolean {
  return Boolean(
    process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()
  );
}

/** True when Sentry should capture (client: public DSN only). */
export function isMonitoringEnabled(): boolean {
  if (typeof window !== "undefined") {
    return hasBrowserDsn();
  }
  return hasServerDsn();
}

function devLog(area: string, detail: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[monitoring] captured error in ${area}: ${detail}`);
  }
}

export type MonitoringUserContext = {
  userId?: string | null;
  tier?: "premium" | "free" | "unknown";
  route?: string | null;
};

/**
 * Sets user id (no email) and coarse app tags. Call from client when session/route changes.
 */
export function setMonitoringUserContext(ctx: MonitoringUserContext): void {
  if (!isMonitoringEnabled()) return;

  if (ctx.userId) {
    Sentry.setUser({ id: ctx.userId });
  } else {
    Sentry.setUser(null);
  }

  Sentry.setTag("tier", ctx.tier ?? "unknown");
  if (ctx.route) {
    Sentry.setTag("route", ctx.route);
  }
}

export type CaptureErrorContext = {
  /** Logical area for filtering, e.g. `stripe_webhook`, `live_radar`. */
  area: string;
  tags?: Record<string, string>;
  extras?: Record<string, unknown>;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
};

/**
 * Capture an exception when DSN is configured; otherwise no-op.
 * Never pass tokens, emails, payment payloads, or raw OAuth codes in extras/tags.
 */
export function captureError(
  error: unknown,
  context: CaptureErrorContext
): void {
  if (!isMonitoringEnabled()) return;

  devLog(context.area, context.extras?.summary ? String(context.extras.summary) : "error");

  Sentry.withScope((scope) => {
    scope.setTag("area", context.area);
    if (context.tags) {
      for (const [k, v] of Object.entries(context.tags)) {
        scope.setTag(k, v);
      }
    }
    if (context.extras) {
      for (const [k, v] of Object.entries(context.extras)) {
        scope.setExtra(k, v);
      }
    }
    if (context.level) {
      scope.setLevel(context.level);
    }
    const err =
      error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");
    Sentry.captureException(err);
  });
}

/**
 * Capture a message (non-Error) when DSN is configured.
 */
export function captureMessage(
  message: string,
  context: CaptureErrorContext
): void {
  if (!isMonitoringEnabled()) return;
  devLog(context.area, message);
  Sentry.withScope((scope) => {
    scope.setTag("area", context.area);
    if (context.tags) {
      for (const [k, v] of Object.entries(context.tags)) {
        scope.setTag(k, v);
      }
    }
    if (context.extras) {
      for (const [k, v] of Object.entries(context.extras)) {
        scope.setExtra(k, v);
      }
    }
    const level = context.level ?? "warning";
    scope.setLevel(level);
    Sentry.captureMessage(message, level);
  });
}
