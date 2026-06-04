import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Sample 10 % of traces — adequate for a single-instance Railway deploy.
  tracesSampleRate: 0.1,

  // Ensure full stack traces reach Sentry even on Railway's compressed output.
  includeLocalVariables: true,

  enabled: process.env.NODE_ENV === "production",
});
