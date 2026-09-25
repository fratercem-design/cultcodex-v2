/**
 * Subscription Tiers — single source of truth for the two-tier premium
 * model. Edited here, consumed by:
 *   - /premium page (UI)
 *   - /api/stripe/checkout (price-id lookup by tier)
 *   - /api/stripe/webhook (map priceId back to tier)
 *   - SoftGate component (which tier a surface requires)
 *
 * Identity ladder: Observer (free) → Initiate+ ($10) → Oracle ($25)
 * People don't upgrade for features — they upgrade to change their role.
 *
 * Stripe price IDs are read from env at request time so the same config
 * works across test/live environments without code changes.
 */

export type TierSlug = "access" | "system";
export type BillingInterval = "month" | "year";

/** Public entitlement numbers live here so sales copy and enforcement cannot drift. */
export const FREE_ORACLE_MONTHLY_LIMIT = 3;
export const INITIATE_ORACLE_MONTHLY_LIMIT = 100;

export interface Tier {
  slug: TierSlug;
  name: string;
  role: string;                          // identity label shown in gates
  tagline: string;
  psychologyHook: string;                // the feeling it sells
  priceMonthly: number;
  priceAnnual: number;                   // total billed once per year
  accent: "gold" | "violet";
  badge?: string;
  priceEnvVar: string;                   // monthly Stripe price id env var
  priceEnvVarAnnual: string;             // annual Stripe price id env var
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
    accent: "gold",
    priceEnvVar: "STRIPE_PRICE_ACCESS_ID",
    priceEnvVarAnnual: "STRIPE_PRICE_ACCESS_ANNUAL_ID",
    features: [
      `${INITIATE_ORACLE_MONTHLY_LIMIT} Oracle questions a month — cited to the source archive`,
      "AI extracts behavioral patterns from every panel — what repeats, what shifts",
      "Find the exact moment a dynamic changed",
      "Trace behavioral signatures across years of appearances",
      "Build your own intelligence file alongside the archive",
      "Starting points picked by people who have watched the most",
      "Your Initiate role — visible to other members",
      "First access as new transmissions enter the archive",
      "2× daily Signal Credits — collect the trading-card archive twice as fast",
    ],
    unlocks: ["transcripts", "psychenomicon", "member-identity"],
  },
  {
    slug: "system",
    name: "Oracle Tier",
    role: "Oracle",
    tagline: "You're not watching anymore. You're inside it.",
    psychologyHook: "I am inside the system. Not just watching it.",
    priceMonthly: 25,
    priceAnnual: 240,
    accent: "violet",
    badge: "Most immersive",
    priceEnvVar: "STRIPE_PRICE_SYSTEM_ID",
    priceEnvVarAnnual: "STRIPE_PRICE_SYSTEM_ANNUAL_ID",
    features: [
      "Full Initiate+ access",
      "No monthly cap on Oracle questions (a per-minute limit still applies)",
      "Your own page woven permanently into the archive",
      "Your signal shapes what gets investigated next",
      "Propose what gets analyzed — your questions become the work",
      "Access unedited transmissions — what didn't make the cut",
      "Red Room: no-filter analysis, nothing softened",
      "See the full power structure — who connects to whom and how",
      "Deep behavioral profiles on every recurring figure",
      "Named role inside the system — Oracle, Architect, or Watcher",
      "Listed as a contributor to the archive itself",
      "3× daily Signal Credits — the fastest path to a complete card archive",
      "Your card collection displayed on your public archive page",
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

/**
 * Look up a tier by its Stripe price id at runtime. Used by the webhook.
 * Matches both the monthly and annual price ids for a tier.
 */
export function getTierByPriceId(priceId: string | null | undefined): Tier | null {
  if (!priceId) return null;
  for (const t of TIERS) {
    if (process.env[t.priceEnvVar] === priceId) return t;
    if (process.env[t.priceEnvVarAnnual] === priceId) return t;
  }
  return null;
}

/** Does this tier unlock the given feature key? */
export function tierUnlocks(tier: TierSlug | null, feature: string): boolean {
  if (!tier) return false;
  const t = TIERS.find((x) => x.slug === tier);
  return t?.unlocks.includes(feature) ?? false;
}

/** Resolve the Stripe price id for a tier + billing interval from env. */
export function resolvePriceId(
  slug: TierSlug,
  interval: BillingInterval = "month"
): string | null {
  const t = getTier(slug);
  const envVar = interval === "year" ? t.priceEnvVarAnnual : t.priceEnvVar;
  return process.env[envVar] ?? null;
}
