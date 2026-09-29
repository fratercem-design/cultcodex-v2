import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";
import { findSlop, slopDensity } from "../src/lib/psychenomicon-slop";

// READ-ONLY. Same scoring as the deslop route's "audit" mode, but straight
// against the DB, so it can run from the Run DB Script workflow before the
// route is deployed. Prints a summary, the worst chapters, and the most
// common hits across the whole Psychenomicon.

async function main() {
  const prisma = getPrisma();
  const chapters = await prisma.psychenomiconChapter.findMany({
    select: {
      chapterNumber: true, title: true,
      canonText: true, interpretationText: true, mythicText: true, emergingSignals: true,
    },
    orderBy: { chapterNumber: "asc" },
  });

  const overall = new Map<string, number>();
  const byLayer = { canonText: 0, interpretationText: 0, mythicText: 0, emergingSignals: 0 };
  const rows = chapters.map((c) => {
    const layers = {
      canonText: c.canonText,
      interpretationText: c.interpretationText,
      mythicText: c.mythicText,
      emergingSignals: c.emergingSignals.join("\n"),
    };
    let hits = 0;
    const counts = new Map<string, number>();
    for (const [layer, text] of Object.entries(layers) as Array<[keyof typeof layers, string]>) {
      const found = findSlop(text);
      byLayer[layer] += found.length;
      hits += found.length;
      for (const h of found) {
        const key = h.kind === "word" || h.kind === "phrase" ? h.match : `[${h.kind}]`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
        overall.set(key, (overall.get(key) ?? 0) + 1);
      }
    }
    const all = Object.values(layers).join("\n\n");
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => `${k}×${n}`);
    return { n: c.chapterNumber, title: c.title, hits, density: slopDensity(all), chars: all.length, top };
  });

  const total = rows.reduce((s, r) => s + r.hits, 0);
  const chars = rows.reduce((s, r) => s + r.chars, 0);
  const bucket = (min: number, max = Infinity) => rows.filter((r) => r.hits >= min && r.hits < max).length;

  console.log(`CHAPTERS ${rows.length} · HITS ${total} · per 1k chars ${((total / Math.max(1, chars)) * 1000).toFixed(2)}`);
  console.log(`Distribution: 0 hits ${bucket(0, 1)} · 1-2 ${bucket(1, 3)} · 3-5 ${bucket(3, 6)} · 6-9 ${bucket(6, 10)} · 10+ ${bucket(10)}`);
  console.log(`By layer: canon ${byLayer.canonText} · interpretation ${byLayer.interpretationText} · mythic ${byLayer.mythicText} · signals ${byLayer.emergingSignals}`);

  console.log("\nMost common hits:");
  for (const [k, n] of [...overall.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
    console.log(`  ${String(n).padStart(5)}  ${k}`);
  }

  console.log("\nWorst 30 chapters:");
  for (const r of [...rows].sort((a, b) => b.hits - a.hits).slice(0, 30)) {
    console.log(`  CH.${String(r.n).padStart(4, "0")}  ${String(r.hits).padStart(3)} hits  ${r.density.toFixed(2)}/1k  ${r.title}  [${r.top.join(", ")}]`);
  }

  const threshold = [1, 3, 5, 10].map((t) => `≥${t}: ${rows.filter((r) => r.hits >= t).length}`).join(" · ");
  console.log(`\nChapters that "propose --min-hits N" would pick up: ${threshold}`);

  await disconnect();
}

main().catch(async (e) => {
  console.error(e instanceof Error ? e.message : e);
  await disconnect().catch(() => {});
  process.exit(1);
});
