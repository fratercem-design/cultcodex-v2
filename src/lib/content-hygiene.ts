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
  // Generic placeholder "people" the enrichment invents when it can't name a
  // speaker. Verified against the full people table — none collide with a real
  // person (see scripts check on 2026-08-11).
  "none mentioned",
  "narrator",
  "the narrator",
  "guest",
  "host",
  "various guests",
  "various panel members",
  "various panel guests",
];

/**
 * Patterned placeholders the pipeline generates with a numeric or parenthetical
 * suffix ("Host 1", "Guest (appears ~9:37)", "Unknown Panel Participant 2",
 * "Speaker 3"). Anchored on purpose so they cannot swallow a real name — every
 * pattern was checked against the whole people table for false positives.
 */
export const JUNK_PERSON_PATTERNS: RegExp[] = [
  /^guest\s*\(.*\)$/i, // Guest (Grimaldi claimant), Guest (Brother/Leah)
  /^host\s+\d+$/i, // Host 1, Host 2
  /^speaker\s+\d+$/i, // Speaker 3
  /^unknown\b/i, // Unknown, Unknown Speaker, Unknown Panel Participant 2
  /^various\b/i, // Various Guests, Various Panel Members
  /panel participant/i, // …Panel Participant N
  /^(the\s+)?narrator$/i, // Narrator, The Narrator
  /^none\b/i, // None, None mentioned
];

export function isJunkPersonName(displayName: string | null | undefined): boolean {
  if (!displayName) return true;
  const n = displayName.trim().toLowerCase();
  if (JUNK_PERSON_NAMES.includes(n)) return true;
  return JUNK_PERSON_PATTERNS.some((re) => re.test(n));
}

/**
 * Canonical base of a display name: lower-cased, with a trailing parenthetical
 * qualifier stripped ("Psyche (Trix)" → "psyche"). Used ONLY to detect variant
 * duplicates on inventory pages — never for display.
 */
export function personNameBase(displayName: string): string {
  return displayName.replace(/\s*\([^)]*\)\s*$/, "").trim().toLowerCase();
}

function hasParenthetical(displayName: string): boolean {
  return /\([^)]*\)\s*$/.test(displayName.trim());
}

/**
 * People to force onto the Reports grid regardless of appearance rank, in
 * priority order. Matched case-insensitively on displayName (see the page's
 * pinned fetch). This is the curation dial: add or reorder names here.
 */
export const PINNED_REPORT_PEOPLE: string[] = ["Beeta"];

/**
 * Decide the Reports grid roster from a ranked candidate list.
 *
 *  - drops extraction-artifact names ("None", "Unknown", …)
 *  - collapses a parenthetical variant ("Psyche (Trix)") into an already-listed
 *    row of the same base ("Psyche"), keeping the higher-appearance row. Only
 *    parenthetical rows are ever dropped this way — a bare canonical name is
 *    never removed as a "duplicate", so two distinct people are never merged
 *    unless one is explicitly written as a "(qualifier)" variant of the other.
 *  - guarantees pinned people appear, in priority order, ahead of the ranked
 *    remainder (deduped against it by base name)
 *  - caps the result at `limit`
 *
 * Pure and stable on the input order (which the caller sorts by appearances
 * desc). Unit-tested in content-hygiene.test.ts.
 */
export function curateReportPeople<T extends { displayName: string }>(
  ranked: T[],
  pinned: T[],
  pinnedNames: string[],
  limit: number,
): T[] {
  // 1. Dedup the ranked list. Input is sorted appearances-desc, so the first
  //    time we see a base name it is the strongest row for that base.
  const seenBase = new Set<string>();
  const deduped: T[] = [];
  for (const row of ranked) {
    if (isJunkPersonName(row.displayName)) continue;
    const base = personNameBase(row.displayName);
    if (hasParenthetical(row.displayName) && seenBase.has(base)) continue; // variant dup
    seenBase.add(base);
    deduped.push(row);
  }

  // 2. Pinned people first, in the configured order, matched by base name.
  const wantPinned = pinnedNames.map((n) => n.trim().toLowerCase());
  const pinnedByBase = new Map(pinned.map((p) => [personNameBase(p.displayName), p]));
  const out: T[] = [];
  const usedBase = new Set<string>();
  for (const name of wantPinned) {
    const row = pinnedByBase.get(name);
    if (row && !isJunkPersonName(row.displayName)) {
      out.push(row);
      usedBase.add(name);
    }
  }

  // 3. Ranked remainder, skipping anyone already pinned in.
  for (const row of deduped) {
    if (out.length >= limit) break;
    const base = personNameBase(row.displayName);
    if (usedBase.has(base)) continue;
    usedBase.add(base);
    out.push(row);
  }

  return out.slice(0, limit);
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

/**
 * Terms that disqualify a quote from the FRONT DOOR only.
 *
 * The homepage rotates a "daily transmission" quote drawn from the whole
 * archive. On 2026-09-12 that rotation surfaced "Have you been to one of my
 * free freak offs?" from EP.316 - the first sentence a stranger read.
 *
 * This is not sitewide censorship, and it must not become that. Episode
 * pages, search and the archive keep the show as it actually is; the only
 * claim here is that a randomly chosen line should not be the thing that
 * introduces the site to someone who has never seen it. Anything matched
 * stays fully readable one click deeper.
 *
 * Matched case-insensitively as substrings, so keep entries short and
 * distinctive. Add to this list rather than filtering at the call site.
 */
export const FRONT_DOOR_BLOCKED_TERMS: string[] = [
  "freak off",
  "freak-off",
  "blowjob",
  "blow job",
  "cum",
  "porn",
  "rape",
  "pedo",
  "incest",
  "orgy",
  "anal",
  "dick",
  "cock",
  "pussy",
  "tits",
  "whore",
  "slut",
  "nigg",
  "faggot",
  "retard",
  "kys",
  "kill yourself",
  // Drug jokes. The 2026-09-23 daily signal auto-featured "…an eightball of
  // cocaine. I'm just kidding." as the site's headline quote. Substrings are
  // chosen so they can't match innocent words ("meth" would hit "method",
  // "heroin" would hit "heroine").
  "cocaine",
  "eightball",
  "eight ball",
  "fentanyl",
  "overdos",
];

/**
 * Prisma `NOT` clauses excluding front-door-blocked terms from a text field.
 * Spread into a `where` alongside whatever else it already filters.
 */
export function frontDoorTextExclusions(field = "text") {
  return FRONT_DOOR_BLOCKED_TERMS.map((term) => ({
    NOT: { [field]: { contains: term, mode: "insensitive" as const } },
  }));
}

/** In-memory equivalent, for pools already loaded. */
export function isFrontDoorSafe(text: string | null | undefined): boolean {
  if (!text) return false;
  const haystack = text.toLowerCase();
  return !FRONT_DOOR_BLOCKED_TERMS.some((t) => haystack.includes(t));
}
