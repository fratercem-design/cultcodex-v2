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
  // CashApp donation boilerplate — the channel's standing description
  // ("$cultofpsyche Cashapp 🔥 The Cult of Psyche — Where Myth Wakes Up…")
  // leaks into episode summaries verbatim, often GLUED ONTO legit prose in a
  // single line. PHRASE-anchored (not line-anchored) on purpose: a prod
  // dryRun on 2026-07-19 showed line-anchored variants nulling 11 legitimate
  // summaries that merely quoted the tagline. Strip only the template spans.
  /\$?cult\s?of\s?psyche\s+cash\s?app\s*[🔥💸]*\s*/gi,
  /the cult of psyche\s*[—–-]+\s*where myth wakes up\s*(?:&|and)\s*chaos takes notes\.?/gi,
  /tarot\.\s*prophecy\.\s*open panels\.\s*occult insight\.\s*unusual minds\.\s*/gi,
  /enter as a skeptic,?\s*leave as a storyline\.?/gi,
];

/**
 * Person rows that are extraction artifacts, not people. These leak from the
 * AI enrichment pipeline when a transcript has no identifiable speaker and
 * must never surface on public inventory pages (Reports, People, graph).
 * Exact-match on trimmed displayName, case-insensitive.
 */
export const JUNK_PERSON_NAMES: string[] = [
  "none",
  "unknown",
  "unknown speaker",
  "n/a",
  "various",
  "multiple",
  "multiple speakers",
  "tbd",
];

export function isJunkPersonName(displayName: string | null | undefined): boolean {
  if (!displayName) return true;
  return JUNK_PERSON_NAMES.includes(displayName.trim().toLowerCase());
}

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
