/**
 * Subscription Tiers — single source of truth for the two-tier premium
 * model. Edited here, consumed by:
 *   - /premium page (UI)
 *   - /api/stripe/checkout (price-id lookup by tier)
 *   - /api/stripe/webhook (map priceId back to tier)
 *   - SoftGate component (which tier a surface requires)
 *
 * Identity ladder: Observer (free) → Initiate+ ($10) → Architect ($25)
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
  priceAnnual: number;                   // annual total (e.g. 96 = $8/mo billed yearly)
  annualSavings: number;                 // dollars saved vs 12× monthly
  accent: "gold" | "violet";
  badge?: string;
  priceEnvVar: string;
  priceAnnualEnvVar: string;
  features: string[];
  unlocks: string[];
}

export const TIERS: Tier[] = [
  {
    slug: "access",
    name: "Initiate+",
    role: "Initiate",
    tagline: "The archive stops being background noise.",
    psychologyHook: "Now I can actually understand what I'm watching.",
    priceMonthly: 10,
    priceAnnual: 96,
    annualSavings: 24,
    accent: "gold",
    priceEnvVar: "STRIPE_PRICE_ACCESS_ID",
    priceAnnualEnvVar: "STRIPE_PRICE_ACCESS_ANNUAL_ID",
    features: [
      "Read every word ever spoken — searchable, timestamped",
      "Jump to any moment in any transmission, instantly",
      "Search by what's actually happening — not just keywords",
      "AI extracts behavioral patterns from every panel — what repeats, what shifts",
      "Find the exact moment a dynamic changed",
      "Trace behavioral signatures across years of appearances",
      "Build your own intelligence file alongside the archive",
      "Entry points curated by people who've already gone deep",
      "Your Initiate role — visible to other members",
      "First access as new transmissions enter the archive",
    ],
    unlocks: ["transcripts", "psychenomicon", "member-identity"],
  },
  {
    slug: "system",
    name: "Architect",
    role: "Architect",
    tagline: "You're not watching anymore. You're inside it.",
    psychologyHook: "I am inside the system. Not just watching it.",
    priceMonthly: 25,
    priceAnnual: 240,
    annualSavings: 60,
    accent: "violet",
    badge: "Most immersive",
    priceEnvVar: "STRIPE_PRICE_SYSTEM_ID",
    priceAnnualEnvVar: "STRIPE_PRICE_SYSTEM_ANNUAL_ID",
    features: [
      "Full Initiate+ access",
      "Your own page woven permanently into the archive",
      "Your signal shapes what gets investigated next",
      "Propose what gets analyzed — your questions become the work",
      "Access unedited transmissions — what didn't make the cut",
      "Red Room: no-filter analysis, nothing softened",
      "See the full power structure — who connects to whom and how",
      "Deep behavioral profiles on every recurring figure",
      "Named role inside the archive — Architect, Watcher, or Hierophant",
      "Listed as a contributor to the archive itself",
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

/** Resolve the Stripe monthly price id for a tier from env. */
export function resolvePriceId(slug: TierSlug): string | null {
  const t = getTier(slug);
  return process.env[t.priceEnvVar] ?? null;
}

/** Resolve the Stripe annual price id for a tier from env (null if not configured). */
export function resolveAnnualPriceId(slug: TierSlug): string | null {
  const t = getTier(slug);
  return process.env[t.priceAnnualEnvVar] ?? null;
}
