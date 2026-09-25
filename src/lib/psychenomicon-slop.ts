/**
 * AI-slop detection and rewrite rules for Psychenomicon chapter prose.
 *
 * Three consumers, one rule set:
 *  - generate-chapter-core.ts appends CHAPTER_STYLE_RULES to the system prompt
 *    so new chapters come out plain
 *  - /api/admin/psychenomicon/deslop audits existing chapters with findSlop()
 *    and proposes rewrites with DESLOP_SYSTEM_PROMPT
 *  - checkRewrite() guards those proposals before anything is written
 *
 * The in-world vocabulary (signal, transmission, archetype, entity, thread,
 * vault, codex, initiate, Oracle) is the brand and is never flagged.
 */

export interface SlopHit {
  kind: "word" | "phrase" | "contrast" | "dashes";
  match: string;
}

// Stock words. Word-boundary matched, case-insensitive.
const STOCK_WORDS = [
  "tapestry", "testament", "delve[sd]?", "delving", "underscor(?:e|es|ed|ing)",
  "pivotal", "crucial", "palpable", "intricate", "multifaceted", "vibrant",
  "resonat(?:e|es|ed|ing)", "interplay", "crucible", "labyrinth(?:ine)?",
  "embark(?:s|ed|ing)?", "foster(?:s|ed|ing)?", "harness(?:es|ed|ing)?",
  "transformative", "unwavering", "indelible", "poignant(?:ly)?", "profound(?:ly)?",
  "seamless(?:ly)?", "robust", "leverag(?:e|es|ed|ing)", "showcas(?:e|es|ed|ing)",
  "unparalleled", "undeniabl[ey]", "inexorabl[ey]", "ineffable", "visceral",
  "juxtaposition", "quintessential", "myriad", "nuanced",
];

// Stock phrases. Matched as written, case-insensitive.
const STOCK_PHRASES = [
  "a testament to", "serves as a (?:stark |powerful |potent )?reminder", "a stark reminder",
  "speaks volumes", "the very fabric", "only time will tell", "remains to be seen",
  "hints at a deeper", "a deeper truth", "dance (?:of|between)", "navigat(?:e|es|ed|ing) the",
  "in the grand (?:scheme|tapestry)", "it is worth noting", "it's worth noting",
  "at its core", "in essence", "ever-evolving", "ever-shifting", "a microcosm of",
  "the weight of (?:it all|the moment)", "something deeper", "a delicate balance",
];

const WORD_RE = new RegExp(`\\b(?:${STOCK_WORDS.join("|")})\\b`, "gi");
const PHRASE_RE = new RegExp(`\\b(?:${STOCK_PHRASES.join("|")})\\b`, "gi");

// "not just X, but Y" / "not merely X — it is Y" / "It wasn't X. It was Y."
const CONTRAST_RES = [
  /\bnot (?:just|merely|simply|only) [^.;!?]{1,80}?,? (?:but|—|it (?:is|was)|it's)\b/gi,
  /\b(?:this|it|that) (?:isn't|wasn't|is not|was not) [^.;!?]{1,60}?[.;—,] ?(?:it|this|that) (?:is|was|'s)\b/gi,
];

/** Every slop hit in a block of prose. Order is not significant. */
export function findSlop(text: string): SlopHit[] {
  if (!text) return [];
  const hits: SlopHit[] = [];
  for (const m of text.matchAll(WORD_RE)) hits.push({ kind: "word", match: m[0].toLowerCase() });
  for (const m of text.matchAll(PHRASE_RE)) hits.push({ kind: "phrase", match: m[0].toLowerCase() });
  for (const re of CONTRAST_RES) {
    for (const m of text.matchAll(re)) hits.push({ kind: "contrast", match: m[0] });
  }
  // Em-dash clusters: any sentence carrying two or more em dashes.
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    const n = (sentence.match(/—/g) ?? []).length;
    if (n >= 2) hits.push({ kind: "dashes", match: sentence.slice(0, 80) });
  }
  return hits;
}

/** Hit count per 1,000 characters, so long and short chapters compare fairly. */
export function slopDensity(text: string): number {
  if (!text) return 0;
  return (findSlop(text).length / text.length) * 1000;
}

/** Style rules shared by chapter generation and the rewrite pass. */
export const CHAPTER_STYLE_RULES = `STYLE (plain prose, no AI tics):
- Write like a careful human archivist. Concrete nouns, specific events, names, what was said.
- Banned words: tapestry, testament, delve, underscore, pivotal, crucial, palpable, intricate, multifaceted, vibrant, resonate, interplay, crucible, labyrinth, embark, foster, harness, transformative, unwavering, indelible, poignant, profound, seamless, robust, leverage, showcase, undeniable, visceral, juxtaposition, myriad, nuanced.
- Banned phrases: "a testament to", "serves as a reminder", "speaks volumes", "the very fabric", "only time will tell", "remains to be seen", "a deeper truth", "dance of/between", "navigate the", "at its core", "in essence", "ever-evolving".
- No "not X, but Y" or "It wasn't X. It was Y." contrasts. State what happened.
- No aphorism kickers: do not end a paragraph on a short profound-sounding line that restates the paragraph.
- No lists of three vague adjectives or verbs. Keep only the concrete one.
- At most one em dash per sentence. Prefer periods and commas.
- Keep the in-world vocabulary: signal, transmission, archetype, entity, thread, vault, codex, initiate, Oracle.`;

export const DESLOP_SYSTEM_PROMPT = `You are copy-editing chapters of the Psychenomicon, a chronicle of the Cult of Psyche livestreams on cultcodex.me. The chapters were machine-written and carry AI writing tics. Your job is a line edit, not a rewrite of the story.

HARD RULES:
- Keep every fact, name, number, date, episode reference and event exactly as given. Add nothing that is not already in the text.
- Keep anything inside quotation marks verbatim, including its punctuation.
- Psyche (also called Trix) is male: he/him.
- Keep the same paragraph count per field and roughly the same length (within 15%). Only shorten where you cut filler.
- Keep the three-layer voice: canonText is a factual record, interpretationText is behavioral analysis, mythicText is the short symbolic layer. The mythic layer may stay mythic; it may not be purple.
- Leave sentences that are already plain unchanged.

${CHAPTER_STYLE_RULES}

Respond with valid JSON only, same keys as the input: {"canonText": string, "interpretationText": string, "mythicText": string, "emergingSignals": string[]}. emergingSignals must have the same number of items as the input. No prose before or after. No markdown.`;

export interface ChapterProse {
  canonText: string;
  interpretationText: string;
  mythicText: string;
  emergingSignals: string[];
}

const PROSE_FIELDS = ["canonText", "interpretationText", "mythicText"] as const;

/** Quoted spans of 3+ words. Rewrites must carry these through verbatim. */
function quotedSpans(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/["“]([^"”]{8,300})["”]/g)) {
    if (m[1].trim().split(/\s+/).length >= 3) out.push(m[1]);
  }
  return out;
}

/**
 * Sanity checks on a proposed rewrite. Returns the reasons it should be
 * rejected; an empty array means it is safe to store.
 */
export function checkRewrite(before: ChapterProse, after: Partial<ChapterProse>): string[] {
  const problems: string[] = [];
  for (const f of PROSE_FIELDS) {
    const b = before[f] ?? "";
    const a = after[f];
    if (typeof a !== "string" || !a.trim()) {
      problems.push(`${f}: missing`);
      continue;
    }
    const ratio = a.length / Math.max(1, b.length);
    if (b.length > 200 && (ratio < 0.6 || ratio > 1.15)) {
      problems.push(`${f}: length changed ${Math.round((ratio - 1) * 100)}%`);
    }
    for (const q of quotedSpans(b)) {
      if (!a.includes(q)) problems.push(`${f}: dropped or altered quote "${q.slice(0, 40)}…"`);
    }
    if (/\b(she|her|hers)\b/i.test(a) && !/\b(she|her|hers)\b/i.test(b)) {
      problems.push(`${f}: introduced she/her`);
    }
  }
  const sig = after.emergingSignals;
  if (!Array.isArray(sig) || sig.length !== before.emergingSignals.length || sig.some((s) => typeof s !== "string" || !s.trim())) {
    problems.push("emergingSignals: count or shape changed");
  }
  return problems;
}

/** Parses the model's JSON reply, tolerating a stray code fence. */
export function parseRewrite(raw: string): Partial<ChapterProse> | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Partial<ChapterProse>) : null;
  } catch {
    return null;
  }
}
