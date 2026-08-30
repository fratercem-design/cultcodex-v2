// Sentry — edge runtime (middleware and any `runtime = "edge"` routes).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    tracesSampleRate: process.env.VERCEL_ENV === "production" ? 0.1 : 1.0,
    sendDefaultPii: false,
  });
}
