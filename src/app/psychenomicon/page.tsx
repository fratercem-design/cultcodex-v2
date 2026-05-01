import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { TimelineStrip } from "@/components/psychenomicon/timeline-strip";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The Psychenomicon — CULT CODEX",
  description: "A living record of evolving patterns. The myth-engine of the Cult of Psyche, built from real transcripts.",
};

function PsychenomiconGate({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-6">
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet">/// access_restricted</p>
      <h2 className="font-display text-2xl font-bold text-accent-violet">The Psychenomicon</h2>
      <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
        A living record of evolving patterns. Every chapter drawn from real transcripts. Every entity tracked across their arc.
        This is not a recap. It is a system.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {!isAuthenticated && (
          <Link
            href="/api/auth/signin"
            className="inline-flex items-center gap-2 rounded border border-border px-5 py-2.5 font-mono text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            Sign in
          </Link>
        )}
        <Link
          href="/premium#access"
          className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 hover:bg-accent-violet/20 px-5 py-2.5 font-mono text-xs font-bold text-accent-violet transition-colors"
        >
          Become Initiate+ — $9/mo →
        </Link>
      </div>
    </div>
  );
}

export default async function PsychenomiconPage() {
  const user = await getCurrentUser();
  const canRead = user ? await isSubscribed(user.id) : false;

  if (!canRead) {
    return (
      <main className="min-h-screen bg-void">
        <PsychenomiconGate isAuthenticated={!!user} />
      </main>
    );
  }

  const [chapters, entities, activeThreads] = await Promise.all([
    prisma.psychenomiconChapter.findMany({
      orderBy: { chapterNumber: "asc" },
      select: {
        id: true,
        slug: true,
        chapterNumber: true,
        title: true,
        isMajorEvent: true,
        emergingSignals: true,
        createdAt: true,
        episode: { select: { episodeNumber: true, airDate: true, title: true } },
      },
    }),
    prisma.psychenomiconEntity.findMany({
      where: { status: { not: "dormant" } },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: { slug: true, name: true, primaryArchetype: true, status: true },
    }),
    prisma.psychenomiconThread.findMany({
      where: { status: { in: ["active", "emerging"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { slug: true, title: true, description: true, status: true },
    }),
  ]);

  const latest = chapters[chapters.length - 1] ?? null;
  const prevChapter = chapters.length >= 2 ? chapters[chapters.length - 2] : null;

  const timelineNodes = chapters.map((c, i) => ({
    slug: c.slug,
    chapterNumber: c.chapterNumber,
    title: c.title,
    isMajorEvent: c.isMajorEvent,
    isNewest: i === chapters.length - 1,
  }));

  return (
    <main className="min-h-screen bg-void">
      {/* Hero */}
      <section className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-16 px-4">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-violet/60">
            ψ THE PSYCHENOMICON ψ
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
            A Living Record of Evolving Patterns
          </h1>
          <p className="text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
            {chapters.length > 0
              ? `${chapters.length} chapter${chapters.length !== 1 ? "s" : ""} recorded. ${entities.length} entities tracked. ${activeThreads.length} threads active.`
              : "The archive awaits its first chapter."}
          </p>

          {/* Current chapter CTA */}
          {latest && (
            <div className="inline-block rounded-lg border border-accent-violet/30 bg-accent-violet/5 px-6 py-5 mt-4 text-left space-y-2 max-w-md mx-auto">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet">
                /// current_chapter — CH.{String(latest.chapterNumber).padStart(3, "0")}
              </p>
              <p className="font-display text-lg font-bold text-text-primary">{latest.title}</p>
              {latest.episode && (
                <p className="font-mono text-[10px] text-text-muted">
                  {latest.episode.episodeNumber ? `EP.${String(latest.episode.episodeNumber).padStart(3, "0")} · ` : ""}
                  {latest.episode.title}
                </p>
              )}
              <Link
                href={`/psychenomicon/chapters/${latest.slug}`}
                className="inline-flex items-center gap-2 font-mono text-xs font-bold text-accent-violet hover:underline mt-1"
              >
                Continue Reading →
              </Link>
            </div>
          )}

          {chapters.length === 0 && (
            <p className="font-mono text-xs text-text-muted italic">No chapters generated yet. An admin must seed the archive.</p>
          )}
        </div>
      </section>

      {/* Timeline Strip */}
      {chapters.length > 0 && (
        <section className="border-b border-border py-6">
          <div className="mx-auto max-w-7xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted px-4 mb-2">/// chapter_timeline</p>
            <TimelineStrip chapters={timelineNodes} />
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 lg:grid-cols-3">
        {/* Active Threads */}
        <section className="lg:col-span-2 space-y-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">/// active_threads</p>
          {activeThreads.length > 0 ? (
            <div className="space-y-3">
              {activeThreads.map((t) => (
                <Link
                  key={t.slug}
                  href={`/psychenomicon/threads/${t.slug}`}
                  className="group flex items-start gap-4 rounded-lg border border-border bg-surface p-4 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        t.status === "emerging" ? "bg-accent-gold animate-pulse" : "bg-accent-violet"
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-mono text-xs font-bold text-text-primary group-hover:text-accent-violet transition-colors">
                        {t.title}
                      </p>
                      <span
                        className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border ${
                          t.status === "emerging"
                            ? "border-accent-gold/30 text-accent-gold"
                            : "border-accent-violet/30 text-accent-violet"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{t.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">No threads established yet.</p>
          )}

          {/* Emerging Signals from latest chapter */}
          {latest && latest.emergingSignals.length > 0 && (
            <div className="mt-8 space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold">/// emerging_signals</p>
              <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 p-5 space-y-2">
                <p className="font-mono text-[10px] text-text-muted mb-3">
                  From{" "}
                  <Link href={`/psychenomicon/chapters/${latest.slug}`} className="text-accent-gold hover:underline">
                    {latest.title}
                  </Link>
                </p>
                {latest.emergingSignals.map((signal, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-accent-gold flex-shrink-0 font-mono text-[10px] mt-0.5">▸</span>
                    <p className="text-xs text-text-muted leading-relaxed">{signal}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapter list */}
          {chapters.length > 0 && (
            <div className="mt-8 space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">/// all_chapters</p>
              <div className="space-y-2">
                {[...chapters].reverse().map((c) => (
                  <Link
                    key={c.slug}
                    href={`/psychenomicon/chapters/${c.slug}`}
                    className={`group flex items-center gap-4 rounded border px-4 py-3 transition-all ${
                      c.isMajorEvent
                        ? "border-accent-gold/30 bg-accent-gold/5 hover:bg-accent-gold/10"
                        : "border-border bg-surface hover:border-accent-violet/30 hover:bg-accent-violet/5"
                    }`}
                  >
                    <span className={`font-mono text-[10px] w-16 flex-shrink-0 ${c.isMajorEvent ? "text-accent-gold" : "text-text-muted"}`}>
                      CH.{String(c.chapterNumber).padStart(3, "0")}
                      {c.isMajorEvent && " ✦"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-mono text-xs font-medium group-hover:text-accent-violet transition-colors ${c.isMajorEvent ? "text-accent-gold" : "text-text-primary"}`}>
                        {c.title}
                      </p>
                      {c.episode && (
                        <p className="font-mono text-[9px] text-text-muted mt-0.5 truncate">
                          {c.episode.title}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Entity sidebar */}
        <aside className="space-y-6">
          <div className="space-y-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">/// tracked_entities</p>
            {entities.length > 0 ? (
              <div className="space-y-2">
                {entities.map((e) => (
                  <Link
                    key={e.slug}
                    href={`/psychenomicon/entities/${e.slug}`}
                    className="group flex items-center justify-between gap-3 rounded border border-border bg-surface px-3 py-2.5 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-text-primary group-hover:text-accent-violet transition-colors truncate">
                        {e.name}
                      </p>
                      {e.primaryArchetype && (
                        <p className="font-mono text-[9px] text-text-muted">{e.primaryArchetype}</p>
                      )}
                    </div>
                    <div
                      className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                        e.status === "evolved" ? "bg-accent-gold" : "bg-accent-violet/60"
                      }`}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No entities tracked yet.</p>
            )}
            {entities.length > 0 && (
              <Link href="/psychenomicon/entities" className="font-mono text-[10px] text-accent-violet hover:underline">
                View all entities →
              </Link>
            )}
          </div>

          {/* Prev chapter thread */}
          {prevChapter && (
            <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">/// previous</p>
              <p className="font-mono text-[10px] text-text-muted">CH.{String(prevChapter.chapterNumber).padStart(3, "0")}</p>
              <Link
                href={`/psychenomicon/chapters/${prevChapter.slug}`}
                className="font-mono text-xs text-text-primary hover:text-accent-violet transition-colors line-clamp-2"
              >
                {prevChapter.title}
              </Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
