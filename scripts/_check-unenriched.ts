import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const p = getPrisma();
  const unenriched = await p.episode.findMany({
    where: { summaryLong: null },
    select: {
      episodeNumber: true,
      title: true,
      slug: true,
      segments: { select: { id: true }, take: 1 },
    },
    orderBy: { episodeNumber: "asc" },
  });

  console.log(unenriched.length + " unenriched episodes:\n");
  for (const ep of unenriched) {
    const hasSegments = ep.segments.length > 0;
    console.log(
      "  EP." + (ep.episodeNumber ?? "?") + " | " + (hasSegments ? "HAS_TX" : "NO_TX ") + " | " + ep.slug
    );
  }

  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
