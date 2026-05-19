import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
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
  const chapter = await prisma.psychenomiconChapter.findUnique({
    where: { slug },
    select: { title: true, chapterNumber: true },
  });
  if (!chapter) return { title: "Chapter Not Found — CULT CODEX" };
  return {
    title: `CH.${String(chapter.chapterNumber).padStart(3, "0")} ${chapter.title} — Psychenomicon`,
    description: `Chapter ${chapter.chapterNumber} of the Psychenomicon. A living record of evolving patterns.`,
  };
}

export default async function ChapterPage({ params }: PageProps) {
  const { slug } = await params;

  const user = await getCurrentUser();
  const canRead = user ? await isSubscribed(user.id).catch(() => false) : false;

  if (!canRead) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet">/// initiate_only</p>
          <p className="font-display text-xl font-bold text-text-primary">This chapter is sealed.</p>
          <Link href="/premium#access" className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 px-5 py-2 font-mono text-xs font-bold text-accent-violet hover:bg-accent-violet/20 transition-colors">
            Become Initiate+ →
          </Link>
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
  }).catch(() => null);

  if (!chapter) notFound();

  // Adjacent chapters
  const [prevChapter, nextChapter, allChapters] = await Promise.all([
    prisma.psychenomiconChapter.findFirst({
      where: { chapterNumber: { lt: chapter.chapterNumber } },
      orderBy: { chapterNumber: "desc" },
      select: { slug: true, chapterNumber: true, title: true },
    }),
    prisma.psychenomiconChapter.findFirst({
      where: { chapterNumber: { gt: chapter.chapterNumber } },
      orderBy: { chapterNumber: "asc" },
      select: { slug: true, chapterNumber: true, title: true },
    }),
    prisma.psychenomiconChapter.findMany({
      orderBy: { chapterNumber: "asc" },
      select: { slug: true, chapterNumber: true, title: true, isMajorEvent: true },
    }),
  ]).catch(() => [null, null, []] as [null, null, never[]]);

  type ArchetypeEntry = { name: string; archetype: string; significance: string };
  const archetypes = (chapter.archetypesData as ArchetypeEntry[] | null) ?? [];

  const timelineNodes = allChapters.map((c, i) => ({
    slug: c.slug,
    chapterNumber: c.chapterNumber,
    title: c.title,
    isMajorEvent: c.isMajorEvent,
    isNewest: i === allChapters.length - 1,
  }));

  return (
    <main className="min-h-screen bg-void">
      {/* Chapter header */}
      <header className={`border-b py-10 px-4 ${chapter.isMajorEvent ? "border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-void" : "border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void"}`}>
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <p className={`font-mono text-[9px] uppercase tracking-[0.5em] ${chapter.isMajorEvent ? "text-accent-gold/60" : "text-accent-violet/60"}`}>
            ψ PSYCHENOMICON · CH.{String(chapter.chapterNumber).padStart(3, "0")} ψ
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
              {chapter.isMajorEvent && <span className="text-accent-gold mr-2">✦</span>}
              {chapter.title}
            </h1>
            {(chapter as { status?: string }).status && (
              <span className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[9px] uppercase ${
                (chapter as { status?: string }).status === "contested"
                  ? "border-red-500/40 text-red-400 bg-red-500/10"
                  : (chapter as { status?: string }).status === "evolving"
                  ? "border-accent-gold/40 text-accent-gold bg-accent-gold/10"
                  : "border-accent-violet/30 text-accent-violet/70 bg-accent-violet/5"
              }`}>
                {(chapter as { status?: string }).status}
              </span>
            )}
          </div>
          {chapter.episode && (
            <p className="font-mono text-xs text-text-muted">
              Source:{" "}
              <Link href={`/episodes/${chapter.episode.slug}`} className="text-text-primary hover:text-accent-violet transition-colors">
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
                  className="inline-flex items-center gap-1.5 rounded border border-accent-violet/30 bg-accent-violet/10 px-2.5 py-1 font-mono text-[9px] text-accent-violet hover:bg-accent-violet/20 transition-colors"
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
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold">/// emerging_signals</p>
                {chapter.emergingSignals.map((signal, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-accent-gold font-mono text-[10px] mt-0.5 flex-shrink-0">▸</span>
                    <p className="text-xs text-text-muted leading-relaxed">{signal}</p>
                  </div>
                ))}
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
                <span className="font-mono text-[9px] text-text-muted group-hover:text-accent-violet transition-colors">← Previous</span>
                <span className="font-mono text-[10px] text-text-muted/60">CH.{String(prevChapter.chapterNumber).padStart(3, "0")}</span>
                <span className="text-xs text-text-primary group-hover:text-accent-violet transition-colors line-clamp-2">{prevChapter.title}</span>
              </Link>
            ) : <div />}

            {nextChapter ? (
              <Link
                href={`/psychenomicon/chapters/${nextChapter.slug}`}
                className="group flex flex-col gap-1 max-w-[45%] text-right"
              >
                <span className="font-mono text-[9px] text-text-muted group-hover:text-accent-violet transition-colors">Next →</span>
                <span className="font-mono text-[10px] text-text-muted/60">CH.{String(nextChapter.chapterNumber).padStart(3, "0")}</span>
                <span className="text-xs text-text-primary group-hover:text-accent-violet transition-colors line-clamp-2">{nextChapter.title}</span>
              </Link>
            ) : <div />}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Entities in this chapter */}
          {chapter.entityAppearances.length > 0 && (
            <div className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">/// entities_present</p>
              {chapter.entityAppearances.map((ea) => (
                <Link
                  key={ea.entity.slug}
                  href={`/psychenomicon/entities/${ea.entity.slug}`}
                  className="group flex items-start gap-3 rounded border border-border bg-surface p-3 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-medium text-text-primary group-hover:text-accent-violet transition-colors">
                      {ea.entity.name}
                    </p>
                    {ea.archetypeAt && (
                      <p className="font-mono text-[9px] text-accent-violet/80 mt-0.5">{ea.archetypeAt}</p>
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
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">/// thread_connections</p>
              {chapter.threadChapters.map((tc) => (
                <Link
                  key={tc.thread.slug}
                  href={`/psychenomicon/threads/${tc.thread.slug}`}
                  className="group flex items-center gap-2.5 rounded border border-border bg-surface px-3 py-2.5 hover:border-accent-gold/30 transition-all"
                >
                  <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${tc.thread.status === "emerging" ? "bg-accent-gold animate-pulse" : "bg-accent-violet"}`} />
                  <p className="font-mono text-[10px] text-text-primary group-hover:text-accent-gold transition-colors truncate">
                    {tc.thread.title}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {/* Back to index */}
          <Link
            href="/psychenomicon"
            className="block font-mono text-[10px] text-text-muted hover:text-accent-violet transition-colors"
          >
            ← Return to Psychenomicon
          </Link>
        </aside>
      </div>
    </main>
  );
}
