import { prisma } from "@/lib/db";
import Link from "next/link";
import { GenerateChapterButton } from "./generate-chapter-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Psychenomicon — Admin — CULT CODEX",
};

export default async function AdminPsychenomiconPage() {
  const [chapters, entities, threads, eligibleEpisodes] = await Promise.all([
    prisma.psychenomiconChapter.findMany({
      orderBy: { chapterNumber: "desc" },
      take: 20,
      select: {
        id: true,
        chapterNumber: true,
        title: true,
        slug: true,
        isMajorEvent: true,
        status: true,
        createdAt: true,
        episode: { select: { title: true, episodeNumber: true, slug: true } },
        _count: { select: { entityAppearances: true } },
      },
    }),
    prisma.psychenomiconEntity.count(),
    prisma.psychenomiconThread.count(),
    // Episodes with transcripts that don't yet have a chapter.
    // NOTE: transcriptRaw doubles as a sentinel field — /api/admin/sync-transcripts
    // writes the literal "no_captions" there to permanently skip episodes YouTube has
    // no captions for. A bare `not: null` therefore matches episodes with NO transcript
    // at all, offering them for chapter generation and burning Claude calls on nothing.
    prisma.episode.findMany({
      where: {
        psychenomiconChapter: null,
        OR: [
          { segments: { some: {} } },
          {
            AND: [
              { transcriptRaw: { not: null } },
              { transcriptRaw: { not: "no_captions" } },
            ],
          },
        ],
        status: "published",
      },
      orderBy: { episodeNumber: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        episodeNumber: true,
        airDate: true,
        slug: true,
        _count: { select: { segments: true } },
      },
    }),
  ]);

  const STATUS_STYLES: Record<string, string> = {
    stable:    "border-accent-violet/30 text-accent-violet-text/70 bg-accent-violet/5",
    contested: "border-red-500/30 text-red-400 bg-red-500/5",
    evolving:  "border-accent-gold/30 text-accent-gold-text bg-accent-gold/5",
  };

  return (
    <main id="main-content" className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-accent-gold">Psychenomicon</h1>
          <p className="font-mono text-xs text-text-muted mt-1">
            {chapters.length > 0 ? `${chapters[0]?.chapterNumber ?? 0}` : "0"} chapters · {entities} entities · {threads} threads
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/psychenomicon/threads"
            target="_blank"
            className="font-mono text-[12px] text-text-muted hover:text-accent-violet-text transition-colors"
          >
            Threads →
          </Link>
          <Link
            href="/psychenomicon/entities"
            target="_blank"
            className="font-mono text-[12px] text-text-muted hover:text-accent-violet-text transition-colors"
          >
            Entities →
          </Link>
          <Link
            href="/psychenomicon"
            target="_blank"
            className="font-mono text-[12px] text-text-muted hover:text-accent-gold-text transition-colors"
          >
            Public page →
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Left: Chapters list */}
        <section className="space-y-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">{"/// chapters"}</p>
          {chapters.length === 0 ? (
            <p className="text-sm text-text-muted italic">No chapters generated yet. Use the panel on the right to generate the first one.</p>
          ) : (
            <div className="space-y-2">
              {chapters.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-4 rounded border px-4 py-3 ${
                    c.isMajorEvent ? "border-accent-gold/30 bg-accent-gold/5" : "border-border bg-surface"
                  }`}
                >
                  <span className={`font-mono text-[12px] w-16 flex-shrink-0 ${c.isMajorEvent ? "text-accent-gold-text" : "text-text-muted"}`}>
                    CH.{String(c.chapterNumber).padStart(3, "0")}{c.isMajorEvent ? " ✦" : ""}
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className={`font-mono text-xs font-medium truncate ${c.isMajorEvent ? "text-accent-gold-text" : "text-text-primary"}`}>
                      {c.title}
                    </p>
                    {c.episode && (
                      <p className="font-mono text-[12px] text-text-muted truncate">
                        {c.episode.episodeNumber ? `EP.${String(c.episode.episodeNumber).padStart(3, "0")} · ` : ""}{c.episode.title}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-[12px] text-text-muted">{c._count.entityAppearances} entities</span>
                    <span className={`font-mono text-[12px] px-1.5 py-0.5 rounded border ${STATUS_STYLES[c.status] ?? STATUS_STYLES.stable}`}>
                      {c.status}
                    </span>
                    <Link
                      href={`/psychenomicon/chapters/${c.slug}`}
                      target="_blank"
                      className="font-mono text-[12px] text-text-muted hover:text-accent-violet-text transition-colors"
                    >
                      view →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Generate panel */}
        <aside className="space-y-6">
          <div className="rounded-lg border border-accent-violet/20 bg-accent-violet/5 p-5 space-y-4">
            <div className="space-y-1">
              <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-violet-text">{"/// generate_chapter"}</p>
              <p className="text-xs text-text-muted leading-relaxed">
                Select an episode with a transcript to generate the next Psychenomicon chapter via Claude.
              </p>
            </div>

            {eligibleEpisodes.length === 0 ? (
              <p className="text-xs text-text-muted italic">
                No eligible episodes found (need published episodes with transcripts that haven&apos;t been chronicled yet).
              </p>
            ) : (
              <GenerateChapterButton episodes={eligibleEpisodes} />
            )}
          </div>

          {/* Stats */}
          <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">{"/// system_state"}</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-accent-violet-text">{chapters.length}</p>
                <p className="font-mono text-[12px] text-text-muted">chapters</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-accent-gold">{entities}</p>
                <p className="font-mono text-[12px] text-text-muted">entities</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-text-primary">{threads}</p>
                <p className="font-mono text-[12px] text-text-muted">threads</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
