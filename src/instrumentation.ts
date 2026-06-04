/**
 * Next.js instrumentation hook — runs once per server process start.
 * Used to initialize Sentry without the withSentryConfig() next.config wrapper
 * (which requires a peer-dep range that may not cover Next 16+).
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
