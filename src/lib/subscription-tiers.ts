/**
 * Subscription Tiers — single source of truth for the two-tier premium
 * model. Edited here, consumed by:
 *   - /premium page (UI)
 *   - /api/stripe/checkout (price-id lookup by tier)
 *   - /api/stripe/webhook (map priceId back to tier)
 *   - SoftGate component (which tier a surface requires)
 *
 * Identity ladder: Observer (free) → Initiate+ ($9) → Oracle ($29)
 * People don't upgrade for features — they upgrade to change their role.
 *
 * Stripe price IDs are read from env at request time so the same config
 * works across test/live environments without code changes.
 */

export type TierSlug = "access" | "system";

export interface Tier {
  slug: TierSlug;
  name: string;
  role: string;                          // identity label shown in gates
  tagline: string;
  psychologyHook: string;                // the feeling it sells
  priceMonthly: number;
  accent: "gold" | "violet";
  badge?: string;
  priceEnvVar: string;
  features: string[];
  unlocks: string[];
}

export const TIERS: Tier[] = [
  {
    slug: "access",
    name: "Initiate+",
    role: "Initiate",
    tagline: "The archive becomes a tool you can use.",
    psychologyHook: "Now I can actually understand what I'm watching.",
    priceMonthly: 9,
    accent: "gold",
    priceEnvVar: "STRIPE_PRICE_ACCESS_ID",
    features: [
      "Full episode transcripts — searchable, timestamped",
      "Click any line to seek straight to that moment",
      "Advanced search by archetype, behavior, conflict type",
      "Decode Mode — AI psychological breakdowns of panels",
      "Key Moments timeline inside every episode",
      "Pattern recognition summaries across guests",
      "Personal Codex — save signals, episodes, quotes",
      "Members-only curated playlists",
      "Custom Initiate badge on your profile",
      "Early access to new uploads",
    ],
    unlocks: ["transcripts", "psychenomicon", "member-identity"],
  },
  {
    slug: "system",
    name: "Oracle Tier",
    role: "Oracle",
    tagline: "You're not watching anymore. You're inside it.",
    psychologyHook: "I am inside the system. Not just watching it.",
    priceMonthly: 29,
    accent: "violet",
    badge: "Most immersive",
    priceEnvVar: "STRIPE_PRICE_SYSTEM_ID",
    features: [
      "Everything in Initiate+",
      "Personal codex page — your permanent place in the archive",
      "Vote on future guests, topics, and experiments",
      "Submit investigations — you choose what gets analyzed",
      "Raw unedited segments + behind-the-scenes breakdowns",
      "Red Room Sessions — no-filter analysis, nothing held back",
      "Relationship Map — visual graph of people, topics, conflicts",
      "Guest Intelligence Files — deep behavior profiles",
      "Named Oracle role (Oracle / Architect / Watcher)",
      "Listed as contributor to the Codex",
    ],
    unlocks: ["transcripts", "psychenomicon", "member-identity", "personal-codex", "insights", "salon"],
  },
];

/** Look up a tier definition by slug. */
export function getTier(slug: TierSlug): Tier {
  const t = TIERS.find((t) => t.slug === slug);
  if (!t) throw new Error(`Unknown subscription tier: ${slug}`);
  return t;
}

/** Look up a tier by its Stripe price id at runtime. Used by the webhook. */
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

/** Resolve the Stripe price id for a tier from env. */
export function resolvePriceId(slug: TierSlug): string | null {
  const t = getTier(slug);
  return process.env[t.priceEnvVar] ?? null;
}
