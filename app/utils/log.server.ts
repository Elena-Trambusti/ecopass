import { captureExceptionToSentry } from "../sentry.server";

type LogMeta = Record<string, unknown>;

export function logServerError(scope: string, error: unknown, meta?: LogMeta) {
  const payload = {
    ts: new Date().toISOString(),
    scope,
    meta: meta ?? {},
    ...(error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : { error }),
  };
  console.error(JSON.stringify(payload));
  const err =
    error instanceof Error ? error : new Error(typeof error === "string" ? error : JSON.stringify(error));
  if (process.env.SENTRY_DSN) {
    captureExceptionToSentry(err, { extra: { scope, ...meta } });
  }
}

export function logServerInfo(scope: string, meta?: LogMeta) {
  console.info(JSON.stringify({ ts: new Date().toISOString(), scope, ...meta }));
}
