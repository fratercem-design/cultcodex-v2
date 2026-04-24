/**
 * For each orphan enrichment slug, check if an Episode exists with the
 * same episode number (extracted from "-ep-NN" suffix). If yes, the
 * orphan is just a stale slug duplicate; if no, the episode is missing.
 */
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";
import * as fs from "node:fs";
import * as path from "node:path";

(async () => {
  const p = getPrisma();
  const dir = path.join(__dirname, "enrich", "data");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  const eps = await p.episode.findMany({ select: { slug: true, episodeNumber: true } });
  const slugs = new Set(eps.map((e) => e.slug));
  const epNumToSlug = new Map<number, string>();
  for (const e of eps) if (e.episodeNumber != null) epNumToSlug.set(e.episodeNumber, e.slug);

  const orphans = files.filter((f) => !slugs.has(f.replace(/\.json$/, "")));
  let covered = 0;
  let missing = 0;
  for (const f of orphans) {
    const slug = f.replace(/\.json$/, "");
    const m = slug.match(/-ep-(\d+)$/);
    if (!m) {
      console.log(`  no ep number: ${slug}`);
      missing++;
      continue;
    }
    const n = parseInt(m[1], 10);
    const existing = epNumToSlug.get(n);
    if (existing) {
      covered++;
    } else {
      missing++;
      console.log(`  ep ${n} MISSING from DB: ${slug}`);
    }
  }
  console.log(`\nOrphan files: ${orphans.length}`);
  console.log(`  covered by existing episode (different slug): ${covered}`);
  console.log(`  truly missing: ${missing}`);

  await disconnect();
})();
