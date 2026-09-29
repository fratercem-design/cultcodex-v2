/**
 * Line-edit AI writing tics out of the worst Psychenomicon chapters.
 *
 * Scope: chapters with at least MIN_HITS findSlop() hits (the audit's 10+
 * bucket), worst first. Each chapter gets the same rewrite prompt and guards as
 * /api/admin/psychenomicon/deslop (src/lib/psychenomicon-slop.ts).
 *
 * Read-only by default: rewrites the SAMPLE worst chapters and prints them
 * before/after, so the edit can be judged before anything is saved. The -apply
 * wrapper rewrites every chapter in scope and saves the ones that pass the
 * guards. Saved text is a fresh rewrite, not the one the dry run printed.
 * The Run DB Script job times out at 30 minutes, so apply stops starting new
 * chapters after TIME_BUDGET_MS; a rerun picks up the rest. Chapters updated
 * after PASS_STARTED are left out, so a chapter still at MIN_HITS after its
 * edit is not edited again on the next run. Pages revalidate within 5 minutes.
 */
import { getPrisma, disconnect } from "../ingest/lib";
import { enrichComplete } from "../../src/lib/enrichment-llm";
import {
  checkRewrite,
  DESLOP_SYSTEM_PROMPT,
  findSlop,
  parseRewrite,
  type ChapterProse,
} from "../../src/lib/psychenomicon-slop";

const MIN_HITS = 10;
const SAMPLE = 10;
const CONCURRENCY = 5;
const TIME_BUDGET_MS = 24 * 60_000;
// Set before the first apply run. Anything updated after it has already been
// through this pass (or was written under the new style rules).
const PASS_STARTED = new Date("2026-09-28T02:20:00Z");

interface ChapterRow extends ChapterProse {
  id: string;
  chapterNumber: number;
  title: string;
  updatedAt: Date;
}

function allText(c: ChapterProse): string {
  return [c.canonText, c.interpretationText, c.mythicText, ...c.emergingSignals].join("\n\n");
}

/** Chapters at or above minHits, worst first. */
export function pickChapters<T extends ChapterProse>(rows: T[], minHits = MIN_HITS): Array<T & { hits: number }> {
  return rows
    .map((r) => ({ ...r, hits: findSlop(allText(r)).length }))
    .filter((r) => r.hits >= minHits)
    .sort((a, b) => b.hits - a.hits);
}

type Outcome =
  | { ok: true; after: ChapterProse; hitsAfter: number }
  | { ok: false; problems: string[] };

async function rewrite(c: ChapterRow): Promise<Outcome> {
  const before: ChapterProse = {
    canonText: c.canonText,
    interpretationText: c.interpretationText,
    mythicText: c.mythicText,
    emergingSignals: c.emergingSignals,
  };
  const raw = await enrichComplete({
    system: DESLOP_SYSTEM_PROMPT,
    user: `Chapter ${c.chapterNumber}: "${c.title}"\n\n${JSON.stringify(before)}`,
    maxTokens: 8000,
  });
  const parsed = parseRewrite(raw);
  if (!parsed) return { ok: false, problems: ["model returned invalid JSON"] };
  const problems = checkRewrite(before, parsed);
  if (problems.length) return { ok: false, problems };
  const after = parsed as ChapterProse;
  return { ok: true, after, hitsAfter: findSlop(allText(after)).length };
}

const label = (c: { chapterNumber: number; title: string }) =>
  `CH.${String(c.chapterNumber).padStart(4, "0")} ${c.title}`;

export async function run(apply: boolean) {
  process.env.ENRICHMENT_PROVIDER ??= "anthropic";

  const prisma = getPrisma();
  const rows: ChapterRow[] = await prisma.psychenomiconChapter.findMany({
    select: {
      id: true, chapterNumber: true, title: true, updatedAt: true,
      canonText: true, interpretationText: true, mythicText: true, emergingSignals: true,
    },
  });
  const todo = pickChapters(rows.filter((r) => r.updatedAt < PASS_STARTED));
  const batch = apply ? todo : todo.slice(0, SAMPLE);

  console.log(
    `${apply ? "APPLY" : "DRY RUN (read-only)"}: ${todo.length} chapters with ${MIN_HITS}+ hits; ` +
      `${apply ? "rewriting all of them" : `rewriting the ${batch.length} worst as samples`}\n`,
  );

  const started = Date.now();
  const tally = { saved: 0, rejected: 0, stale: 0, failed: 0, hitsBefore: 0, hitsAfter: 0 };
  let next = 0;
  let outOfCredit = false;

  const worker = async () => {
    while (!outOfCredit && next < batch.length && (!apply || Date.now() - started < TIME_BUDGET_MS)) {
      const c = batch[next++];
      try {
        const res = await rewrite(c);
        if (!res.ok) {
          tally.rejected++;
          console.log(`  ✗ ${label(c)}: rejected (${res.problems.join("; ")})`);
          continue;
        }
        tally.hitsBefore += c.hits;
        tally.hitsAfter += res.hitsAfter;
        if (!apply) {
          tally.saved++;
          const out = [`\n══ ${label(c)} · hits ${c.hits} → ${res.hitsAfter} ══`];
          for (const f of ["canonText", "interpretationText", "mythicText"] as const) {
            out.push(`\n── ${f} BEFORE ──\n${c[f]}\n\n── ${f} AFTER ──\n${res.after[f]}`);
          }
          out.push(`\n── emergingSignals BEFORE ──\n${c.emergingSignals.map((s) => `- ${s}`).join("\n")}`);
          out.push(`\n── emergingSignals AFTER ──\n${res.after.emergingSignals.map((s) => `- ${s}`).join("\n")}`);
          console.log(out.join("\n"));
          continue;
        }
        // Only overwrite the row we read: anything edited since is skipped.
        const { count } = await prisma.psychenomiconChapter.updateMany({
          where: { id: c.id, updatedAt: c.updatedAt },
          data: res.after,
        });
        if (count === 0) {
          tally.stale++;
          console.log(`  ~ ${label(c)}: changed since read, skipped`);
          continue;
        }
        tally.saved++;
        console.log(`  ✓ ${label(c)}: hits ${c.hits} → ${res.hitsAfter}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        tally.failed++;
        console.log(`  ✗ ${label(c)}: ${message.slice(0, 200)}`);
        if (message.includes("credit balance is too low")) outOfCredit = true;
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const left = batch.length - tally.saved - tally.rejected - tally.stale - tally.failed;
  console.log(
    `\nSummary: ${apply ? "saved" : "rewrote"} ${tally.saved} (hits ${tally.hitsBefore} → ${tally.hitsAfter}) · ` +
      `rejected by guards ${tally.rejected} · ${apply ? `changed since read ${tally.stale} · ` : ""}failed ${tally.failed} · ` +
      `not reached ${left}${outOfCredit ? " (stopped: Anthropic credit balance is empty)" : left ? " (run again to continue)" : ""}`,
  );
  await disconnect();
}

if (process.argv[1]?.endsWith("psychenomicon-deslop.ts")) {
  run(process.argv.includes("--apply")).catch(async (e) => {
    console.error(e);
    await disconnect();
    process.exit(1);
  });
}
