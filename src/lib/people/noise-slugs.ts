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
