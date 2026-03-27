/**
 * Wraps potentially sensitive descriptions with editorial framing.
 * Used for People and Lore entries that discuss living people or allegations.
 */
export function editorialFrame(text: string): string {
  // Add "As discussed on stream: " prefix to descriptions that contain
  // sensitive patterns, unless they already have framing
  const sensitivePatterns = /\b(alleged|accused|claims to be|controversial|threatened|reportedly|rumor|stalker|harass|doxx|feud|attack|victim|predator|toxic|narcissis|manipulat|abuse|bully)/i;
  const alreadyFramed = /\b(as discussed|according to|described on|on the show|in-show|on stream)/i;

  if (sensitivePatterns.test(text) && !alreadyFramed.test(text)) {
    return `As discussed on stream: ${text}`;
  }
  return text;
}

/**
 * Returns a confidence level for auto-generated content.
 */
export type SourceConfidence = "high" | "medium" | "low";

export function getSourceConfidence(entry: {
  summaryLong?: string | null;
  summaryShort?: string | null;
  searchText?: string | null;
}): { level: SourceConfidence; label: string } {
  if (entry.summaryLong && entry.summaryLong.length > 100) {
    return { level: "high", label: "AI-enriched with transcript analysis" };
  }
  if (entry.summaryShort && entry.summaryShort.length > 50) {
    return { level: "medium", label: "Auto-summarized from metadata" };
  }
  return { level: "low", label: "Minimal data — title and metadata only" };
}
