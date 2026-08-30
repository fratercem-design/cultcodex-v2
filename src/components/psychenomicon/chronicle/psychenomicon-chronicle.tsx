"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChapterCover } from "@/components/psychenomicon/chapter-cover";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function mLong(d: string | number | Date | null | undefined) { if (!d) return "Undated"; const dt = new Date(d); const ML="January,February,March,April,May,June,July,August,September,October,November,December".split(",");return ML[dt.getMonth()] + " " + dt.getFullYear(); }
function mKey(d: string | number | Date | null | undefined) { if (!d) return "undated"; const dt = new Date(d); return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0"); }

const STATUS_DOT: Record<string, string> = {
  stable: "bg-accent-violet/60",
  contested: "bg-red-400",
  evolving: "bg-accent-gold",
};

type ChronicleChapter = {
  slug: string;
  chapterNumber: number;
  title?: string;
  status?: string;
  isMajorEvent?: boolean;
  artImageUrls?: unknown;
  episode?: { title?: string; airDate?: string | null } | null;
};
type ChronicleEntity = { slug: string; name: string; primaryArchetype?: string | null; status?: string };
type ChronicleThread = { slug: string; title: string; description?: string | null; status?: string };
type ChronicleData = {
  canRead: boolean;
  isAdmin?: boolean;
  chapterCount: number;
  entityCount: number;
  latest: ChronicleChapter[];
  majors: ChronicleChapter[];
  entities: ChronicleEntity[];
  activeThreads: ChronicleThread[];
};

export default function PsychenomiconChronicle() {
  const [data, setData] = useState<ChronicleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/psychenomicon/chronicle").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!data) return null;
  if (!data.canRead) return (
    <main className="min-h-screen bg-void">
      <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet-text">{"/// access_restricted"}</p>
        <h2 className="font-display text-2xl font-bold text-accent-violet-text">The Psychenomicon</h2>
        <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">This is not a recap. It is a system.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/premium#access" className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 hover:bg-accent-violet/20 px-5 py-2.5 font-mono text-xs font-bold text-accent-violet-text transition-colors">Become Initiate+ — $10/mo →</Link>
        </div>
      </div>
    </main>
  );

  const { chapterCount, entityCount, latest, majors, entities, activeThreads } = data;
  const newest = latest?.[0] ?? null;

  // Group major events into month arcs for the timeline.
  const arcGroups: { key: string; label: string; rows: ChronicleChapter[] }[] = [];
  for (const c of majors ?? []) {
    const key = mKey(c.episode?.airDate ?? null);
    const last = arcGroups[arcGroups.length - 1];
    if (last && last.key === key) last.rows.push(c);
    else arcGroups.push({ key, label: mLong(c.episode?.airDate ?? null), rows: [c] });
  }

  return (
    <main className="min-h-screen bg-void">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-accent-violet/20 py-12 px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/psychenomicon/hero.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-void/80 via-void/70 to-void" />
        <div className="relative mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-violet-text/60">⏈ THE PSYCHENOMICON ⏈</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">A Living Record of Evolving Patterns</h1>
            {chapterCount > 0 && (
              <p className="text-xs text-text-muted">
                {chapterCount.toLocaleString()} chapters &middot; {majors?.length ?? 0} major events &middot; {entityCount} entities tracked &middot; {activeThreads.length} threads active
              </p>
            )}
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <Link href="/psychenomicon/book" className="inline-flex items-center gap-2 rounded-lg border border-accent-gold/40 bg-accent-gold/10 hover:bg-accent-gold/20 px-4 py-2.5 font-mono text-xs font-bold text-accent-gold-text transition-colors">█ Volume I →</Link>
            <Link href="/psychenomicon/chapters" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface hover:border-accent-violet/30 px-4 py-2.5 font-mono text-xs text-text-muted hover:text-accent-violet-text transition-colors">Full chronicle →</Link>
            {newest && <Link href={"/psychenomicon/chapters/" + newest.slug} className="inline-flex items-center gap-2 rounded-lg border border-accent-violet/30 bg-accent-violet/5 hover:bg-accent-violet/10 px-5 py-2.5 font-mono text-xs font-bold text-accent-violet-text transition-colors">Latest: CH.{String(newest.chapterNumber).padStart(3, "0")} →</Link>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-12">
        {/* Latest chapters */}
        {latest && latest.length > 0 && (
          <section className="space-y-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet-text/60">Latest transmissions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {latest.map((c) => (
                <Link
                  key={c.slug}
                  href={`/psychenomicon/chapters/${c.slug}`}
                  className={`group flex items-center gap-3 rounded border px-3 py-2.5 transition-all ${c.isMajorEvent ? "border-accent-gold/30 bg-accent-gold/5 hover:bg-accent-gold/10" : "border-border bg-surface hover:border-accent-violet/30 hover:bg-accent-violet/5"}`}
                >
                  <ChapterCover art={c.artImageUrls} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className={`block font-mono text-[9px] ${c.isMajorEvent ? "text-accent-gold-text" : "text-text-muted"}`}>CH.{String(c.chapterNumber).padStart(3, "0")}{c.isMajorEvent && " ✦"}</span>
                    <span className="block truncate font-mono text-xs text-text-primary group-hover:text-accent-violet-text transition-colors">{c.title ?? c.episode?.title ?? "Untitled"}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Major events timeline */}
        {arcGroups.length > 0 && (
          <section className="space-y-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold-text/70">Major events</p>
            {arcGroups.map((g) => (
              <div key={g.key} className="space-y-1.5">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted/70">{g.label}</p>
                <div className="space-y-1.5">
                  {g.rows.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/psychenomicon/chapters/${c.slug}`}
                      className="group flex items-center gap-3 rounded border border-accent-gold/30 bg-accent-gold/5 hover:bg-accent-gold/10 px-4 py-2.5 transition-all"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[c.status ?? "stable"] ?? STATUS_DOT.stable}`} />
                      <ChapterCover art={c.artImageUrls} size={32} />
                      <span className="font-mono text-[10px] w-16 flex-shrink-0 text-accent-gold-text">CH.{String(c.chapterNumber).padStart(3, "0")} ✦</span>
                      <span className="flex-1 min-w-0 truncate font-mono text-xs text-accent-gold-text group-hover:text-accent-violet-text transition-colors">{c.title ?? c.episode?.title ?? "Untitled"}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Entities + threads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {entities && entities.length > 0 && (
            <section className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet-text/60">Entities tracked</p>
              <div className="flex flex-wrap gap-2">
                {entities.map((e) => (
                  <Link key={e.slug} href={`/psychenomicon/entities/${e.slug}`} className="group rounded border border-border bg-surface hover:border-accent-violet/30 hover:bg-accent-violet/5 px-3 py-1.5 transition-all">
                    <span className="font-mono text-xs text-text-primary group-hover:text-accent-violet-text transition-colors">{e.name}</span>
                    {e.primaryArchetype && <span className="ml-1.5 font-mono text-[9px] text-text-muted/60">{e.primaryArchetype}</span>}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {activeThreads && activeThreads.length > 0 && (
            <section className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet-text/60">Active threads</p>
              <div className="space-y-1.5">
                {activeThreads.map((t) => (
                  <Link key={t.slug} href={`/psychenomicon/threads/${t.slug}`} className="group block rounded border border-border bg-surface hover:border-accent-violet/30 hover:bg-accent-violet/5 px-4 py-2.5 transition-all">
                    <span className="font-mono text-xs text-text-primary group-hover:text-accent-violet-text transition-colors">{t.title}</span>
                    {t.description && <span className="block mt-0.5 truncate text-[11px] text-text-muted/70">{t.description}</span>}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
