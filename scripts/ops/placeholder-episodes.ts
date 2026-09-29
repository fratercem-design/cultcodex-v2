/**
 * Published episodes with placeholder titles (".", "d", "movie", …) and no
 * transcript — streams that were deleted, went private or never really
 * happened, so they sit in the archive as empty pages and count as
 * "missing transcript" forever.
 *
 * READ-ONLY by default: lists every published episode without transcript
 * segments and marks the placeholders.
 *
 *   npx tsx scripts/ops/placeholder-episodes.ts            # report
 *   npx tsx scripts/ops/placeholder-episodes.ts --apply    # set placeholders to draft
 *
 * From GitHub Actions (Run DB Script workflow), which cannot pass flags:
 *   script = ops/placeholder-episodes.ts            → report
 *   script = ops/placeholder-episodes-apply.ts      → apply
 *
 * --apply only moves status published → draft (reversible; the ids are
 * printed so they can be restored with status = 'published').
 */
import "dotenv/config";
import { getPrisma, disconnect } from "../ingest/lib";

/** A title with fewer than 3 letters, or 5 characters or fewer in total. */
export function isPlaceholderTitle(title: string): boolean {
  const t = title.trim();
  const letters = (t.match(/\p{L}/gu) ?? []).length;
  return letters < 3 || t.length <= 5;
}

export async function run(apply: boolean) {
  const prisma = getPrisma();
  const eps = await prisma.episode.findMany({
    where: { status: "published", segments: { none: {} } },
    select: { id: true, slug: true, title: true, episodeNumber: true, airDate: true, youtubeVideoId: true },
    orderBy: [{ airDate: "desc" }],
  });

  const placeholders = eps.filter((e) => isPlaceholderTitle(e.title));
  console.log(`Published episodes without a transcript: ${eps.length}`);
  for (const e of eps) {
    const mark = isPlaceholderTitle(e.title) ? "PLACEHOLDER" : "keep       ";
    const ep = e.episodeNumber != null ? `EP.${e.episodeNumber}` : "EP.-";
    console.log(`  ${mark}  ${e.airDate?.toISOString().slice(0, 10) ?? "no date   "}  ${ep.padEnd(8)} ${JSON.stringify(e.title).slice(0, 60)}  yt=${e.youtubeVideoId ?? "-"}  id=${e.id}`);
  }
  console.log(`Placeholders: ${placeholders.length}`);

  if (!apply) {
    console.log("Report only. Run ops/placeholder-episodes-apply.ts to set these to draft.");
  } else if (placeholders.length) {
    const res = await prisma.episode.updateMany({
      where: { id: { in: placeholders.map((e) => e.id) }, status: "published" },
      data: { status: "draft" },
    });
    console.log(`Set ${res.count} placeholder episode(s) to draft. Ids: ${placeholders.map((e) => e.id).join(",")}`);
  }
  await disconnect();
}

if (process.argv[1]?.endsWith("placeholder-episodes.ts")) {
  run(process.argv.includes("--apply")).catch(async (e) => {
    console.error(e);
    await disconnect();
    process.exit(1);
  });
}
