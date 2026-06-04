import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10 % of transactions for performance monitoring.
  // Raise toward 1.0 temporarily when debugging a perf regression.
  tracesSampleRate: 0.1,

  // Capture replays only on errors — avoids storing session recordings for
  // normal traffic while still giving full context when something breaks.
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,

  integrations: [
    Sentry.replayIntegration({
      // Never record passwords, payment fields, or other sensitive inputs.
      maskAllInputs: true,
      blockAllMedia: false,
    }),
  ],

  // Don't send errors in local dev — they're noisy and waste quota.
  enabled: process.env.NODE_ENV === "production",
});
