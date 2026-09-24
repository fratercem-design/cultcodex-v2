/**
 * The single source of truth for the Topic ("Signals") description prompt.
 *
 * This lived in two places — scripts/enrich/enrich-topics.ts and
 * /api/admin/enrich-topics — and they drifted. The route gained
 *
 *     "Psyche is MALE — use he/him/his pronouns for Psyche at all times."
 *
 * and the script never did, so whichever copy ran decided whether the archive
 * misgendered its own host. It is not a cosmetic difference: 644 live topic
 * descriptions refer to Psyche as "she"/"her", and every one of them was
 * written by a run that used the copy without this line.
 *
 * Both call sites now import from here. `topic-enrichment.test.ts` fails if
 * either one grows a local copy again.
 */

export const TOPIC_ENRICHMENT_SYSTEM_PROMPT = `You are an expert archivist for CultCodex.me — the living archive of the "Cult of Psyche" show. The show is hosted by Psyche (also called Trix): a spiritual teacher, tarot reader, occultist, and livestreamer. Psyche is MALE — use he/him/his pronouns for Psyche at all times. The show covers consciousness, mythology, tarot, astrology, esoteric philosophy, panelverse drama, and community lore.

You are writing short topic descriptions for the archive's knowledge graph. Each topic is a subject that appears across multiple episodes.

Write a description in two parts separated by a blank line:

Part 1 (1–2 sentences): A concise, factual definition of what this topic IS — as a neutral encyclopedia entry would describe it.

Part 2 (1–2 sentences, start with "In the Psycheverse:"): How Psyche engages with this topic on the show — the angle, recurring themes, or why it's significant in this universe. Be specific and interesting, not generic.

Rules:
- Total length: 3–5 sentences maximum
- Do not mention episode numbers or specific dates
- Use present tense
- Do not use filler phrases like "delves into" or "explores the intersection"
- Return ONLY the description text — no JSON, no headers, no extra commentary`;

export interface TopicEnrichmentContext {
  title: string;
  episodeTitles: string[];
  loreTitles: string[];
  peopleNames: string[];
  sampleSummaries: string[];
}

/** Build the user turn: the topic plus whatever archive context exists for it. */
export function buildTopicEnrichmentMessage(input: TopicEnrichmentContext): string {
  const parts = [`Topic: "${input.title}"`];

  // Summaries say far more than titles, so they win when both exist.
  if (input.sampleSummaries.length > 0) {
    parts.push(
      `\nSample episode summaries:\n${input.sampleSummaries.slice(0, 5).map((s) => `- ${s}`).join("\n")}`
    );
  } else if (input.episodeTitles.length > 0) {
    parts.push(
      `\nEpisode titles:\n${input.episodeTitles.slice(0, 10).map((t) => `- ${t}`).join("\n")}`
    );
  }

  if (input.loreTitles.length > 0) {
    parts.push(`\nRelated lore: ${input.loreTitles.slice(0, 5).join(", ")}`);
  }
  if (input.peopleNames.length > 0) {
    parts.push(`\nPeople: ${input.peopleNames.slice(0, 5).join(", ")}`);
  }

  return parts.join("\n");
}

/**
 * True when the "In the Psycheverse:" paragraph — which the prompt defines as
 * being about Psyche — refers to him with she/her. Used to select rows written
 * by the old prompt copy for regeneration, and to refuse a regenerated text
 * that still gets it wrong. Part 1 is deliberately ignored: it may legitimately
 * be about someone else.
 */
const FEMININE = /\b(she|her|hers|herself)\b/i;
export function psycheverseParagraphMisgenders(description: string | null | undefined): boolean {
  if (!description) return false;
  const i = description.indexOf("In the Psycheverse:");
  if (i === -1) return false;
  return FEMININE.test(description.slice(i));
}
