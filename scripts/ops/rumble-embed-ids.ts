/**
 * Backfill Episode.rumbleEmbedId from the committed Rumble index. Rumble's
 * embed player takes the player id, not the page id in rumbleVideoId, so
 * every Rumble embed built from rumbleVideoId returned 410 Gone.
 *
 * Read-only by default; the -apply wrapper writes.
 */
import { readFileSync } from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "../ingest/lib";
import { parseIndex, rumbleIdFromUrl } from "./rumble-transcripts";

const DATA_DIR = path.resolve(__dirname, "../ingest/data/rumble-transcripts");

export async function run(apply: boolean) {
  const prisma = getPrisma();
  const byPage = new Map<string, string>();
  for (const r of parseIndex(readFileSync(path.join(DATA_DIR, "index.csv"), "utf8"))) {
    const page = rumbleIdFromUrl(r.rumbleUrl);
    if (page && r.playerId) byPage.set(page, r.playerId);
  }

  const episodes = await prisma.episode.findMany({
    where: { rumbleVideoId: { in: [...byPage.keys()] } },
    select: { id: true, rumbleVideoId: true, rumbleEmbedId: true },
  });
  const todo = episodes.filter((e) => e.rumbleEmbedId !== byPage.get(e.rumbleVideoId!));
  const withoutIndex = await prisma.episode.count({
    where: { rumbleVideoId: { not: null, notIn: [...byPage.keys()] }, rumbleEmbedId: null },
  });

  console.log(
    `${apply ? "APPLY" : "REPORT (read-only)"} — ${byPage.size} indexed Rumble videos · ` +
      `${episodes.length} episodes linked · ${todo.length} need an embed id · ` +
      `${withoutIndex} Rumble episodes not in the index (no player id known)`,
  );
  if (apply) {
    for (const e of todo) {
      await prisma.episode.update({ where: { id: e.id }, data: { rumbleEmbedId: byPage.get(e.rumbleVideoId!) } });
    }
    console.log(`Summary: set ${todo.length} embed ids`);
  }
  await disconnect();
}

if (process.argv[1]?.endsWith("rumble-embed-ids.ts")) {
  run(process.argv.includes("--apply")).catch(async (e) => {
    console.error(e);
    await disconnect();
    process.exit(1);
  });
}
