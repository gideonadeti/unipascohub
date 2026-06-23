import * as Sentry from "@sentry/nextjs";

export function logError(message: string, error: unknown): void {
  console.error(message, error);

  const errorInstance =
    error instanceof Error ? error : new Error(String(error));

  Sentry.withScope((scope) => {
    scope.setExtra("loggedMessage", message);
    Sentry.captureException(errorInstance);
  });
}
