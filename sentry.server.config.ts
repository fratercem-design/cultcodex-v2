// Sentry — server runtime (Node.js). Loaded by instrumentation.ts register().
//
// Deliberately a no-op when SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN is unset, so the
// app builds and runs unchanged on a machine or preview that has no Sentry set up.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.DEPLOY_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    // The archive is read-heavy and mostly anonymous; full tracing would be
    // noisy and costly. Sample enough to spot regressions.
    tracesSampleRate: process.env.DEPLOY_ENV === "production" ? 0.1 : 1.0,
    sendDefaultPii: false,
    ignoreErrors: [
      // Xata branches hibernate on low traffic; the first request after a wake
      // legitimately fails and the retry succeeds. Alerting on it is noise.
      "Can't reach database server",
      "branch is hibernated",
    ],
  });
}
