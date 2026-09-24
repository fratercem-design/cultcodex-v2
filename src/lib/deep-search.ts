/**
 * Deep Search needs TranscriptSegment.embedding (pgvector) plus backfilled
 * vectors. Production lost that column in the Xata migration, so the feature
 * is off unless DEEP_SEARCH_ENABLED=1 is set at runtime.
 */
export function isDeepSearchEnabled(): boolean {
  return process.env.DEEP_SEARCH_ENABLED === "1";
}
