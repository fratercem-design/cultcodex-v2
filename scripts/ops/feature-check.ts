/**
 * Read-only: runs the On This Day and feud queries the way the app does and
 * prints counts or the error, so an empty page can be told apart from a
 * failing query.
 */
import { getPrisma, disconnect } from "../ingest/lib";

async function main() {
  const p = getPrisma();
  const month = 9, day = 24, year = new Date().getUTCFullYear();
  const step = async (label: string, fn: () => Promise<unknown>) => {
    try {
      console.log(`${label}:`, await fn());
    } catch (e) {
      console.log(`${label}: ERROR ${e instanceof Error ? e.message : e}`);
    }
  };

  await step("published episodes with airDate", () =>
    p.episode.count({ where: { status: "published", airDate: { not: null } } }));
  await step("episodes on 09-24 (app query)", async () =>
    (await p.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Episode"
      WHERE status = 'published' AND "airDate" IS NOT NULL
        AND EXTRACT(MONTH FROM "airDate") = ${month}
        AND EXTRACT(DAY FROM "airDate") = ${day}
        AND EXTRACT(YEAR FROM "airDate") < ${year}
      LIMIT 24`).length);
  await step("episodes on 09-24 (int casts)", async () =>
    (await p.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Episode"
      WHERE status = 'published' AND "airDate" IS NOT NULL
        AND EXTRACT(MONTH FROM "airDate")::int = ${month}::int
        AND EXTRACT(DAY FROM "airDate")::int = ${day}::int
        AND EXTRACT(YEAR FROM "airDate")::int < ${year}::int
      LIMIT 24`).length);
  await step("relationship events by type", async () =>
    (await p.relationshipEvent.groupBy({ by: ["relationType"], _count: true })).map((r) => `${r.relationType} ${r._count}`));
  await step("relationship events with occurredAt", () =>
    p.relationshipEvent.count({ where: { occurredAt: { not: null } } }));
  await disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await disconnect();
  process.exit(1);
});
