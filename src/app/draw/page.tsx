export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  alternates: { canonical: "/draw" },
  title: "Draw from the Deck — CULT CODEX",
  description:
    "Pull three cards from the archive at random — a piece of lore, a real quote, and a prophecy. Reload to draw again. The Codex decides what you needed to see.",
};

// Pick one random row of a table by counting then skipping a random offset.
// force-dynamic + a fresh offset each request = a new draw on every reload.
async function randomOf<T>(count: number, take: (skip: number) => Promise<T | null>): Promise<T | null> {
  if (count <= 0) return null;
  // Deterministic-per-request randomness: seed off the DB clock, not Math.random
  // (which is fine here — this is a server component, not the workflow sandbox).
  const skip = Math.floor(Math.random() * count);
  return take(skip);
}

async function drawLore() {
  const count = await prisma.loreEntry.count({ where: { canonStatus: "humorous" } }).catch(() => 0);
  return randomOf(count, (skip) =>
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

async function drawQuote() {
  const count = await prisma.quote.count({ where: { speakerPersonId: { not: null } } }).catch(() => 0);
  return randomOf(count, (skip) =>
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

async function drawProphecy() {
  const count = await prisma.loreEntry.count({ where: { category: "prophecy" } }).catch(() => 0);
  return randomOf(count, (skip) =>
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

export default async function DrawPage() {
  const [lore, quote, prophecy] = await Promise.all([drawLore(), drawQuote(), drawProphecy()]);

  return (
    <main className="min-h-screen bg-void">
      <section className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-12 px-4">
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-violet-text/70">
            {"/// three_cards · drawn_at_random"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
            Draw from the Deck
          </h1>
          <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
            The Codex reaches into itself and pulls three cards — a fragment of
            lore, something someone actually said, and a prophecy. Reload the
            page to draw again. It always knows.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-10 space-y-5">
        {/* Pointer to the shared daily draw */}
        <Link
          href="/draw/today"
          className="group flex items-center justify-between gap-3 rounded border border-accent-gold/30 bg-accent-gold/5 px-4 py-2.5 hover:bg-accent-gold/10 transition-colors"
        >
          <p className="font-mono text-[12px] text-text-muted">
            <span className="uppercase tracking-[0.12em] text-accent-gold-text mr-2">{"/// today's_draw"}</span>
            Want the card everyone else is seeing?
          </p>
          <span className="font-mono text-[12px] font-bold text-accent-gold-text group-hover:underline">
            See today&rsquo;s →
          </span>
        </Link>

        {/* Card I — Lore */}
        <article className="rounded-lg border border-accent-violet/20 bg-surface p-5 space-y-2">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-violet-text/70">
            I · The Lore {lore?.category ? `· ${lore.category}` : ""}
          </p>
          {lore ? (
            <Link href={`/lore/${lore.slug}`} className="group block space-y-1.5">
              <h2 className="font-display text-xl font-bold text-text-primary group-hover:text-accent-violet-text transition-colors">
                {lore.title}
              </h2>
              {lore.summary && (
                <p className="text-sm text-text-muted leading-relaxed">{lore.summary}</p>
              )}
              <span className="inline-block font-mono text-[12px] uppercase tracking-widest text-accent-violet-text/70 group-hover:text-accent-violet-text transition-colors pt-1">
                Follow this thread →
              </span>
            </Link>
          ) : (
            <p className="text-sm text-text-muted">The deck came up empty. Draw again.</p>
          )}
        </article>

        {/* Card II — Quote */}
        <article className="rounded-lg border border-accent-cyan/20 bg-surface p-5 space-y-2">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-cyan/60">
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
                  className="inline-block font-mono text-[12px] uppercase tracking-widest text-accent-cyan/50 hover:text-accent-cyan transition-colors pt-1"
                >
                  From: {quote.episode.title} →
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Silence. Draw again.</p>
          )}
        </article>

        {/* Card III — Prophecy */}
        <article className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 p-5 space-y-2">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
            III · The Prophecy
          </p>
          {prophecy ? (
            <Link href={`/lore/${prophecy.slug}`} className="group block space-y-1.5">
              <h2 className="font-display text-xl font-bold text-text-primary group-hover:text-accent-gold-text transition-colors">
                {prophecy.title}
              </h2>
              {prophecy.summary && (
                <p className="text-sm text-text-muted leading-relaxed">{prophecy.summary}</p>
              )}
              <span className="inline-block font-mono text-[12px] uppercase tracking-widest text-accent-gold-text/80 group-hover:text-accent-gold-text transition-colors pt-1">
                Read the whole omen →
              </span>
            </Link>
          ) : (
            <p className="text-sm text-text-muted">The future declined to load. Draw again.</p>
          )}
        </article>

        {/* Reroll */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            href="/draw"
            prefetch={false}
            className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 px-5 py-2.5 font-mono text-xs font-bold text-accent-violet-text hover:bg-accent-violet/20 transition-colors"
          >
            ↻ Draw again
          </Link>
          <Link
            href="/fun"
            className="font-mono text-[12px] text-text-muted hover:text-accent-violet-text transition-colors"
          >
            ← The Fun Wing
          </Link>
        </div>
      </div>
    </main>
  );
}
