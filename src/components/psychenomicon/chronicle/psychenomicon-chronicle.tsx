"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChapterCover } from "@/components/psychenomicon/chapter-cover";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function mShort(d: any) { if (!d) return "Undated"; const dt = new Date(d); return MONTHS[dt.getMonth()] + " " + dt.getFullYear(); }
function mLong(d: any) { if (!d) return "Undated"; const dt = new Date(d); const ML="January,February,March,April,May,June,July,August,September,October,November,December".split(",");return ML[dt.getMonth()] + " " + dt.getFullYear(); }
function mKey(d: any) { if (!d) return "undated"; const dt = new Date(d); return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0"); }

const STATUS = { stable: "border-accent-violet/30 text-accent-violet/70 bg-accent-violet/5", contested: "border-red-500/30 text-red-400 bg-red-500/5", evolving: "border-accent-gold/30 text-accent-gold bg-accent-gold/5" };

export default function PsychenomiconChronicle() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/psychenomicon/chronicle").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!data) return null;
  if (!data.canRead) return <main className="min-h-screen bg-void"><div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-6"><p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet">/// access_restricted</p><h2 className="font-display text-2xl font-bold text-accent-violet">The Psychenomicon</h2><p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">This is not a recap. It is a system.</p><div className="flex flex-wrap justify-center gap-3"><Link href="/premium#access" className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 hover:bg-accent-violet/20 px-5 py-2.5 font-mono text-xs font-bold text-accent-violet transition-colors">Become Initiate+ — $10/mo →</Link></div></div></main>;

  const { chapterCount, entityCount, latest, majors, entities, activeThreads, isAdmin } = data;
  const newest = latest?.[0] ?? null;

  const arcGroups: { key: string; label: string; short: string; rows: any[] }[] = [];
  for (const c of majors ?? []) {
    const key = mKey(c.episode?.airDate ?? null);
    if (arcGroups.length && arcGroups[arcGroups.length - 1].key === key) {
      arcGroups[arcGroups.length - 1].rows.push(c);
    } else {
      arcGroups.push({ key, label: mLong(c.episode?.airDate ?? null), short: mShort(c.episode?.airDate ?? null), rows: [c] });
    }
  }

  return <main className="min-h-screen bg-void"><section className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-10 px-4"><div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div className="space-y-2"><p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-violet/60">⏈ THE PSYCHENOMICON ⏈</p><h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">A Living Record of Evolving Patterns</h1>{chapterCount > 0 && <p className="text-xs text-text-muted">{chapterCount.toLocaleString()} chapters &middot; { majors?.length ?? 0 } major events &middot; {entityCount} entities tracked &middot; {activeThreads.length} threads active</p>}</div><div className="flex flex-shrink-0 gap-2"><Link href="/psychenomicon/book" className="inline-flex items-center gap-2 rounded-lg border border-accent-gold/40 bg-accent-gold/10 hover:bg-accent-gold/20 px-4 py-2.5 font-mono text-xs font-bold text-accent-gold transition-colors">█ Volume I →</Link><Link href="/psychenomicon/chapters" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface hover:border-accent-violet/30 px-4 py-2.5 font-mono text-xs text-text-muted hover:text-accent-violet transition-colors">Full chronicle →</Link>{newest && <Link href={"/psychenomicon/chapters/" + newest.slug} className="inline-flex items-center gap-2 rounded-lg border border-accent-violet/30 bg-accent-violet/5 hover:bg-accent-violet/10 px-5 py-2.5 font-mono text-xs font-bold text-accent-violet transition-colors">Latest: CH.{String(newest.chapterNumber).padStart(3, "0")} →</Link>}</div></div></section></main>;
}