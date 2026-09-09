export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import Link from "next/link";
import type { Metadata } from "next";
import { ChapterCover } from "@/components/psychenomicon/chapter-cover";
import { getFreePreviewChapterNumbers } from "@/lib/psychenomicon";

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
  artImageUrls: unknown;
  episode: { episodeNumber: number | null; title: string; airDate: Date | null } | null;
};

// Chapters are 1:1 with episodes; the chronicle is read in broadcast
// order (episode air date), grouped by month. chapterNumber is just a
// stable id (and the slug), not the chronological rank.
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function monthLabel(airDate: Date | null): string {
  if (!airDate) return "Undated";
  const d = new Date(airDate);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default async function ChaptersIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  const canRead = !!user && (user.role === "admin" || (await isSubscribed(user.id).catch(() => false)));

  const sp = await searchParams;
  const freeChapterNumbers = await getFreePreviewChapterNumbers();
  const total = await prisma.psychenomiconChapter.count().catch(() => 0);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(totalPages, Math.max(1, parseInt(sp.page ?? "1", 10) || 1));

  const chapters: ChapterRow[] = await prisma.psychenomiconChapter
    .findMany({
      orderBy: { episode: { airDate: "asc" } },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        slug: true, chapterNumber: true, title: true, status: true, isMajorEvent: true, artImageUrls: true,
        episode: { select: { episodeNumber: true, title: true, airDate: true } },
      },
    })
    .catch(() => []);

  // Group the page's chapters under month headers (chronological).
  const groups: { label: string; rows: ChapterRow[] }[] = [];
  for (const c of chapters) {
    const label = monthLabel(c.episode?.airDate ?? null);
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
            <Link href="/psychenomicon" className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet-text/60 hover:text-accent-violet-text transition-colors">
              ← The Psychenomicon
            </Link>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">The Chronicle</h1>
            <p className="text-xs text-text-muted">
              {total.toLocaleString()} chapters, in broadcast order &middot; page {page} of {totalPages}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {!canRead && (
          <div className="rounded border border-accent-gold/30 bg-accent-gold/5 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[10px] text-text-muted">
              <span className="uppercase tracking-[0.3em] text-accent-gold-text mr-2">{"/// free_preview"}</span>
              A few chapters are unsealed for all. The full chronicle is Initiate+.
            </p>
            <Link href="/premium#access" className="font-mono text-[10px] font-bold text-accent-gold-text hover:underline">
              Become Initiate+ — $10/mo →
            </Link>
          </div>
        )}
        {groups.map((g) => (
          <section key={g.label} className="space-y-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold-text/70 sticky top-0 bg-void/90 backdrop-blur-sm py-1.5 z-10">
              {g.label}
            </p>
            <div className="space-y-1.5">
              {g.rows.map((c) => {
                const s = c.status ?? "stable";
                const free = freeChapterNumbers.includes(c.chapterNumber);
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
                    <ChapterCover art={c.artImageUrls} size={32} />
                    <span className={`font-mono text-[10px] w-16 flex-shrink-0 ${c.isMajorEvent ? "text-accent-gold-text" : "text-text-muted"}`}>
                      CH.{String(c.chapterNumber).padStart(3, "0")}{c.isMajorEvent && " ✦"}
                    </span>
                    <span className={`flex-1 min-w-0 truncate font-mono text-xs group-hover:text-accent-violet-text transition-colors ${c.isMajorEvent ? "text-accent-gold-text" : "text-text-primary"}`}>
                      {c.title}
                    </span>
                    {c.episode?.episodeNumber != null && (
                      <span className="font-mono text-[9px] text-text-muted/50 flex-shrink-0 hidden sm:inline">
                        EP.{String(c.episode.episodeNumber).padStart(3, "0")}
                      </span>
                    )}
                    {!canRead && (
                      free ? (
                        <span className="flex-shrink-0 rounded border border-accent-gold/40 bg-accent-gold/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-accent-gold-text">
                          Free
                        </span>
                      ) : (
                        <span className="flex-shrink-0 font-mono text-[10px] text-text-muted/40" aria-label="Initiate+ only">
                          🔒
                        </span>
                      )
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
            <Link href={pageHref(page - 1)} className="font-mono text-[11px] uppercase tracking-widest text-accent-violet-text hover:underline">
              ← Earlier
            </Link>
          ) : <span />}
          <span className="font-mono text-[10px] text-text-muted/50">{page} / {totalPages}</span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="font-mono text-[11px] uppercase tracking-widest text-accent-violet-text hover:underline">
              Later →
            </Link>
          ) : <span />}
        </nav>
      </div>
    </main>
  );
}
