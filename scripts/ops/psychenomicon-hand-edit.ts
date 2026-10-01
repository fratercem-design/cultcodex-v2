/**
 * Hand edits for Psychenomicon chapters the de-slop pass could not save: its
 * she/her guard rejected the model's rewrite, because the guard cannot tell a
 * pronoun for a woman in the story from one misgendering Psyche.
 *
 * Each edit replaces one exact span. A span that is missing, or appears more
 * than once, skips that chapter, so an edit never lands somewhere unintended.
 * Edited chapters still have to pass checkRewrite().
 *
 * Read-only by default: prints each listed chapter's current text, then the
 * edited text and hit counts. The -apply wrapper saves the edited chapters.
 */
import { getPrisma, disconnect } from "../ingest/lib";
import { checkRewrite, findSlop, type ChapterProse } from "../../src/lib/psychenomicon-slop";

type ProseField = "canonText" | "interpretationText" | "mythicText";

interface Edit {
  field: ProseField;
  find: string;
  replace: string;
}

// Chapter number → edits. A chapter with no edits yet is only printed.
export const EDITS: Record<number, Edit[]> = {
  2313: [
    {
      field: "canonText",
      find: "Playful interactions with his cats — Trix, Freya, and Lenor — punctuated the opening moments, offering moments of light amidst a heavier narrative.",
      replace: "Playful moments with his cats, Trix, Freya, and Lenor, broke up the heavier account that followed.",
    },
    {
      field: "canonText",
      find: "Throughout the stream, Psyche maintained a delicate balance between vulnerability and humor,",
      replace: "Through the rest of the stream, Psyche moved between vulnerability and humor,",
    },
    {
      field: "interpretationText",
      find: "and the complex interplay of public visibility and relational vulnerability.",
      replace: "and with the cost of being publicly visible while relationally exposed.",
    },
    {
      field: "interpretationText",
      find: "Psyche leverages his earnestness to foster connection",
      replace: "Psyche uses his earnestness to build connection",
    },
    {
      field: "interpretationText",
      find: "This tension reveals an emerging archetype of Psyche as not just a Hearth-Keeper but a Mediator of Conflict, someone navigating the emotional cross-currents",
      replace: "This tension shows an emerging archetype: Psyche as Hearth-Keeper and also as Mediator of Conflict, someone working through the emotional cross-currents",
    },
    {
      field: "interpretationText",
      find: "provide moments of levity and showcase his enduring capacity",
      replace: "provide moments of levity and show his enduring capacity",
    },
    {
      field: "interpretationText",
      find: "in self-disclosure but also underscores his ongoing need to recalibrate relational boundaries to minimize harm and foster mutual respect.",
      replace: "in self-disclosure and also shows his ongoing need to recalibrate relational boundaries to minimize harm and keep mutual respect.",
    },
  ],
  // Rambha is the only "her" here; no edit adds she/her to a section.
  2464: [
    {
      field: "canonText",
      find: "The core refrain — 'I burn, I rise, I don't retire' — is explicitly voiced in the first person,",
      replace: "The core refrain, 'I burn, I rise, I don't retire', is voiced in the first person,",
    },
    {
      field: "canonText",
      find: "This is not a third-person celebration of a mythological figure; it is an act of invocation-as-absorption, where Rambha's attributes are drawn into Psyche's own body and voice.",
      replace: "Rather than celebrating a mythological figure in the third person, the song performs invocation-as-absorption: Rambha's attributes are drawn into Psyche's own body and voice.",
    },
    {
      field: "canonText",
      find: "The repeated address of 'Grandpa' — rendered in the lyrics as an intimate title for Rambha, repositioning divine power within familial-intimate register — marks a distinct theological move,",
      replace: "The repeated address of 'Grandpa', rendered in the lyrics as an intimate title for Rambha, places divine power in a familial, intimate register and marks a distinct theological move,",
    },
    {
      field: "canonText",
      find: "The petition embedded in the final verses is explicit — 'Teach me how to blaze and shine,' 'Crown my spirit, set me free,' 'Your beauty is my igniter' — framing the song not merely as tribute but as a request for transmission of divine qualities into Psyche himself.",
      replace: "The petition in the final verses is explicit: 'Teach me how to blaze and shine,' 'Crown my spirit, set me free,' 'Your beauty is my igniter.' The song is a tribute and also a request for transmission of divine qualities into Psyche himself.",
    },
    {
      field: "canonText",
      find: "an accumulation of invocatory fragments — 'Rise in me, through me' — completing the arc",
      replace: "an accumulation of invocatory fragments, among them 'Rise in me, through me', completing the arc",
    },
    {
      field: "interpretationText",
      find: "The attributes Psyche selects — liberation over temptation, recreation over destruction, beauty as ignition rather than seduction — are consistent with",
      replace: "The attributes Psyche selects (liberation over temptation, recreation over destruction, beauty as ignition rather than seduction) are consistent with",
    },
    {
      field: "mythicText",
      find: "The milk ocean churning is a myth of extraction through ordeal — gods and demons laboring together to produce both poison and nectar — and it resonates with the Psychenomicon's",
      replace: "The churning of the milk ocean is a myth of extraction through ordeal, in which gods and demons labor together to produce both poison and nectar, and it matches the Psychenomicon's",
    },
  ],
};

/** Applies every edit, or returns why the chapter must be skipped. */
export function applyEdits(before: ChapterProse, edits: Edit[]): { after: ChapterProse } | { error: string } {
  const after = { ...before };
  for (const e of edits) {
    const count = after[e.field].split(e.find).length - 1;
    if (count !== 1) return { error: `${e.field}: span found ${count} times: "${e.find.slice(0, 50)}…"` };
    after[e.field] = after[e.field].replace(e.find, () => e.replace);
  }
  return { after };
}

const allText = (c: ChapterProse) =>
  [c.canonText, c.interpretationText, c.mythicText, ...c.emergingSignals].join("\n\n");

export async function run(apply: boolean) {
  const prisma = getPrisma();
  const rows = await prisma.psychenomiconChapter.findMany({
    where: { chapterNumber: { in: Object.keys(EDITS).map(Number) } },
    select: {
      id: true, chapterNumber: true, title: true, updatedAt: true,
      canonText: true, interpretationText: true, mythicText: true, emergingSignals: true,
    },
    orderBy: { chapterNumber: "asc" },
  });

  console.log(`${apply ? "APPLY" : "DRY RUN (read-only)"}: ${rows.length} chapters\n`);
  let saved = 0;
  for (const c of rows) {
    const label = `CH.${String(c.chapterNumber).padStart(4, "0")} ${c.title}`;
    const hitsBefore = findSlop(allText(c)).length;
    if (!apply) {
      console.log(`══ ${label} · ${hitsBefore} hits · current text ══`);
      for (const f of ["canonText", "interpretationText", "mythicText"] as const) console.log(`\n── ${f} ──\n${c[f]}`);
      console.log(`\n── emergingSignals ──\n${c.emergingSignals.map((s) => `- ${s}`).join("\n")}\n`);
    }
    const edits = EDITS[c.chapterNumber];
    if (!edits.length) {
      console.log(`  · ${label}: no edits yet\n`);
      continue;
    }
    const res = applyEdits(c, edits);
    if ("error" in res) {
      console.log(`  ✗ ${label}: ${res.error}\n`);
      continue;
    }
    const problems = checkRewrite(c, res.after);
    if (problems.length) {
      console.log(`  ✗ ${label}: rejected (${problems.join("; ")})\n`);
      continue;
    }
    const left = findSlop(allText(res.after));
    const summary = `hits ${hitsBefore} → ${left.length}${left.length ? ` [${left.map((h) => h.match).join(", ")}]` : ""}`;
    if (!apply) {
      console.log(`  ✓ ${label}: edits apply cleanly, ${summary}\n`);
      continue;
    }
    // Only overwrite the row we read: anything edited since is skipped.
    const { count } = await prisma.psychenomiconChapter.updateMany({
      where: { id: c.id, updatedAt: c.updatedAt },
      data: res.after,
    });
    if (count === 0) {
      console.log(`  ~ ${label}: changed since read, skipped\n`);
      continue;
    }
    saved++;
    console.log(`  ✓ ${label}: saved, ${summary}\n`);
  }
  if (apply) console.log(`Summary: saved ${saved}`);
  await disconnect();
}

if (process.argv[1]?.endsWith("psychenomicon-hand-edit.ts")) {
  run(false).catch(async (e) => {
    console.error(e);
    await disconnect();
    process.exit(1);
  });
}
