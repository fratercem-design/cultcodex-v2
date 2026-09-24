/**
 * Drives /api/admin/psychenomicon/deslop across every chapter on the live site.
 *
 *   ENRICH_SECRET=… npx tsx scripts/psychenomicon-deslop.ts audit
 *   ENRICH_SECRET=… npx tsx scripts/psychenomicon-deslop.ts propose [--min-hits 3] [--out deslop.json]
 *   ENRICH_SECRET=… npx tsx scripts/psychenomicon-deslop.ts apply deslop.json
 *
 * "propose" writes two files: the JSON that "apply" consumes, and a .md
 * next to it with before/after text for reading. Nothing is written to the
 * DB until "apply", and "apply" only sends proposals that passed the guards.
 * Delete an entry from the JSON to skip that chapter.
 *
 * CODEX_BASE_URL overrides the target (default https://cultcodex.me).
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";

const BASE = (process.env.CODEX_BASE_URL ?? "https://cultcodex.me").replace(/\/$/, "");
const SECRET = process.env.ENRICH_SECRET;
const BATCH = 5;

type AuditRow = { chapterNumber: number; title: string; hits: number; density: number; top: string[] };
type Prose = { canonText: string; interpretationText: string; mythicText: string; emergingSignals: string[] };
type Proposal = {
  chapterNumber: number;
  title?: string;
  ok: boolean;
  problems: string[];
  hitsBefore?: number;
  hitsAfter?: number | null;
  before?: Prose;
  rewrite?: Prose & { chapterNumber: number; updatedAt: string };
};

async function call<T>(payload: object): Promise<T> {
  const res = await fetch(`${BASE}/api/admin/psychenomicon/deslop`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-enrich-secret": SECRET ?? "" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text) as T;
}

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

async function audit(minHits: number) {
  return call<{ total: number; flagged: number; totalHits: number; chapters: AuditRow[] }>({ mode: "audit", minHits });
}

function reviewMarkdown(proposals: Proposal[]): string {
  const out: string[] = ["# Psychenomicon de-slop proposals", ""];
  for (const p of proposals) {
    out.push(`## CH.${String(p.chapterNumber).padStart(3, "0")} ${p.title ?? ""}`);
    out.push(`${p.ok ? "OK" : "REJECTED"} · hits ${p.hitsBefore ?? "?"} → ${p.hitsAfter ?? "?"}`);
    if (p.problems.length) out.push("", ...p.problems.map((x) => `- ${x}`));
    if (p.before && p.rewrite) {
      for (const f of ["canonText", "interpretationText", "mythicText"] as const) {
        out.push("", `### ${f}`, "", "**Before**", "", p.before[f], "", "**After**", "", p.rewrite[f] ?? "");
      }
      out.push("", "### emergingSignals", "", "**Before**", ...p.before.emergingSignals.map((s) => `- ${s}`));
      out.push("", "**After**", ...(p.rewrite.emergingSignals ?? []).map((s) => `- ${s}`));
    }
    out.push("", "---", "");
  }
  return out.join("\n");
}

async function main() {
  if (!SECRET) throw new Error("ENRICH_SECRET not set");
  const cmd = process.argv[2];

  if (cmd === "audit") {
    const r = await audit(Number(arg("--min-hits", "1")));
    console.log(`${r.flagged}/${r.total} chapters flagged, ${r.totalHits} hits total\n`);
    for (const c of [...r.chapters].sort((a, b) => b.hits - a.hits)) {
      console.log(`CH.${String(c.chapterNumber).padStart(3, "0")}  ${String(c.hits).padStart(3)}  ${c.title}  [${c.top.join(", ")}]`);
    }
    return;
  }

  if (cmd === "propose") {
    const out = arg("--out", "deslop-proposals.json")!;
    const r = await audit(Number(arg("--min-hits", "1")));
    const nums = r.chapters.map((c) => c.chapterNumber);
    console.log(`Proposing rewrites for ${nums.length}/${r.total} chapters → ${out}`);
    const proposals: Proposal[] = [];
    for (let i = 0; i < nums.length; i += BATCH) {
      const batch = nums.slice(i, i + BATCH);
      try {
        const res = await call<{ results: Proposal[] }>({ mode: "propose", chapterNumbers: batch });
        proposals.push(...res.results);
        for (const p of res.results) {
          console.log(`  CH.${p.chapterNumber}: ${p.ok ? `ok (${p.hitsBefore} → ${p.hitsAfter})` : `rejected: ${p.problems.join("; ")}`}`);
        }
      } catch (e) {
        console.error(`  batch ${batch.join(",")} failed: ${e instanceof Error ? e.message : e}`);
      }
      // Save as we go so a crash mid-run keeps the finished batches.
      writeFileSync(out, JSON.stringify(proposals, null, 2));
      writeFileSync(out.replace(/\.json$/, "") + ".md", reviewMarkdown(proposals));
    }
    const ok = proposals.filter((p) => p.ok).length;
    console.log(`\n${ok} ready to apply, ${proposals.length - ok} rejected. Review ${out.replace(/\.json$/, "")}.md, then run: apply ${out}`);
    return;
  }

  if (cmd === "apply") {
    const file = process.argv[3];
    if (!file) throw new Error("usage: apply <proposals.json>");
    const proposals = JSON.parse(readFileSync(file, "utf8")) as Proposal[];
    const rewrites = proposals.filter((p) => p.ok && p.rewrite).map((p) => p.rewrite!);
    console.log(`Applying ${rewrites.length} rewrites to ${BASE}`);
    for (let i = 0; i < rewrites.length; i += BATCH) {
      const res = await call<{ results: Array<{ chapterNumber: number; status: string; problems?: string[] }> }>({
        mode: "apply",
        rewrites: rewrites.slice(i, i + BATCH),
      });
      for (const r of res.results) console.log(`  CH.${r.chapterNumber}: ${r.status}${r.problems ? ` (${r.problems.join("; ")})` : ""}`);
    }
    return;
  }

  console.log("usage: psychenomicon-deslop.ts audit | propose [--min-hits N] [--out file.json] | apply file.json");
  process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
