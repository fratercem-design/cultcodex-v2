// Sentry — browser runtime. Events are sent through the same-origin tunnel
// configured in next.config.ts (`tunnelRoute`), which keeps them inside the
// CSP's `connect-src 'self'` and out of the way of ad blockers.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    // Session Replay is off: transcript pages carry a lot of DOM and the
    // archive has no login-gated UI worth replaying by default.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
