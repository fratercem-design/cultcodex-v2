/**
 * Person records that are catch-all/label artifacts from transcript
 * enrichment, not real distinct people (e.g. "Unknown", "Guest", "None").
 * They carry real quotes/appearances worth keeping, so they are NOT
 * deleted — just excluded from public people listings, the special-
 * mentions strip, and the relationship graph. Direct /people/[slug]
 * access is intentionally left unblocked (matches Xata identity, no
 * different from an unlisted archive page).
 *
 * Identified by data-ops `noise-audit` op, reviewed 2026-07-12.
 */
export const NOISE_PERSON_SLUGS = [
  "caller",
  "co-host",
  "guest",
  "narrator",
  "none",
  "panelist",
  "unidentified-guest",
  "unidentified-speaker",
  "unknown",
  "unnamed-guest",
] as const;

/**
 * People removed at their own request. Unlike noise slugs these are blocked
 * everywhere, including direct /people/[slug] access, so a re-ingest or a
 * stray row can't bring a profile back. The DB rows are purged separately by
 * scripts/ops/remove-person-apply.ts.
 */
export const REMOVED_PERSON_SLUGS = ["alexandra-mayers"] as const;

export function isRemovedPerson(slug: string): boolean {
  return (REMOVED_PERSON_SLUGS as readonly string[]).includes(slug);
}

export const MIN_INDEXABLE_PERSON_APPEARANCES = 2;

const UNNAMED_IDENTITY_PATTERN =
  /\b(?:caller|community[- ]figure|guest|guy|narrator|panelist|person|speaker|unknown|unidentified|unnamed)\b/i;

interface PersonIndexSignals {
  slug: string;
  displayName: string;
  personType: "guest" | "host" | "mentioned" | "recurring";
  appearanceCount: number;
}

/**
 * Decide whether a person record is strong enough to submit to search engines.
 * The page remains reachable either way; this only controls sitemap inclusion
 * and robots metadata. Transcript extraction creates records such as "Indian
 * Guy" and "Psyche Community Figure" which are useful archive labels but are
 * not stable, named identities and should not become search landing pages.
 */
export function isIndexablePerson(person: PersonIndexSignals): boolean {
  if ((NOISE_PERSON_SLUGS as readonly string[]).includes(person.slug)) return false;
  if (isRemovedPerson(person.slug)) return false;
  if (person.personType === "mentioned") return false;
  if (UNNAMED_IDENTITY_PATTERN.test(person.slug) || UNNAMED_IDENTITY_PATTERN.test(person.displayName)) {
    return false;
  }
  if (person.personType === "host" || person.personType === "recurring") return true;
  return person.appearanceCount >= MIN_INDEXABLE_PERSON_APPEARANCES;
}
