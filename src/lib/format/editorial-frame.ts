/**
 * Wraps potentially sensitive descriptions with editorial framing.
 * Used for People and Lore entries that discuss living people or allegations.
 */
export function editorialFrame(text: string): string {
  // Add "As discussed on stream: " prefix to descriptions that contain
  // sensitive patterns, unless they already have framing
  const sensitivePatterns = /\b(alleged|accused|claims to be|controversial|threatened|reportedly|rumor)/i;
  const alreadyFramed = /\b(as discussed|according to|described on|on the show|in-show)/i;

  if (sensitivePatterns.test(text) && !alreadyFramed.test(text)) {
    return `As discussed on the show: ${text}`;
  }
  return text;
}
