import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry() {
  if (initialized || !process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0.05,
  });
  initialized = true;
}

export function captureExceptionToSentry(
  error: Error,
  context?: { extra?: Record<string, unknown> },
) {
  if (!process.env.SENTRY_DSN) return;
  initSentry();
  Sentry.captureException(error, { extra: context?.extra });
}
