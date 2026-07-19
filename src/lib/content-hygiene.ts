/**
 * Shared boilerplate/junk hygiene for episode summaries.
 *
 * Two consumers, one pattern list:
 *  - scrape→ingest pipeline (scripts/scrape/youtube-to-ingest.ts) so promo
 *    boilerplate never enters the DB for new episodes
 *  - data-ops `clean-episode-summaries` op, scrubbing rows already in prod
 *
 * IMPORTANT: patterns must be template-anchored, not keyword-anchored. AI
 * prose summaries are single-line and legitimately MENTION StreamYard,
 * subscribing, etc. ("Psyche discusses his unexpected $93 charge from
 * Streamyard…"). A bare /.*streamyard.*$/ pattern deletes the whole summary —
 * a prod dryRun on 2026-07-09 showed 68/73 such false positives. Only strip
 * text that matches the actual promo phrasing.
 */

export const BOILERPLATE_PATTERNS: RegExp[] = [
  // StreamYard sponsor template lines (exact promo phrasing)
  /^.*new to streaming or looking to level up.*$/gim,
  /^.*check out streamyard.*$/gim,
  /^.*get \$10 (?:discount|off).*$/gim,
  // vidIQ promo lines + links (not mere mentions of vidIQ)
  /^.*get vidiq.*$/gim,
  /https?:\/\/(?:www\.)?vidiq\.com\S*/gi,
  // StreamYard referral/base links
  /https?:\/\/(?:www\.)?streamyard\.com\S*/gi,
  /(?:^|\s)streamyard\.com\S*/gi,
  // Short standalone CTA lines only — long prose lines that merely mention
  // subscribing are left alone (length caps keep this template-shaped)
  /^[^\n]{0,80}?(?:like and subscribe|subscribe for more|don't forget to (?:like|subscribe|comment)|join this channel)[^\n]{0,40}$/gim,
  // Patreon/merch promo furniture — links always; prose only as short
  // standalone CTA lines (same length-cap discipline as the subscribe rule)
  /https?:\/\/(?:www\.)?patreon\.com\S*/gi,
  /^[^\n]{0,80}?(?:support (?:me|us) on patreon|check out (?:my|our) merch|merch store|buy (?:my|our) merch)[^\n]{0,40}$/gim,
  // Lines that are only promo emoji
  /^\s*[📌🔗💬🔔🎙️😍🚀]+\s*$/gm,
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

/** True when the ORIGINAL summary is a known AI boilerplate template that
 *  carries no episode-specific content — dozens of episodes share these
 *  verbatim ("Hello, future initiate! This video presents a surreal and
 *  symbolic montage…"). Null the whole thing rather than trim it. */
export function isTemplateJunk(raw: string): boolean {
  const t = raw.trim();
  return /^hello,?\s*(?:future\s+)?initiate/i.test(t) || /surreal and symbolic montage/i.test(t);
}

/** True when a cleaned summary carries no real content and should be nulled
 *  so the UI falls back instead of rendering junk. */
export function isJunkSummary(cleaned: string): boolean {
  const t = cleaned.trim();
  return t.length < 20 || /^no transcript available/i.test(t);
}
