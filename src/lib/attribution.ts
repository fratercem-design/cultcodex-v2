/**
 * Campaign attribution for paid checkouts.
 *
 * Persona bio links carry `utm_campaign` (docs/marketing/ai-personas/README.md).
 * The proxy keeps the first one a visitor arrives with in a cookie, and the
 * subscription checkout copies it into the Stripe session's metadata, so
 * /admin/leads can count checkouts per campaign straight from Stripe.
 */
export const CAMPAIGN_COOKIE = "cc_campaign";
export const CAMPAIGN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Returns the campaign if it is a plain slug, otherwise null. */
export function cleanCampaign(value: string | null | undefined): string | null {
  if (!value) return null;
  const slug = value.trim().toLowerCase();
  return /^[a-z0-9_-]{1,64}$/.test(slug) ? slug : null;
}

/** Reads the campaign cookie from a raw Cookie header. */
export function campaignFromCookieHeader(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === CAMPAIGN_COOKIE) return cleanCampaign(decodeURIComponent(rest.join("=")));
  }
  return null;
}
