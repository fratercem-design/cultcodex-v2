// Read-only audit: Psychenomicon chapters whose source episode has NO transcript
// (no transcript segments and no raw transcript) — i.e. chapters generated from nothing.
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const prisma = getPrisma();

async function main() {
  const chapters = await prisma.psychenomiconChapter.findMany({
    select: {
      id: true, chapterNumber: true, title: true, slug: true, createdAt: true,
      canonText: true,
      episode: {
        select: {
          id: true, episodeNumber: true, title: true, airDate: true, transcriptRaw: true,
          _count: { select: { segments: true } },
        },
      },
      _count: { select: { entityAppearances: true, threadChapters: true, archetypeEvents: true } },
    },
    orderBy: { chapterNumber: "asc" },
  });

  const noEpisode = chapters.filter((c) => !c.episode);
  const noTranscript = chapters.filter(
    (c) => c.episode && c.episode._count.segments === 0 && !c.episode.transcriptRaw?.trim()
  );

  console.log(`total chapters: ${chapters.length}`);
  console.log(`chapters with no episode at all: ${noEpisode.length}`);
  console.log(`chapters whose episode has NO transcript: ${noTranscript.length}`);
  for (const c of noTranscript) {
    console.log(
      `  ch#${c.chapterNumber} "${c.title}" ep#${c.episode!.episodeNumber ?? "?"} "${c.episode!.title?.slice(0, 50)}" ` +
      `air=${c.episode!.airDate?.toISOString().slice(0, 10) ?? "?"} canonLen=${c.canonText?.trim().length ?? 0} ` +
      `appearances=${c._count.entityAppearances} threads=${c._count.threadChapters} events=${c._count.archetypeEvents}`
    );
  }
}

main().finally(() => disconnect());
