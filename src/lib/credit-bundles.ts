/**
 * Purchasable Signal Credit bundles — the paid side of the card economy.
 *
 * Mirrors subscription-tiers.ts: the bundle table is code, the Stripe price
 * ids are env vars read at request time so the same build serves test and
 * live keys. A bundle whose env var is unset is "not configured", and the
 * checkout route returns a logged 500 rather than charging anything.
 *
 * Used by:
 *   - /api/stripe/credits-checkout (bundle → price id)
 *   - /api/stripe/webhook (metadata.bundle → credits, as a cross-check)
 *   - the Pack Store strip (display)
 */

export type CreditBundleSlug = "spark" | "surge" | "flood";

export interface CreditBundle {
  slug: CreditBundleSlug;
  name: string;
  credits: number;
  /** Display price in USD cents — the Stripe Price is the source of truth. */
  priceCents: number;
  priceEnvVar: string;
  /** One line under the name: what the credits buy in pack terms. */
  blurb: string;
}

export const CREDIT_BUNDLES: readonly CreditBundle[] = [
  {
    slug: "spark",
    name: "Spark",
    credits: 300,
    priceCents: 299,
    priceEnvVar: "STRIPE_PRICE_CREDITS_SPARK_ID",
    blurb: "Six Signal Archive packs, or one Nyx.",
  },
  {
    slug: "surge",
    name: "Surge",
    credits: 800,
    priceCents: 699,
    priceEnvVar: "STRIPE_PRICE_CREDITS_SURGE_ID",
    blurb: "Two Oracle's Cache packs with change to spare.",
  },
  {
    slug: "flood",
    name: "Flood",
    credits: 2000,
    priceCents: 1499,
    priceEnvVar: "STRIPE_PRICE_CREDITS_FLOOD_ID",
    blurb: "Five Oracle's Cache packs. The vault, opened.",
  },
] as const;

export const CREDIT_BUNDLE_SLUGS = CREDIT_BUNDLES.map((b) => b.slug) as [
  CreditBundleSlug,
  ...CreditBundleSlug[],
];

export function getCreditBundle(slug: string): CreditBundle | null {
  return CREDIT_BUNDLES.find((b) => b.slug === slug) ?? null;
}

/** Stripe price id for a bundle, or null when the env var is unset. */
export function resolveCreditBundlePriceId(slug: CreditBundleSlug): string | null {
  const bundle = getCreditBundle(slug);
  if (!bundle) return null;
  return process.env[bundle.priceEnvVar] || null;
}

export function formatBundlePrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
