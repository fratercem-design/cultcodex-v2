export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/psychenomicon/chapters" },
  title: "The Chronicle — All Chapters — CULT CODEX",
  description: "Every chapter of the Psychenomicon, in order — the complete chronicle of the Cult of Psyche, drawn from real transcripts.",
};

const PER_PAGE = 60;
const STATUS_DOT: Record<string, string> = {
  stable: "bg-accent-violet/60",
  contested: "bg-red-400",
  evolving: "bg-accent-gold",
};

type ChapterRow = {
  slug: string;
  chapterNumber: number;
  title: string;
  status: string;
  isMajorEvent: boolean;
  episode: { episodeNumber: number | null; title: string; airDate: Date | null } | null;
};

function arcLabel(chapterNumber: number): string {
  const arc = Math.floor((chapterNumber - 1) / 100);
  const start = arc * 100 + 1;
  const end = start + 99;
  return `Arc ${arc + 1} — Chapters ${start}–${end}`;
}

export default async function ChaptersIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  const canRead = !!user && (user.role === "admin" || (await isSubscribed(user.id).catch(() => false)));

  if (!canRead) {
    return (
      <main className="min-h-screen bg-void">
        <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet">{"/// access_restricted"}</p>
          <h2 className="font-display text-2xl font-bold text-accent-violet">The Chronicle</h2>
          <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
            The complete chapter index is an Initiate+ feature. Every chapter drawn from real transcripts, in order.
          </p>
          <Link href="/premium#access" className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 hover:bg-accent-violet/20 px-5 py-2.5 font-mono text-xs font-bold text-accent-violet transition-colors">
            Become Initiate+ — $10/mo →
          </Link>
        </div>
      </main>
    );
  }

  const sp = await searchParams;
  const total = await prisma.psychenomiconChapter.count().catch(() => 0);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(totalPages, Math.max(1, parseInt(sp.page ?? "1", 10) || 1));

  const chapters: ChapterRow[] = await prisma.psychenomiconChapter
    .findMany({
      orderBy: { chapterNumber: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        slug: true, chapterNumber: true, title: true, status: true, isMajorEvent: true,
        episode: { select: { episodeNumber: true, title: true, airDate: true } },
      },
    })
    .catch(() => []);

  // Group the page's chapters under arc headers.
  const groups: { label: string; rows: ChapterRow[] }[] = [];
  for (const c of chapters) {
    const label = arcLabel(c.chapterNumber);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.rows.push(c);
    else groups.push({ label, rows: [c] });
  }

  const pageHref = (p: number) => `/psychenomicon/chapters?page=${p}`;

  return (
    <main className="min-h-screen bg-void">
      {/* Hero */}
      <section className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-10 px-4">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <Link href="/psychenomicon" className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet/60 hover:text-accent-violet transition-colors">
              ← The Psychenomicon
            </Link>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">The Chronicle</h1>
            <p className="text-xs text-text-muted">
              {total.toLocaleString()} chapters, in order &middot; page {page} of {totalPages}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {groups.map((g) => (
          <section key={g.label} className="space-y-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold/70 sticky top-0 bg-void/90 backdrop-blur-sm py-1.5 z-10">
              {g.label}
            </p>
            <div className="space-y-1.5">
              {g.rows.map((c) => {
                const s = c.status ?? "stable";
                return (
                  <Link
                    key={c.slug}
                    href={`/psychenomicon/chapters/${c.slug}`}
                    className={`group flex items-center gap-3 rounded border px-4 py-2.5 transition-all ${
                      c.isMajorEvent
                        ? "border-accent-gold/30 bg-accent-gold/5 hover:bg-accent-gold/10"
                        : "border-border bg-surface hover:border-accent-violet/30 hover:bg-accent-violet/5"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[s] ?? STATUS_DOT.stable}`} />
                    <span className={`font-mono text-[10px] w-16 flex-shrink-0 ${c.isMajorEvent ? "text-accent-gold" : "text-text-muted"}`}>
                      CH.{String(c.chapterNumber).padStart(3, "0")}{c.isMajorEvent && " ✦"}
                    </span>
                    <span className={`flex-1 min-w-0 truncate font-mono text-xs group-hover:text-accent-violet transition-colors ${c.isMajorEvent ? "text-accent-gold" : "text-text-primary"}`}>
                      {c.title}
                    </span>
                    {c.episode?.episodeNumber != null && (
                      <span className="font-mono text-[9px] text-text-muted/50 flex-shrink-0 hidden sm:inline">
                        EP.{String(c.episode.episodeNumber).padStart(3, "0")}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {/* Pagination */}
        <nav className="flex items-center justify-between gap-3 border-t border-border pt-6" aria-label="Pagination">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="font-mono text-[11px] uppercase tracking-widest text-accent-violet hover:underline">
              ← Newer arcs
            </Link>
          ) : <span />}
          <span className="font-mono text-[10px] text-text-muted/50">{page} / {totalPages}</span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="font-mono text-[11px] uppercase tracking-widest text-accent-violet hover:underline">
              Older arcs →
            </Link>
          ) : <span />}
        </nav>
      </div>
    </main>
  );
}
