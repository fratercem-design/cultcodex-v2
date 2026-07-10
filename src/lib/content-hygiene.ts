/**
 * Shared boilerplate/junk hygiene for episode summaries.
 *
 * Two consumers, one pattern list:
 *  - scrape→ingest pipeline (scripts/scrape/youtube-to-ingest.ts) so promo
 *    boilerplate never enters the DB for new episodes
 *  - data-ops `clean-episode-summaries` op, scrubbing rows already in prod
 *
 * Patterns extend scripts/clean-episode-descriptions.ts (which only caught
 * streamyard.com URLs — the "Check out StreamYard and get $10 discount!"
 * promo prose survived it).
 */

export const BOILERPLATE_PATTERNS: RegExp[] = [
  // StreamYard sponsor prose + links — whole line
  /^.*stream\s?yard.*$/gim,
  /^.*get \$10 (?:discount|off).*$/gim,
  /^.*\$10 off.*$/gim,
  // vidIQ promos
  /get vidiq[^\n]*/gi,
  /vidiq[^\n]*/gi,
  // AI preamble templates
  /hello,?\s*(?:future\s+initiate|initiate)[^\n]*/gi,
  /surreal and symbolic montage[^\n]*/gi,
  // like/subscribe boilerplate
  /like\s+and\s+subscribe[^\n]*/gi,
  /subscribe\s+for\s+more[^\n]*/gi,
  /don't\s+forget\s+to\s+(?:like|subscribe|comment)[^\n]*/gi,
  /join\s+this\s+channel[^\n]*/gi,
  /🚀\s*[^\n]*/g,
  // lines that are only promo emoji
  /^\s*[📌🔗💬🔔🎙️😍]+\s*$/gm,
  // bare StreamYard links
  /https?:\/\/streamyard\.com\S*/gi,
  /streamyard\.com\S*/gi,
];

export function cleanSummary(raw: string): string {
  let text = raw;
  for (const pattern of BOILERPLATE_PATTERNS) {
    text = text.replace(pattern, "");
  }
  // Collapse 3+ blank lines into one
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

/** True when a cleaned summary carries no real content and should be nulled
 *  so the UI falls back instead of rendering junk. */
export function isJunkSummary(cleaned: string): boolean {
  const t = cleaned.trim();
  return t.length < 20 || /^no transcript available/i.test(t);
}
