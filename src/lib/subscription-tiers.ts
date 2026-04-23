/**
 * Subscription Tiers — single source of truth for the two-tier premium
 * model. Edited here, consumed by:
 *   - /premium page (UI)
 *   - /api/stripe/checkout (price-id lookup by tier)
 *   - /api/stripe/webhook (map priceId back to tier)
 *   - SoftGate component (which tier a surface requires)
 *
 * Stripe price IDs are read from env at request time so the same config
 * works across test/live environments without code changes.
 */

export type TierSlug = "access" | "system";

export interface Tier {
  slug: TierSlug;
  name: string;
  tagline: string;
  priceMonthly: number;                 // USD, displayed as $N/mo
  accent: "gold" | "violet";            // drives accent colors on /premium
  badge?: string;                       // e.g. "Most popular"
  priceEnvVar: string;                  // Stripe price ID env var name
  features: string[];                   // bullet list rendered on /premium
  unlocks: string[];                    // what this tier gates/unlocks
}

export const TIERS: Tier[] = [
  {
    slug: "access",
    name: "Codex Access",
    tagline: "Everything that makes the archive readable.",
    priceMonthly: 9,
    accent: "gold",
    priceEnvVar: "STRIPE_PRICE_ACCESS_ID",
    features: [
      "Full episode transcripts (searchable, timestamped)",
      "Click-to-seek on every line",
      "The Psychenomicon — the full grimoire",
      "Quote search across the whole archive",
      "Lexicon + Lore, unlocked in depth",
      "Member Roll listing + custom flair title",
    ],
    unlocks: ["transcripts", "psychenomicon", "member-identity"],
  },
  {
    slug: "system",
    name: "Full System",
    tagline: "The archive, plus the tools to think with it.",
    priceMonthly: 29,
    accent: "violet",
    badge: "Most immersive",
    priceEnvVar: "STRIPE_PRICE_SYSTEM_ID",
    features: [
      "Everything in Codex Access",
      "Personal /codex — saved signals + auto-capture",
      "Insight engine — pattern detection across your listening",
      "Priority live-stream notifications",
      "Private salon access (when opened)",
      "Early access to new collections + tools",
    ],
    unlocks: ["transcripts", "psychenomicon", "member-identity", "personal-codex", "insights", "salon"],
  },
];

/** Look up a tier definition by slug. Throws if not found — callers can
 *  assume the slug comes from a closed set. */
export function getTier(slug: TierSlug): Tier {
  const t = TIERS.find((t) => t.slug === slug);
  if (!t) throw new Error(`Unknown subscription tier: ${slug}`);
  return t;
}

/** Look up a tier by the Stripe price id it resolves to at runtime.
 *  Used by the webhook to stamp the right tier on the user record. */
export function getTierByPriceId(priceId: string | null | undefined): Tier | null {
  if (!priceId) return null;
  for (const t of TIERS) {
    if (process.env[t.priceEnvVar] === priceId) return t;
  }
  return null;
}

/** Does this tier unlock the given feature key? */
export function tierUnlocks(tier: TierSlug | null, feature: string): boolean {
  if (!tier) return false;
  const t = TIERS.find((x) => x.slug === tier);
  return t?.unlocks.includes(feature) ?? false;
}

/** Resolve the Stripe price id for a tier from env. Returns null if the
 *  env var isn't set — the checkout route should 500 with a clear error. */
export function resolvePriceId(slug: TierSlug): string | null {
  const t = getTier(slug);
  return process.env[t.priceEnvVar] ?? null;
}
