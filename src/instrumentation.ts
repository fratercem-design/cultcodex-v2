// Next.js instrumentation hook. Loads the right Sentry config per runtime and
// exports onRequestError so server-side render/route errors are captured
// automatically — this is what replaces the dead Railway -> Better Stack drain.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
