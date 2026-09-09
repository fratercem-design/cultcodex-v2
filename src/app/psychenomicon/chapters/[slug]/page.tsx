import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { isFreePreviewChapter } from "@/lib/psychenomicon";
import { buildMetadata } from "@/lib/seo";
import { LayerViewer } from "@/components/psychenomicon/layer-viewer";
import { TimelineStrip } from "@/components/psychenomicon/timeline-strip";
import { ScrollReveal } from "@/components/psychenomicon/scroll-reveal";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // Deliberately NOT `.catch(() => null)`. Now that a missing row produces a
  // real 404, swallowing errors here would turn a transient database failure
  // into a 404 too — and this database hibernates when idle, so a wake-up blip
  // could hand Google a 404 for a chapter that exists and get it deindexed.
  // Letting the error propagate yields a 500, which crawlers retry.
  const chapter = await prisma.psychenomiconChapter.findUnique({
    where: { slug },
    select: { title: true, chapterNumber: true },
  });
  if (!chapter) notFound();

  // A sealed chapter shows a crawler the same ~1,450-character "This chapter is
  // sealed" shell as every other sealed chapter. There were 2,990 of them, all
  // `index, follow` and all in the sitemap — near-duplicate thin content making
  // up roughly 9% of the site's URLs, which is a sitewide quality signal rather
  // than a per-page one. Only the free-preview chapters have anything for a
  // crawler to read, so only those stay indexable. `follow` is kept either way
  // so the links out of the shell still pass equity.
  const isFree = await isFreePreviewChapter(chapter.chapterNumber).catch(() => false);
  const label = `CH.${String(chapter.chapterNumber).padStart(3, "0")} ${chapter.title}`;

  // buildMetadata is what every other content route uses, and it supplies the
  // absolute canonical plus the OpenGraph and Twitter tags these pages were
  // missing entirely. The title is overridden back to the existing shape so the
  // change does not quietly rewrite 2,990 titles.
  const base = buildMetadata({
    title: label,
    description: isFree
      ? `Chapter ${chapter.chapterNumber} of the Psychenomicon: ${chapter.title}. A living record of evolving patterns from the Cult of Psyche archive.`
      : `Chapter ${chapter.chapterNumber} of the Psychenomicon. A living record of evolving patterns.`,
    path: `/psychenomicon/chapters/${slug}`,
  });

  return {
    ...base,
    title: `${label} — Psychenomicon`,
    robots: { index: isFree, follow: true },
  };
}

export default async function ChapterPage({ params }: PageProps) {
  const { slug } = await params;

  const user = await getCurrentUser();
  const subscribed = user ? await isSubscribed(user.id).catch(() => false) : false;

  // Free-preview pipeline: a configured set of chapters is readable by anyone.
  const gateRow = await prisma.psychenomiconChapter
    .findUnique({ where: { slug }, select: { chapterNumber: true, title: true } });
  if (!gateRow) notFound();
  const isFreePreview = await isFreePreviewChapter(gateRow.chapterNumber);
  const canRead = subscribed || isFreePreview;

  if (!canRead) {
    return (
      <main id="main-content" className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet-text">{"/// initiate_only"}</p>
          {/* The shell had no <h1> at all, so every sealed chapter was a page
              with no heading. The title is already public in <title> and in the
              chapter index, so naming it here reveals nothing the crawler
              cannot already see, and it gives the page a real document
              outline. The body stays sealed. */}
          <h1 className="font-display text-xl font-bold text-text-primary">
            <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
              {`CH.${String(gateRow.chapterNumber).padStart(3, "0")}`}
            </span>
            {gateRow.title}
          </h1>
          <p className="font-display text-lg font-bold text-text-primary">This chapter is sealed.</p>
          <Link href="/premium#access" className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 px-5 py-2 font-mono text-xs font-bold text-accent-violet-text hover:bg-accent-violet/20 transition-colors">
            Become Initiate+ →
          </Link>
          <p className="pt-2">
            <Link href="/psychenomicon/chapters" className="font-mono text-[11px] text-accent-gold-text/80 hover:underline">
              ← All chapters
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const chapter = await prisma.psychenomiconChapter.findUnique({
    where: { slug },
    include: {
      episode: { select: { title: true, episodeNumber: true, airDate: true, slug: true } },
      entityAppearances: {
        include: { entity: { select: { name: true, slug: true, primaryArchetype: true, radarData: true } } },
      },
      threadChapters: {
        include: { thread: { select: { title: true, slug: true, status: true } } },
      },
    },
  });

  // Same reasoning as generateMetadata: this feeds notFound(), so a swallowed
  // error would be indistinguishable from a chapter that does not exist. The
  // gate query above already proved the row is there, so reaching null here
  // means a genuine race (deleted mid-request); anything else should surface
  // as a 500 rather than a 404 a crawler will act on.
  if (!chapter) notFound();

  // Adjacent + windowed chapters in BROADCAST order (episode air date).
  // chapterNumber is a stable id, not the chronological rank, so neighbors
  // are found by air date — not by adjacent numbers.
  const curAir = chapter.episode?.airDate ?? null;
  const WINDOW = 12;
  type NeighborRow = { slug: string; chapterNumber: number; title: string; isMajorEvent: boolean };
  const adjSelect = { slug: true, chapterNumber: true, title: true } as const;
  const winSelect = { slug: true, chapterNumber: true, title: true, isMajorEvent: true } as const;

  const [prevChapter, nextChapter, before, after, newestRow] = await Promise.all([
    curAir
      ? prisma.psychenomiconChapter.findFirst({ where: { episode: { airDate: { lt: curAir } } }, orderBy: { episode: { airDate: "desc" } }, select: adjSelect })
      : Promise.resolve(null),
    curAir
      ? prisma.psychenomiconChapter.findFirst({ where: { episode: { airDate: { gt: curAir } } }, orderBy: { episode: { airDate: "asc" } }, select: adjSelect })
      : Promise.resolve(null),
    curAir
      ? prisma.psychenomiconChapter.findMany({ where: { episode: { airDate: { lt: curAir } } }, orderBy: { episode: { airDate: "desc" } }, take: WINDOW, select: winSelect })
      : Promise.resolve([] as NeighborRow[]),
    curAir
      ? prisma.psychenomiconChapter.findMany({ where: { episode: { airDate: { gt: curAir } } }, orderBy: { episode: { airDate: "asc" } }, take: WINDOW, select: winSelect })
      : Promise.resolve([] as NeighborRow[]),
    prisma.psychenomiconChapter.findFirst({ orderBy: { episode: { airDate: "desc" } }, select: { slug: true } }),
  ]).catch(() => [null, null, [] as NeighborRow[], [] as NeighborRow[], null] as [NeighborRow | null, NeighborRow | null, NeighborRow[], NeighborRow[], { slug: string } | null]);

  // Chronological window: earlier (reversed to ascending) + current + later.
  const windowChapters: NeighborRow[] = [
    ...[...before].reverse(),
    { slug: chapter.slug, chapterNumber: chapter.chapterNumber, title: chapter.title, isMajorEvent: chapter.isMajorEvent },
    ...after,
  ];
  const newestSlug = newestRow?.slug ?? chapter.slug;

  type ArchetypeEntry = { name: string; archetype: string; significance: string };
  const archetypes = (chapter.archetypesData as ArchetypeEntry[] | null) ?? [];

  // AI-generated art URLs (set by the art pipeline script)
  type ArtImageUrls = { cover?: string; scene_01?: string; scene_02?: string; scene_03?: string };
  const artUrls = (chapter.artImageUrls as ArtImageUrls | null) ?? {};

  const timelineNodes = windowChapters.map((c) => ({
    slug: c.slug,
    chapterNumber: c.chapterNumber,
    title: c.title,
    isMajorEvent: c.isMajorEvent,
    isNewest: c.slug === newestSlug,
  }));

  return (
    <main className="min-h-screen bg-void">
      {/* Free-preview banner for non-subscribers */}
      {isFreePreview && !subscribed && (
        <div className="border-b border-accent-gold/30 bg-accent-gold/5 px-4 py-2.5">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold-text">
              {"/// free_preview"}
            </span>
            <span className="font-mono text-[10px] text-text-muted">
              This chapter is unsealed for all. The rest of the record awaits initiates.
            </span>
            <Link
              href="/premium#access"
              className="font-mono text-[10px] font-bold text-accent-gold-text hover:underline"
            >
              Become Initiate+ →
            </Link>
          </div>
        </div>
      )}
      {/* Chapter header */}
      <header className={`border-b py-10 px-4 ${chapter.isMajorEvent ? "border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-void" : "border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void"}`}>
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <p className={`font-mono text-[9px] uppercase tracking-[0.5em] ${chapter.isMajorEvent ? "text-accent-gold-text/80" : "text-accent-violet-text/70"}`}>
            ψ PSYCHENOMICON · CH.{String(chapter.chapterNumber).padStart(3, "0")} ψ
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
              {chapter.isMajorEvent && <span className="text-accent-gold-text mr-2">✦</span>}
              {chapter.title}
            </h1>
            {(chapter as { status?: string }).status && (
              <span className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[9px] uppercase ${
                (chapter as { status?: string }).status === "contested"
                  ? "border-red-500/40 text-red-400 bg-red-500/10"
                  : (chapter as { status?: string }).status === "evolving"
                  ? "border-accent-gold/40 text-accent-gold-text bg-accent-gold/10"
                  : "border-accent-violet/30 text-accent-violet-text/70 bg-accent-violet/5"
              }`}>
                {(chapter as { status?: string }).status}
              </span>
            )}
          </div>
          {chapter.episode && (
            <p className="font-mono text-xs text-text-muted">
              Source:{" "}
              <Link href={`/episodes/${chapter.episode.slug}`} className="text-text-primary hover:text-accent-violet-text transition-colors">
                {chapter.episode.episodeNumber ? `EP.${String(chapter.episode.episodeNumber).padStart(3, "0")} · ` : ""}
                {chapter.episode.title}
              </Link>
              {chapter.episode.airDate && (
                <span className="ml-2 opacity-60">
                  ({new Date(chapter.episode.airDate).toLocaleDateString()})
                </span>
              )}
            </p>
          )}

          {/* Archetype badges */}
          {archetypes.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {archetypes.map((a) => (
                <Link
                  key={a.name}
                  href={`/psychenomicon/entities/${a.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="inline-flex items-center gap-1.5 rounded border border-accent-violet/30 bg-accent-violet/10 px-2.5 py-1 font-mono text-[9px] text-accent-violet-text hover:bg-accent-violet/20 transition-colors"
                >
                  <span className="text-text-muted">{a.name}</span>
                  <span>·</span>
                  <span>{a.archetype}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Cover art — full-bleed cinematic image generated by the art pipeline */}
      {artUrls.cover && (
        <div className="relative w-full overflow-hidden bg-void" style={{ maxHeight: "520px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artUrls.cover}
            alt={`Cover art for ${chapter.title}`}
            className="w-full object-cover object-top"
            style={{ maxHeight: "520px" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-void pointer-events-none" />
          <div className="absolute bottom-3 right-4">
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">
              AI-generated · Psychenomicon Art
            </span>
          </div>
        </div>
      )}

      {/* Timeline strip */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl">
          <TimelineStrip chapters={timelineNodes} currentSlug={chapter.slug} />
        </div>
      </div>

      {/* Main layout */}
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-10 lg:grid-cols-3">
        {/* Chapter body */}
        <article className="lg:col-span-2 space-y-8">
          <ScrollReveal delay={100}>
            <LayerViewer
              canonText={chapter.canonText}
              interpretationText={chapter.interpretationText}
              mythicText={chapter.mythicText}
              entities={chapter.entityAppearances.map((ea) => ({
                name: ea.entity.name,
                slug: ea.entity.slug,
                primaryArchetype: ea.entity.primaryArchetype,
              }))}
            />
          </ScrollReveal>

          {/* Emerging signals */}
          {chapter.emergingSignals.length > 0 && (
            <ScrollReveal delay={300}>
              <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 p-5 space-y-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold-text">{"/// emerging_signals"}</p>
                {chapter.emergingSignals.map((signal, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-accent-gold-text font-mono text-[10px] mt-0.5 flex-shrink-0">▸</span>
                    <p className="text-xs text-text-muted leading-relaxed">{signal}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          )}

          {/* Scene images — rendered after chapter text if art has been generated */}
          {(artUrls.scene_01 || artUrls.scene_02 || artUrls.scene_03) && (
            <ScrollReveal delay={400}>
              <div className="space-y-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">
                  {"/// visual_record"}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {([
                    { key: "scene_01" as const, label: "I" },
                    { key: "scene_02" as const, label: "II" },
                    { key: "scene_03" as const, label: "III" },
                  ] as const).map(({ key, label }) =>
                    artUrls[key] ? (
                      <div key={key} className="relative overflow-hidden rounded border border-accent-violet/20 bg-surface group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={artUrls[key]}
                          alt={`Scene ${label} — ${chapter.title}`}
                          className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          style={{ aspectRatio: "2/3" }}
                        />
                        <div className="absolute bottom-2 left-2">
                          <span className="font-mono text-[9px] text-white/40 bg-void/60 px-1.5 py-0.5 rounded">
                            {label}
                          </span>
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
                <p className="font-mono text-[9px] text-text-muted/60 text-right">
                  AI-generated imagery · Psychenomicon Art Pipeline
                </p>
              </div>
            </ScrollReveal>
          )}

          {/* Prev / Next navigation */}
          <div className="flex justify-between gap-4 border-t border-border pt-6">
            {prevChapter ? (
              <Link
                href={`/psychenomicon/chapters/${prevChapter.slug}`}
                className="group flex flex-col gap-1 max-w-[45%]"
              >
                <span className="font-mono text-[9px] text-text-muted group-hover:text-accent-violet-text transition-colors">← Previous</span>
                <span className="font-mono text-[10px] text-text-muted/60">CH.{String(prevChapter.chapterNumber).padStart(3, "0")}</span>
                <span className="text-xs text-text-primary group-hover:text-accent-violet-text transition-colors line-clamp-2">{prevChapter.title}</span>
              </Link>
            ) : <div />}

            {nextChapter ? (
              <Link
                href={`/psychenomicon/chapters/${nextChapter.slug}`}
                className="group flex flex-col gap-1 max-w-[45%] text-right"
              >
                <span className="font-mono text-[9px] text-text-muted group-hover:text-accent-violet-text transition-colors">Next →</span>
                <span className="font-mono text-[10px] text-text-muted/60">CH.{String(nextChapter.chapterNumber).padStart(3, "0")}</span>
                <span className="text-xs text-text-primary group-hover:text-accent-violet-text transition-colors line-clamp-2">{nextChapter.title}</span>
              </Link>
            ) : <div />}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Entities in this chapter */}
          {chapter.entityAppearances.length > 0 && (
            <div className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">{"/// entities_present"}</p>
              {chapter.entityAppearances.map((ea) => (
                <Link
                  key={ea.entity.slug}
                  href={`/psychenomicon/entities/${ea.entity.slug}`}
                  className="group flex items-start gap-3 rounded border border-border bg-surface p-3 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-medium text-text-primary group-hover:text-accent-violet-text transition-colors">
                      {ea.entity.name}
                    </p>
                    {ea.archetypeAt && (
                      <p className="font-mono text-[9px] text-accent-violet-text/80 mt-0.5">{ea.archetypeAt}</p>
                    )}
                    {ea.significance && (
                      <p className="text-[10px] text-text-muted leading-relaxed mt-1 line-clamp-2">{ea.significance}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Active threads */}
          {chapter.threadChapters.length > 0 && (
            <div className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">{"/// thread_connections"}</p>
              {chapter.threadChapters.map((tc) => (
                <Link
                  key={tc.thread.slug}
                  href={`/psychenomicon/threads/${tc.thread.slug}`}
                  className="group flex items-center gap-2.5 rounded border border-border bg-surface px-3 py-2.5 hover:border-accent-gold/30 transition-all"
                >
                  <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${tc.thread.status === "emerging" ? "bg-accent-gold animate-pulse" : "bg-accent-violet"}`} />
                  <p className="font-mono text-[10px] text-text-primary group-hover:text-accent-gold-text transition-colors truncate">
                    {tc.thread.title}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {/* Back to index */}
          <Link
            href="/psychenomicon"
            className="block font-mono text-[10px] text-text-muted hover:text-accent-violet-text transition-colors"
          >
            ← Return to Psychenomicon
          </Link>
        </aside>
      </div>
    </main>
  );
}
