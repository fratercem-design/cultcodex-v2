import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "The Psychenomicon — CULT CODEX",
  description: "A living record of evolving patterns. The myth-engine of the Cult of Psyche, built from real transcripts.",
};

const STATUS_STYLES: Record<string, string> = {
  stable:    "border-accent-violet/30 text-accent-violet/70 bg-accent-violet/5",
  contested: "border-red-500/30 text-red-400 bg-red-500/5",
  evolving:  "border-accent-gold/30 text-accent-gold bg-accent-gold/5",
};

function PsychenomiconGate({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-6">
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet">{"/// access_restricted"}</p>
      <h2 className="font-display text-2xl font-bold text-accent-violet">The Psychenomicon</h2>
      <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
        A living record of evolving patterns. Every chapter drawn from real transcripts. Every entity tracked across their arc.
        This is not a recap. It is a system.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {!isAuthenticated && (
          <Link href="/api/auth/signin" className="inline-flex items-center gap-2 rounded border border-border px-5 py-2.5 font-mono text-xs text-text-muted hover:text-text-primary transition-colors">
            Sign in
          </Link>
        )}
        <Link href="/premium#access" className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 hover:bg-accent-violet/20 px-5 py-2.5 font-mono text-xs font-bold text-accent-violet transition-colors">
          Become Initiate+ — $10/mo →
        </Link>
      </div>
    </div>
  );
}

// Arc groupings (static for Arc I; expand as chapters grow)
const ARCS = [
  { label: "Arc I — The Formation", chapters: [1, 2, 3, 4, 5], status: "complete" },
];

export default async function PsychenomiconPage() {
  const user = await getCurrentUser();
  const canRead = user ? await isSubscribed(user.id).catch(() => false) : false;
  const isAdmin = user?.role === "admin";

  if (!canRead) {
    return <main className="min-h-screen bg-void"><PsychenomiconGate isAuthenticated={!!user} /></main>;
  }

  const [chapters, entities, activeThreads] = await Promise.all([
    prisma.psychenomiconChapter.findMany({
      orderBy: { chapterNumber: "asc" },
      select: {
        id: true, slug: true, chapterNumber: true, title: true,
        isMajorEvent: true, emergingSignals: true, createdAt: true,
        status: true,
        episode: { select: { episodeNumber: true, airDate: true, title: true } },
      },
    }).catch(() => []),
    prisma.psychenomiconEntity.findMany({
      where: { status: { not: "dormant" } },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: { slug: true, name: true, primaryArchetype: true, status: true },
    }).catch(() => []),
    prisma.psychenomiconThread.findMany({
      where: { status: { in: ["active", "emerging"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { slug: true, title: true, description: true, status: true },
    }).catch(() => []),
  ]);

  const latest = chapters[chapters.length - 1] ?? null;

  return (
    <main className="min-h-screen bg-void">
      {/* Compact hero */}
      <section className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-10 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-violet/60">ψ THE PSYCHENOMICON ψ</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">A Living Record of Evolving Patterns</h1>
            {chapters.length > 0 && (
              <p className="text-xs text-text-muted">
                {chapters.length} chapter{chapters.length !== 1 ? "s" : ""} &middot; {entities.length} entities tracked &middot; {activeThreads.length} threads active
              </p>
            )}
          </div>
          {latest && (
            <Link
              href={`/psychenomicon/chapters/${latest.slug}`}
              className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg border border-accent-violet/30 bg-accent-violet/5 hover:bg-accent-violet/10 px-5 py-2.5 font-mono text-xs font-bold text-accent-violet transition-colors"
            >
              Latest: CH.{String(latest.chapterNumber).padStart(3, "0")} →
            </Link>
          )}
        </div>
      </section>

      {/* Empty state — no chapters generated yet */}
      {chapters.length === 0 && (
        <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-8">
          <div className="space-y-3">
            <p className="font-mono text-4xl text-accent-violet/20">ψ</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet/60">{"/// no_chapters_recorded"}</p>
            <h2 className="font-display text-xl font-bold text-text-primary">The chronicles have not yet begun.</h2>
            <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
              The Psychenomicon is a living record built episode by episode. Once chapters are generated from transcripts, they will appear here — with entities, threads, and archetypal patterns tracked across time.
            </p>
          </div>
          {isAdmin ? (
            <Link
              href="/admin/psychenomicon"
              className="inline-flex items-center gap-2 rounded-lg border border-accent-gold/50 bg-accent-gold/10 hover:bg-accent-gold/20 px-6 py-3 font-mono text-xs font-bold text-accent-gold transition-colors"
            >
              Generate First Chapter →
            </Link>
          ) : (
            <p className="font-mono text-[10px] text-text-muted/50 uppercase tracking-widest">
              The first transmissions are being processed.
            </p>
          )}
        </div>
      )}

      {/* 3-panel layout */}
      {chapters.length > 0 && (
      <div className="mx-auto max-w-7xl px-4 py-8 grid gap-6 lg:grid-cols-[200px_1fr_260px]">

        {/* ── Left: Chapter nav + arcs ── */}
        <aside className="hidden lg:block space-y-6">
          <div className="sticky top-20 space-y-6">
            {/* Arc groupings */}
            <div className="space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">{"/// arcs"}</p>
              {ARCS.map((arc) => (
                <div key={arc.label} className="rounded border border-border bg-surface p-3 space-y-2">
                  <p className="font-mono text-[9px] text-accent-gold/80">{arc.label}</p>
                  <div className="space-y-1">
                    {chapters
                      .filter((c) => arc.chapters.includes(c.chapterNumber))
                      .map((c) => {
                        const s = (c as { status?: string }).status ?? "stable";
                        return (
                          <Link
                            key={c.slug}
                            href={`/psychenomicon/chapters/${c.slug}`}
                            className="flex items-center gap-2 group"
                          >
                            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                              s === "contested" ? "bg-red-400" : s === "evolving" ? "bg-accent-gold" : "bg-accent-violet/60"
                            }`} />
                            <span className="font-mono text-[9px] text-text-muted group-hover:text-accent-violet transition-colors truncate">
                              {String(c.chapterNumber).padStart(3, "0")} {c.title.split(" ").slice(0, 3).join(" ")}…
                            </span>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>

            {/* Entity link */}
            <div className="space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">{"/// explore"}</p>
              <Link href="/psychenomicon/entities" className="block rounded border border-border bg-surface px-3 py-2 font-mono text-[10px] text-text-muted hover:text-accent-violet hover:border-accent-violet/30 transition-all">
                Entity network →
              </Link>
              <Link href="/psychenomicon/archetypes" className="block rounded border border-border bg-surface px-3 py-2 font-mono text-[10px] text-text-muted hover:text-accent-violet hover:border-accent-violet/30 transition-all">
                Archetype atlas →
              </Link>
            </div>
          </div>
        </aside>

        {/* ── Center: Threads + chapters ── */}
        <section className="space-y-8 min-w-0">
          {/* Active threads */}
          <div className="space-y-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">{"/// active_threads"}</p>
            {activeThreads.length > 0 ? (
              <div className="space-y-2">
                {activeThreads.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/psychenomicon/threads/${t.slug}`}
                    className="group flex items-start gap-4 rounded-lg border border-border bg-surface p-4 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className={`h-2 w-2 rounded-full ${t.status === "emerging" ? "bg-accent-gold animate-pulse" : "bg-accent-violet"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-mono text-xs font-bold text-text-primary group-hover:text-accent-violet transition-colors">{t.title}</p>
                        <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border ${
                          t.status === "emerging" ? "border-accent-gold/30 text-accent-gold" : "border-accent-violet/30 text-accent-violet"
                        }`}>{t.status}</span>
                      </div>
                      {t.description && <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{t.description}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No threads established yet.</p>
            )}
            {activeThreads.length > 0 && (
              <Link href="/psychenomicon/threads" className="font-mono text-[10px] text-accent-violet hover:underline block">
                View all threads →
              </Link>
            )}
          </div>

          {/* Emerging signals from latest */}
          {latest && latest.emergingSignals.length > 0 && (
            <div className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold">{"/// emerging_signals — "}{latest.title}</p>
              <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 p-5 space-y-2">
                {latest.emergingSignals.map((signal, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-accent-gold flex-shrink-0 font-mono text-[10px] mt-0.5">▸</span>
                    <p className="text-xs text-text-muted leading-relaxed">{signal}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All chapters */}
          {chapters.length > 0 && (
            <div className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">{"/// all_chapters"}</p>
              <div className="space-y-2">
                {[...chapters].reverse().map((c) => {
                  const s = (c as { status?: string }).status ?? "stable";
                  return (
                    <Link
                      key={c.slug}
                      href={`/psychenomicon/chapters/${c.slug}`}
                      className={`group flex items-center gap-4 rounded border px-4 py-3 transition-all ${
                        c.isMajorEvent ? "border-accent-gold/30 bg-accent-gold/5 hover:bg-accent-gold/10" : "border-border bg-surface hover:border-accent-violet/30 hover:bg-accent-violet/5"
                      }`}
                    >
                      <span className={`font-mono text-[10px] w-16 flex-shrink-0 ${c.isMajorEvent ? "text-accent-gold" : "text-text-muted"}`}>
                        CH.{String(c.chapterNumber).padStart(3, "0")}{c.isMajorEvent && " ✦"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-mono text-xs font-medium group-hover:text-accent-violet transition-colors ${c.isMajorEvent ? "text-accent-gold" : "text-text-primary"}`}>
                          {c.title}
                        </p>
                        {c.episode && <p className="font-mono text-[9px] text-text-muted mt-0.5 truncate">{c.episode.title}</p>}
                      </div>
                      <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0 ${STATUS_STYLES[s] ?? STATUS_STYLES.stable}`}>
                        {s}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── Right: Entities + quick links ── */}
        <aside className="space-y-6">
          <div className="space-y-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">{"/// tracked_entities"}</p>
            {entities.length > 0 ? (
              <div className="space-y-2">
                {entities.map((e) => (
                  <Link
                    key={e.slug}
                    href={`/psychenomicon/entities/${e.slug}`}
                    className="group flex items-center justify-between gap-3 rounded border border-border bg-surface px-3 py-2.5 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-text-primary group-hover:text-accent-violet transition-colors truncate">{e.name}</p>
                      {e.primaryArchetype && <p className="font-mono text-[9px] text-text-muted">{e.primaryArchetype}</p>}
                    </div>
                    <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${e.status === "evolved" ? "bg-accent-gold" : "bg-accent-violet/60"}`} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No entities tracked yet.</p>
            )}
            <Link href="/psychenomicon/entities" className="font-mono text-[10px] text-accent-violet hover:underline block">
              View network →
            </Link>
          </div>
        </aside>
      </div>
      )}
    </main>
  );
}
