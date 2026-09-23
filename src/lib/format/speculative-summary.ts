/**
 * Detects AI summaries that were written without source material and guess
 * from the title instead.
 *
 * The 2026-09 audit found EP.1908 marked "Full transcript · 4,144 segments"
 * while its summary read "Without the availability of a transcript, specific
 * events … cannot be detailed. It can be inferred from the title…" and its
 * hero subtitle said "Psyche likely explores nighttime themes". The summary
 * was generated before the transcript landed and never regenerated.
 *
 * Publishing speculation as a summary is worse than publishing nothing: it
 * contradicts the page it sits on. Pages call this to suppress those blocks
 * and show "Summary pending" instead; the enrichment pipeline can use the
 * same check to find episodes that need regeneration.
 */
const SPECULATIVE_PATTERNS: readonly RegExp[] = [
  /without (?:the )?(?:availability of (?:a |the )?)?(?:a |the )?transcript/i,
  /no transcript (?:is |was )?available/i,
  /cannot be detailed/i,
  /(?:can|could) (?:only )?be inferred from the title/i,
  /inferred from the (?:episode )?title/i,
  /\bthe title (?:alone )?suggests\b/i,
  /\bbased (?:solely |only )?on the title\b/i,
  /\blikely explores\b/i,
  /\bpresumably (?:explores|discusses|covers)\b/i,
  /\bmight involve (?:interpretations|narratives|discussions)\b/i,
];

export function isSpeculativeSummary(text: string | null | undefined): boolean {
  if (!text) return false;
  return SPECULATIVE_PATTERNS.some((re) => re.test(text));
}

/** Returns the text, or null when it is speculative — for optional fields. */
export function trustedSummary(text: string | null | undefined): string | null {
  if (!text || isSpeculativeSummary(text)) return null;
  return text;
}
