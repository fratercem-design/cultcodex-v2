/**
 * List the 60 enrichment JSON files whose slug doesn't match any
 * Episode in the DB. We need to know whether these are real missed
 * episodes (should be ingested) or orphan files from renames/deletes.
 */
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";
import * as fs from "node:fs";
import * as path from "node:path";

(async () => {
  const p = getPrisma();
  const eps = await p.episode.findMany({ select: { slug: true } });
  const slugs = new Set(eps.map((e) => e.slug));

  const dir = path.join(__dirname, "enrich", "data");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  const orphans = files.filter((f) => !slugs.has(f.replace(/\.json$/, "")));
  console.log(`Orphan enrichment files: ${orphans.length}`);
  for (const f of orphans) {
    const p_ = path.join(dir, f);
    let title = "(unknown)";
    let summaryShort = "";
    try {
      const data = JSON.parse(fs.readFileSync(p_, "utf-8"));
      title = data.title ?? data.episodeTitle ?? "(no title field)";
      summaryShort = (data.summaryShort ?? "").slice(0, 100);
    } catch {}
    console.log(`  ${f.replace(/\.json$/, "")}`);
    if (title !== "(unknown)") console.log(`    title: ${title}`);
    if (summaryShort) console.log(`    short: ${summaryShort}`);
  }

  await disconnect();
})();
