import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";

// Recompute at most twice an hour so a new day's card appears shortly after
// local midnight; within a day the pick is a pure function of the date, so
// every visitor sees the same three cards. Shareable by design.
export const revalidate = 1800;

export const metadata: Metadata = {
  alternates: { canonical: "/draw/today" },
  title: "Today's Draw — CULT CODEX",
  description:
    "The Codex draws three cards for everyone, once a day — a piece of lore, a real quote, and a prophecy. The same for all who look, until midnight.",
};

const TZ = "America/Los_Angeles";

// YYYY-MM-DD in the show's timezone, and a stable integer day-number for seeding.
function laToday(): { label: string; dayNumber: number } {
  const label = new Date().toLocaleDateString("en-CA", { timeZone: TZ }); // e.g. 2026-07-20
  const dayNumber = Math.floor(Date.parse(`${label}T00:00:00Z`) / 86_400_000);
  return { label, dayNumber };
}

// Deterministic pick: index into a pool by a decorrelated seed.
async function pickAt<T>(count: number, seed: number, take: (skip: number) => Promise<T | null>): Promise<T | null> {
  if (count <= 0) return null;
  return take(((seed % count) + count) % count);
}

async function loreOfDay(seed: number) {
  const count = await prisma.loreEntry.count({ where: { canonStatus: "humorous" } }).catch(() => 0);
  return pickAt(count, seed, (skip) =>
    prisma.loreEntry
      .findFirst({
        where: { canonStatus: "humorous" },
        select: { title: true, slug: true, summary: true, category: true },
        skip,
        orderBy: { id: "asc" },
      })
      .catch(() => null)
  );
}

async function quoteOfDay(seed: number) {
  const count = await prisma.quote.count({ where: { speakerPersonId: { not: null } } }).catch(() => 0);
  return pickAt(count, seed, (skip) =>
    prisma.quote
      .findFirst({
        where: { speakerPersonId: { not: null } },
        select: {
          text: true,
          context: true,
          speaker: { select: { displayName: true, slug: true } },
          episode: { select: { slug: true, title: true } },
        },
        skip,
        orderBy: { id: "asc" },
      })
      .catch(() => null)
  );
}

async function prophecyOfDay(seed: number) {
  const count = await prisma.loreEntry.count({ where: { category: "prophecy" } }).catch(() => 0);
  return pickAt(count, seed, (skip) =>
    prisma.loreEntry
      .findFirst({
        where: { category: "prophecy" },
        select: { title: true, slug: true, summary: true },
        skip,
        orderBy: { id: "asc" },
      })
      .catch(() => null)
  );
}

export default async function TodaysDrawPage() {
  const { label, dayNumber } = laToday();
  // Decorrelate the three picks so they don't move in lockstep day to day.
  const [lore, quote, prophecy] = await Promise.all([
    loreOfDay(dayNumber),
    quoteOfDay(dayNumber * 7 + 3),
    prophecyOfDay(dayNumber * 13 + 5),
  ]);

  const prettyDate = new Date(`${label}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-void">
      <section className="border-b border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-void py-12 px-4">
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-gold/60">
            {"/// today's_draw · the_same_for_everyone"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
            Today&rsquo;s Draw
          </h1>
          <p className="font-mono text-[11px] text-accent-gold/80">{prettyDate}</p>
          <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
            Once a day the Codex draws for the whole cult at once. These three
            cards are the same for everyone who looks, until midnight. Share
            them; argue about them; return tomorrow for new ones.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-10 space-y-5">
        {/* Card I — Lore */}
        <article className="rounded-lg border border-accent-violet/20 bg-surface p-5 space-y-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet/60">
            I · The Lore {lore?.category ? `· ${lore.category}` : ""}
          </p>
          {lore ? (
            <Link href={`/lore/${lore.slug}`} className="group block space-y-1.5">
              <h2 className="font-display text-xl font-bold text-text-primary group-hover:text-accent-violet transition-colors">
                {lore.title}
              </h2>
              {lore.summary && <p className="text-sm text-text-muted leading-relaxed">{lore.summary}</p>}
              <span className="inline-block font-mono text-[9px] uppercase tracking-widest text-accent-violet/50 group-hover:text-accent-violet transition-colors pt-1">
                Follow this thread →
              </span>
            </Link>
          ) : (
            <p className="text-sm text-text-muted">The deck kept its counsel today.</p>
          )}
        </article>

        {/* Card II — Quote */}
        <article className="rounded-lg border border-accent-cyan/20 bg-surface p-5 space-y-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-cyan/60">
            II · The Word {quote?.speaker?.displayName ? `· ${quote.speaker.displayName}` : ""}
          </p>
          {quote ? (
            <div className="space-y-2">
              <blockquote className="font-display text-lg text-text-primary leading-snug">
                &ldquo;{quote.text}&rdquo;
              </blockquote>
              {quote.context && (
                <p className="text-xs text-text-muted italic leading-relaxed">— {quote.context}</p>
              )}
              {quote.episode?.slug && (
                <Link
                  href={`/episodes/${quote.episode.slug}`}
                  className="inline-block font-mono text-[9px] uppercase tracking-widest text-accent-cyan/50 hover:text-accent-cyan transition-colors pt-1"
                >
                  From: {quote.episode.title} →
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Silence today.</p>
          )}
        </article>

        {/* Card III — Prophecy */}
        <article className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 p-5 space-y-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold/60">
            III · The Prophecy
          </p>
          {prophecy ? (
            <Link href={`/lore/${prophecy.slug}`} className="group block space-y-1.5">
              <h2 className="font-display text-xl font-bold text-text-primary group-hover:text-accent-gold transition-colors">
                {prophecy.title}
              </h2>
              {prophecy.summary && <p className="text-sm text-text-muted leading-relaxed">{prophecy.summary}</p>}
              <span className="inline-block font-mono text-[9px] uppercase tracking-widest text-accent-gold/50 group-hover:text-accent-gold transition-colors pt-1">
                Read the whole omen →
              </span>
            </Link>
          ) : (
            <p className="text-sm text-text-muted">The future declined to appear today.</p>
          )}
        </article>

        {/* Nav */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            href="/draw"
            prefetch={false}
            className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 px-5 py-2.5 font-mono text-xs font-bold text-accent-violet hover:bg-accent-violet/20 transition-colors"
          >
            ↻ Draw your own three
          </Link>
          <Link href="/fun" className="font-mono text-[10px] text-text-muted hover:text-accent-violet transition-colors">
            ← The Fun Wing
          </Link>
        </div>
      </div>
    </main>
  );
}
