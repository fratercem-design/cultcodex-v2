export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import Link from "next/link";
import type { Metadata } from "next";
import { ChapterCover } from "@/components/psychenomicon/chapter-cover";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/psychenomicon" },
  title: "The Psychenomicon — CULT CODEX",
  description: "A living record of evolving patterns. The myth-engine of the Cult of Psyche, built from real transcripts.",
};

const STATUS_STYLES: Record<string, string> = {
  stable:    "border-accent-violet/30 text-accent-violet/70 bg-accent-violet/5",
  contested: "border-red-500/30 text-red-400 bg-red-500/5",
  evolving:  "border-accent-gold/30 text-accent-gold bg-accent-gold/5",
};

type MajorRow = {
  slug: string;
  chapterNumber: number;
  title: string;
  status: string;
  artImageUrls: unknown;
  episode: { title: string; airDate: Date | null } | null;
};

// The chronicle reads in broadcast order (episode air date). chapterNumber
// is a stable id (and the slug), not the chronological rank — so the saga
// is grouped by month, not by chapterNumber ranges.
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function monthKey(d: Date | null): string {
  if (!d) return "undated";
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabelShort(d: Date | null): string {
  if (!d) return "Undated";
  const dt = new Date(d);
  return `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}
function monthLabelLong(d: Date | null): string {
  if (!d) return "Undated";
  const dt = new Date(d);
  return `${MONTHS_LONG[dt.getMonth()]} ${dt.getFullYear()}`;
}

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

export default async function PsychenomiconPage() {
  const user = await getCurrentUser();
  const canRead = user ? await isSubscribed(user.id).catch(() => false) : false;
  const isAdmin = user?.role === "admin";

  if (!canRead) {
    return <main className="min-h-screen bg-void"><PsychenomiconGate isAuthenticated={!!user} /></main>;
  }

  // Bounded queries — the chronicle has thousands of chapters, so never
  // fetch them all. The 116 major events form the readable spine; recent
  // chapters show what's new; the full index lives at /chapters.
  const [chapterCount, entityCount, latest, majors, entities, activeThreads] = await Promise.all([
    prisma.psychenomiconChapter.count().catch(() => 0),
    prisma.psychenomiconEntity.count({ where: { status: { not: "dormant" } } }).catch(() => 0),
    prisma.psychenomiconChapter.findMany({
      orderBy: { episode: { airDate: "desc" } },
      take: 8,
      select: { slug: true, chapterNumber: true, title: true, status: true, isMajorEvent: true, emergingSignals: true, artImageUrls: true, episode: { select: { title: true } } },
    }).catch(() => []),
    prisma.psychenomiconChapter.findMany({
      where: { isMajorEvent: true },
      orderBy: { episode: { airDate: "asc" } },
      select: { slug: true, chapterNumber: true, title: true, status: true, artImageUrls: true, episode: { select: { title: true, airDate: true } } },
    }).catch(() => [] as MajorRow[]),
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

  const newest = latest[0] ?? null;

  // Group major events by month (chronological) — the dynamic chapter index.
  const arcGroups: { key: string; label: string; short: string; rows: MajorRow[] }[] = [];
  for (const c of majors) {
    const key = monthKey(c.episode?.airDate ?? null);
    const last = arcGroups[arcGroups.length - 1];
    if (last && last.key === key) last.rows.push(c);
    else arcGroups.push({ key, label: monthLabelLong(c.episode?.airDate ?? null), short: monthLabelShort(c.episode?.airDate ?? null), rows: [c] });
  }

  return (
    <main className="min-h-screen bg-void">
      {/* Hero */}
      <section className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-10 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-violet/60">ψ THE PSYCHENOMICON ψ</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">A Living Record of Evolving Patterns</h1>
            {chapterCount > 0 && (
              <p className="text-xs text-text-muted">
                {chapterCount.toLocaleString()} chapters &middot; {majors.length} major events &middot; {entityCount} entities tracked &middot; {activeThreads.length} threads active
              </p>
            )}
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <Link href="/psychenomicon/chapters" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface hover:border-accent-violet/30 px-4 py-2.5 font-mono text-xs text-text-muted hover:text-accent-violet transition-colors">
              Full chronicle →
            </Link>
            {newest && (
              <Link href={`/psychenomicon/chapters/${newest.slug}`} className="inline-flex items-center gap-2 rounded-lg border border-accent-violet/30 bg-accent-violet/5 hover:bg-accent-violet/10 px-5 py-2.5 font-mono text-xs font-bold text-accent-violet transition-colors">
                Latest: CH.{String(newest.chapterNumber).padStart(3, "0")} →
              </Link>
            )}
          </div>
        </div>
      </section>

      {chapterCount === 0 ? (
        <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-8">
          <div className="space-y-3">
            <p className="font-mono text-4xl text-accent-violet/20">ψ</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet/60">{"/// no_chapters_recorded"}</p>
            <h2 className="font-display text-xl font-bold text-text-primary">The chronicles have not yet begun.</h2>
            <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
              The Psychenomicon is a living record built episode by episode. Once chapters are generated from transcripts, they will appear here.
            </p>
          </div>
          {isAdmin && (
            <Link href="/admin/psychenomicon" className="inline-flex items-center gap-2 rounded-lg border border-accent-gold/50 bg-accent-gold/10 hover:bg-accent-gold/20 px-6 py-3 font-mono text-xs font-bold text-accent-gold transition-colors">
              Generate First Chapter →
            </Link>
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-8 grid gap-6 lg:grid-cols-[210px_1fr_260px]">

          {/* ── Left: dynamic arc index ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6">
              <div className="space-y-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">{"/// timeline"}</p>
                <div className="rounded border border-border bg-surface p-2 space-y-0.5 max-h-[60vh] overflow-y-auto">
                  {arcGroups.map((g) => (
                    <a key={g.key} href={`#m-${g.key}`} className="flex items-center justify-between gap-2 rounded px-2 py-1.5 group hover:bg-accent-violet/5 transition-colors">
                      <span className="font-mono text-[9px] text-text-muted group-hover:text-accent-violet transition-colors">
                        {g.short}
                      </span>
                      <span className="font-mono text-[8px] text-text-muted/60">{g.rows.length}</span>
                    </a>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">{"/// explore"}</p>
                <Link href="/psychenomicon/chapters" className="block rounded border border-border bg-surface px-3 py-2 font-mono text-[10px] text-text-muted hover:text-accent-violet hover:border-accent-violet/30 transition-all">Full chronicle →</Link>
                <Link href="/psychenomicon/entities" className="block rounded border border-border bg-surface px-3 py-2 font-mono text-[10px] text-text-muted hover:text-accent-violet hover:border-accent-violet/30 transition-all">Entity network →</Link>
                <Link href="/psychenomicon/archetypes" className="block rounded border border-border bg-surface px-3 py-2 font-mono text-[10px] text-text-muted hover:text-accent-violet hover:border-accent-violet/30 transition-all">Archetype atlas →</Link>
              </div>
            </div>
          </aside>

          {/* ── Center ── */}
          <section className="space-y-10 min-w-0">
            {/* Active threads */}
            <div className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">{"/// active_threads"}</p>
              {activeThreads.length > 0 ? (
                <div className="space-y-2">
                  {activeThreads.map((t) => (
                    <Link key={t.slug} href={`/psychenomicon/threads/${t.slug}`} className="group flex items-start gap-4 rounded-lg border border-border bg-surface p-4 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all">
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${t.status === "emerging" ? "bg-accent-gold animate-pulse" : "bg-accent-violet"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="font-mono text-xs font-bold text-text-primary group-hover:text-accent-violet transition-colors">{t.title}</p>
                          <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border ${t.status === "emerging" ? "border-accent-gold/30 text-accent-gold" : "border-accent-violet/30 text-accent-violet"}`}>{t.status}</span>
                        </div>
                        {t.description && <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{t.description}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : <p className="text-xs text-text-muted italic">No threads established yet.</p>}
            </div>

            {/* Latest chapters */}
            <div className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">{"/// latest_chapters"}</p>
              <div className="space-y-2">
                {latest.map((c) => {
                  const s = c.status ?? "stable";
                  return (
                    <Link key={c.slug} href={`/psychenomicon/chapters/${c.slug}`} className={`group flex items-center gap-3 rounded border px-4 py-3 transition-all ${c.isMajorEvent ? "border-accent-gold/30 bg-accent-gold/5 hover:bg-accent-gold/10" : "border-border bg-surface hover:border-accent-violet/30 hover:bg-accent-violet/5"}`}>
                      <ChapterCover art={c.artImageUrls} size={40} />
                      <span className={`font-mono text-[10px] w-16 flex-shrink-0 ${c.isMajorEvent ? "text-accent-gold" : "text-text-muted"}`}>CH.{String(c.chapterNumber).padStart(3, "0")}{c.isMajorEvent && " ✦"}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-mono text-xs font-medium group-hover:text-accent-violet transition-colors ${c.isMajorEvent ? "text-accent-gold" : "text-text-primary"}`}>{c.title}</p>
                        {c.episode && <p className="font-mono text-[9px] text-text-muted mt-0.5 truncate">{c.episode.title}</p>}
                      </div>
                      <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0 ${STATUS_STYLES[s] ?? STATUS_STYLES.stable}`}>{s}</span>
                    </Link>
                  );
                })}
              </div>
              <Link href="/psychenomicon/chapters" className="font-mono text-[10px] text-accent-violet hover:underline block">Read the full chronicle in order →</Link>
            </div>

            {/* The Saga — major events in order, grouped by arc */}
            <div className="space-y-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold">{"/// the_saga — major events in order"}</p>
              {arcGroups.map((g) => (
                <div key={g.key} id={`m-${g.key}`} className="space-y-2 scroll-mt-20">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-gold/70 border-b border-accent-gold/10 pb-1">{g.label}</p>
                  <div className="space-y-1.5">
                    {g.rows.map((c) => (
                      <Link key={c.slug} href={`/psychenomicon/chapters/${c.slug}`} className="group flex items-center gap-3 rounded border border-accent-gold/20 bg-accent-gold/[0.03] px-4 py-2.5 hover:bg-accent-gold/10 transition-all">
                        <ChapterCover art={c.artImageUrls} size={32} />
                        <span className="font-mono text-[10px] text-accent-gold w-16 flex-shrink-0">CH.{String(c.chapterNumber).padStart(3, "0")} ✦</span>
                        <span className="flex-1 min-w-0 truncate font-mono text-xs text-accent-gold/90 group-hover:text-accent-gold transition-colors">{c.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              {majors.length === 0 && <p className="text-xs text-text-muted italic">No major events marked yet.</p>}
            </div>
          </section>

          {/* ── Right: entities ── */}
          <aside className="space-y-6">
            <div className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">{"/// tracked_entities"}</p>
              {entities.length > 0 ? (
                <div className="space-y-2">
                  {entities.map((e) => (
                    <Link key={e.slug} href={`/psychenomicon/entities/${e.slug}`} className="group flex items-center justify-between gap-3 rounded border border-border bg-surface px-3 py-2.5 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-text-primary group-hover:text-accent-violet transition-colors truncate">{e.name}</p>
                        {e.primaryArchetype && <p className="font-mono text-[9px] text-text-muted">{e.primaryArchetype}</p>}
                      </div>
                      <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${e.status === "evolved" ? "bg-accent-gold" : "bg-accent-violet/60"}`} />
                    </Link>
                  ))}
                </div>
              ) : <p className="text-xs text-text-muted italic">No entities tracked yet.</p>}
              <Link href="/psychenomicon/entities" className="font-mono text-[10px] text-accent-violet hover:underline block">View network →</Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
