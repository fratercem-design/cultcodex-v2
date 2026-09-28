/**
 * Find feuds: read each published episode's transcript-grounded summaries and
 * record the relationship beats between the named people in it (fallings-out,
 * callouts, debates, reconciliations) as RelationshipEvent rows. The feud
 * pages (/drama/feuds) are built from those rows.
 *
 * Scope: published episodes whose summaries read like drama (see DRAMA) and
 * that name at least two people, skipping episodes that already have events,
 * so a rerun picks up where the last one stopped. People removed at their
 * request and catch-all labels ("Unknown", "Caller") are never offered to
 * the model, so no event can name them.
 *
 * The model picks people by number from the episode's own cast list, so every
 * event resolves to an existing Person without name matching.
 *
 * Read-only by default: extracts from the first PREVIEW episodes and prints
 * what it would record. The -apply wrapper runs every candidate and writes.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getPrisma, disconnect } from "../ingest/lib";
import { NOISE_PERSON_SLUGS, REMOVED_PERSON_SLUGS } from "../../src/lib/people/noise-slugs";
import type { RelationType } from "../../src/generated/prisma/client";

const MODEL = "claude-opus-5";
const CONCURRENCY = 5;
const PREVIEW = 12;
const TIME_BUDGET_MS = 24 * 60_000;
const MAX_SUMMARY_CHARS = 12_000;

// Stems, so "debat" matches debate/debating and "accus" accused/accusation.
export const DRAMA =
  /\b(?:feud|beef|drama|call(?:ed|s|ing)?[- ]out|diss|expos|accus|rival|debat|clash|argu|conflict|betray|fell out|falling[- ]out|fallout|ban(?:ned)?\b|blocked|troll|hater|slander|cancel|smear|attack|grudge|insult|mock|roast|reconcil|made up|burying the hatchet|vs\.?\s|versus)/i;

const RELATION_TYPES = [
  "friend", "former_friend", "ally", "frequent_collaborator", "debate_rival", "enemy",
  "supporter", "critic", "mentor", "student",
] as const satisfies readonly RelationType[];

const Extraction = z.object({
  events: z.array(
    z.object({
      a: z.number().int().describe("Number of the first person in the cast list"),
      b: z.number().int().describe("Number of the second person in the cast list"),
      relationType: z.enum(RELATION_TYPES).describe("What the relationship between a and b is after this beat"),
      headline: z.string().describe("One factual line under 100 characters"),
      details: z.string().describe("One or two sentences of what happened on stream, attributed"),
    }),
  ),
});

const SYSTEM = `You catalogue relationship beats between real people for a fan archive of a livestream show.

You get one stream's summaries and a numbered cast list. Report each moment the summaries describe where the relationship between two people on the list is shown or changes: a falling-out, a public callout, a debate or rivalry, criticism, a betrayal, a reconciliation, an alliance forming.

Rules:
- Use only what the summaries state. Do not infer, guess motives, or add outside knowledge.
- Both people must be on the cast list; refer to them only by their numbers. Never pair a person with themselves.
- Skip friendly banter, jokes and bits unless the summary presents them as a real conflict or a real turn.
- Write attributed, neutral prose ("Psyche criticised X on stream for ...", "X and Y argued over ..."). Never state an accusation of wrongdoing as fact; say who made it.
- relationType is the state after the beat: enemy, debate_rival, critic or former_friend for hostile beats; friend, ally, supporter, frequent_collaborator, mentor or student for warm ones.
- At most five events. Return an empty list when the summaries describe no such moment; that is the usual answer.`;

type Cast = { id: string; slug: string; displayName: string; altNames: string[] }[];

function prompt(ep: { title: string; airDate: Date | null; text: string }, cast: Cast): string {
  const list = cast
    .map((p, i) => `${i + 1}. ${p.displayName}${p.altNames.length ? ` (also: ${p.altNames.slice(0, 4).join(", ")})` : ""}`)
    .join("\n");
  return `Stream: ${ep.title}${ep.airDate ? ` (${ep.airDate.toISOString().slice(0, 10)})` : ""}\n\nCast:\n${list}\n\nSummaries:\n${ep.text}`;
}

export async function run(apply: boolean) {
  const prisma = getPrisma();
  const client = new Anthropic();
  const excluded = new Set<string>([...NOISE_PERSON_SLUGS, ...REMOVED_PERSON_SLUGS]);
  const personSelect = { select: { person: { select: { id: true, slug: true, displayName: true, altNames: true } } } };

  const episodes = await prisma.episode.findMany({
    where: { status: "published", relationshipEvents: { none: {} } },
    select: {
      id: true, slug: true, title: true, airDate: true,
      summaryShort: true, summaryFacts: true, summaryLong: true,
      guests: personSelect, mentionedPeople: personSelect,
    },
    orderBy: { airDate: "desc" },
  });

  const candidates = episodes.flatMap((ep) => {
    const text = [ep.summaryFacts, ep.summaryLong, ep.summaryShort]
      .filter((s): s is string => !!s && s.trim() !== "" && s.trim() !== "—")
      .join("\n\n")
      .slice(0, MAX_SUMMARY_CHARS);
    if (!DRAMA.test(text)) return [];
    const byId = new Map<string, Cast[number]>();
    for (const { person } of [...ep.guests, ...ep.mentionedPeople]) {
      if (!excluded.has(person.slug) && !person.displayName.startsWith("[merged]")) byId.set(person.id, person);
    }
    const cast = [...byId.values()];
    return cast.length >= 2 ? [{ ...ep, text, cast }] : [];
  });

  console.log(
    `${apply ? "APPLY" : `REPORT (read-only, previewing ${PREVIEW})`} — ${episodes.length} published episodes without events · ` +
      `${candidates.length} read like drama and name 2+ people\n`,
  );

  const todo = apply ? candidates : candidates.slice(0, PREVIEW);
  const started = Date.now();
  let done = 0, written = 0, refused = 0, failed = 0, outOfCredit = false;

  async function one(ep: (typeof candidates)[number]) {
    const res = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "low", format: zodOutputFormat(Extraction) },
      system: SYSTEM,
      messages: [{ role: "user", content: prompt(ep, ep.cast) }],
    });
    if (res.stop_reason === "refusal") {
      refused++;
      return;
    }
    const events = (res.parsed_output?.events ?? []).filter(
      (e) => e.a !== e.b && ep.cast[e.a - 1] && ep.cast[e.b - 1] && e.headline.trim(),
    );
    const date = ep.airDate?.toISOString().slice(0, 10) ?? "????-??-??";
    for (const e of events) {
      const [pa, pb] = [ep.cast[e.a - 1], ep.cast[e.b - 1]];
      console.log(`  ${date} ${pa.displayName} × ${pb.displayName} → ${e.relationType}: ${e.headline}`);
    }
    if (!apply || !events.length) return;
    await prisma.relationshipEvent.createMany({
      data: events.map((e) => ({
        personAId: ep.cast[e.a - 1].id,
        personBId: ep.cast[e.b - 1].id,
        relationType: e.relationType,
        headline: e.headline.trim().slice(0, 200),
        details: e.details.trim() || null,
        episodeId: ep.id,
        occurredAt: ep.airDate,
      })),
    });
    written += events.length;
  }

  const queue = [...todo];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length && !outOfCredit && Date.now() - started < TIME_BUDGET_MS) {
        const ep = queue.shift()!;
        try {
          await one(ep);
        } catch (e) {
          failed++;
          const msg = e instanceof Error ? e.message : String(e);
          if (/credit balance is too low/i.test(msg)) outOfCredit = true;
          console.log(`  ✗ ${ep.slug}: ${msg.slice(0, 160)}`);
        }
        done++;
      }
    }),
  );

  const left = todo.length - done;
  console.log(
    `\nSummary: ${done} episodes read · ${written} events ${apply ? "written" : "found (not written)"} · ` +
      `${refused} refused · ${failed} failed${left ? ` · ${left} left for the next run` : ""}` +
      (outOfCredit ? " · stopped: Anthropic credit balance too low" : ""),
  );
  await disconnect();
}

if (process.argv[1]?.endsWith("find-feuds.ts")) {
  run(false).catch(async (e) => {
    console.error(e);
    await disconnect();
    process.exit(1);
  });
}
