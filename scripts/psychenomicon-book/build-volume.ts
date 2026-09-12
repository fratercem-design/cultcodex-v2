#!/usr/bin/env npx tsx
// scripts/psychenomicon-book/build-volume.ts
//
// Compile a run of illustrated Psychenomicon chapters into a single PDF.
//
//   npx tsx scripts/psychenomicon-book/build-volume.ts --volume 2 --out out/vol-2.pdf
//   npx tsx scripts/psychenomicon-book/build-volume.ts --volume 2 --persist
//
// Flags:
//   --volume N    which volume to compile (default 1)
//   --count N     max chapters (default 24)
//   --after N     exclusive lower bound on chapterNumber; normally inferred
//                 from the previous volume's BookEdition row
//   --out FILE    write the PDF to disk (default out/psychenomicon-vol-<N>.pdf)
//   --persist     ALSO upsert into BookEdition — this publishes to the live store
//
// This CLI defaults to a DRY RUN. It previously always wrote to BookEdition;
// since that table is what the storefront serves to paying readers, writing is
// now opt-in via --persist. The admin HTTP route (/api/admin/build-book) still
// persists by default — that remains the intended publish path.
//
// The book layout itself lives in src/lib/book/build-volume.ts; this file used
// to carry a second copy of it, which is exactly how two "identical" book
// designs drift apart.

import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildPsychenomiconVolume, roman } from "../../src/lib/book/build-volume";
import { getPrisma, disconnect } from "../ingest/lib";

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const flag = (name: string) => process.argv.includes(name);

async function main() {
  const prisma = getPrisma();
  const volume = parseInt(arg("--volume", "1"), 10);
  const count = parseInt(arg("--count", "24"), 10);
  const afterRaw = arg("--after", "");
  const persist = flag("--persist");
  const outFile = resolve(
    arg("--out", `out/psychenomicon-vol-${volume}.pdf`)
  );

  console.log(
    `Compiling Volume ${roman(volume)} — ${persist ? "PERSIST (writes to BookEdition)" : "dry run (no database write)"}`
  );

  const result = await buildPsychenomiconVolume(prisma, {
    volume,
    count,
    persist,
    ...(afterRaw ? { afterChapter: parseInt(afterRaw, 10) } : {}),
  });

  if (!result.ok) {
    console.error(`✗ ${result.reason}`);
    await disconnect();
    process.exit(1);
  }

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, Buffer.from(result.bytes));

  console.log(`✓ ${result.title}`);
  console.log(`  chapters : ${result.chapters} (CH.${result.chapterFrom}–CH.${result.chapterTo})`);
  console.log(`  pages    : ${result.pageCount}`);
  console.log(`  size     : ${result.sizeMB} MB`);
  console.log(`  file     : ${outFile}`);
  console.log(`  database : ${result.persisted ? `upserted as ${result.sku}` : "not written (dry run)"}`);
  if (result.missingArt.length === 0) {
    console.log(`  art      : all ${result.chapters} chapters illustrated`);
  } else {
    console.log(
      `  art      : MISSING for ${result.missingArt.length}/${result.chapters} chapters -> CH.` +
        result.missingArt.join(", CH.")
    );
    console.log("             (an unillustrated volume is probably not shippable — check R2 credentials)");
  }

  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
