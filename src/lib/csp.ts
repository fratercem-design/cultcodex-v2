/**
 * Nonce-based Content-Security-Policy, currently sent REPORT-ONLY by
 * `src/proxy.ts` next to the enforced policy in `next.config.ts`.
 *
 * Why report-only: a nonce can only be applied to pages rendered per request,
 * so enforcing this would turn every prerendered / ISR page dynamic (Next docs,
 * "Static vs Dynamic Rendering with CSP"). Reports show which scripts would be
 * blocked, mostly on static pages that cannot carry a nonce, before anyone
 * decides whether that trade is worth making.
 *
 * Everything except `script-src` and the report endpoint mirrors the enforced
 * policy in next.config.ts — keep the two in step.
 */
export const CSP_REPORT_PATH = "/api/csp-report";

export function buildReportOnlyCsp(nonce: string, isDev = process.env.NODE_ENV !== "production"): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic' trusts scripts loaded by a nonced script (GA, the YouTube
    // player) and makes browsers ignore the host list; it is kept as the
    // fallback for browsers without CSP3 support.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.youtube.com https://s.ytimg.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://rumble.com",
    "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
    "frame-ancestors 'self'",
    `report-uri ${CSP_REPORT_PATH}`,
  ].join("; ");
}

export function generateNonce(): string {
  return btoa(crypto.randomUUID());
}
