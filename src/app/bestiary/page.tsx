import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export const revalidate = 600;

export const metadata: Metadata = {
  alternates: { canonical: "/bestiary" },
  title: "The Bestiary — CULT CODEX",
  description:
    "A field guide to the creatures, characters, and cosmic entities the Cult of Psyche has summoned into being — from Satan's ex-wife to the Conspiring Goats.",
};

const BESTIARY_CATEGORIES = [
  "character", "cosmology", "mythology", "creature",
  "animal spirit", "deity", "goddess",
];

// A stable glyph per entity, chosen by title so it doesn't flicker on reload.
const GLYPHS = ["ψ", "☉", "☾", "✦", "⚸", "☿", "♄", "⛧", "◈", "☖", "✧", "❖"];
function glyphFor(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return GLYPHS[h % GLYPHS.length];
}

export default async function BestiaryPage() {
  const beasts = await prisma.loreEntry
    .findMany({
      where: { canonStatus: "humorous", category: { in: BESTIARY_CATEGORIES } },
      select: { title: true, slug: true, summary: true, category: true },
      orderBy: { title: "asc" },
      take: 200,
    })
    .catch(() => []);

  return (
    <main className="min-h-screen bg-void">
      <section className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-12 px-4">
        <div className="mx-auto max-w-4xl text-center space-y-3">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-violet-text/70">
            {"/// field_guide · handle_with_ritual_gloves"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
            The Bestiary
          </h1>
          <p className="text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
            A field guide to the creatures, characters, and cosmic entities the
            Cult of Psyche has summoned into being — some invited, most not.
            Approach each entry with the respect owed to a thing that may be
            listening.
          </p>
          <p className="font-mono text-[12px] text-text-muted">
            {beasts.length} entit{beasts.length === 1 ? "y" : "ies"} catalogued
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10">
        {beasts.length === 0 ? (
          <div className="rounded border border-border bg-surface px-6 py-16 text-center">
            <p className="text-sm text-text-muted">The menagerie is, for the moment, empty. Or hiding.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {beasts.map((b) => (
              <Link
                key={b.slug}
                href={`/lore/${b.slug}`}
                className="group flex flex-col rounded-lg border border-border bg-surface p-4 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl text-accent-violet-text/70 group-hover:text-accent-violet-text transition-colors" aria-hidden>
                    {glyphFor(b.title)}
                  </span>
                  <span className="font-mono text-[12px] uppercase tracking-widest text-text-muted">
                    {b.category}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-sm font-bold text-text-primary group-hover:text-accent-violet-text transition-colors">
                  {b.title}
                </h2>
                {b.summary && (
                  <p className="mt-1 text-[12px] text-text-muted leading-relaxed line-clamp-3">
                    {b.summary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        <div className="pt-8 text-center">
          <Link href="/fun" className="font-mono text-[12px] text-text-muted hover:text-accent-violet-text transition-colors">
            ← The Fun Wing
          </Link>
        </div>
      </div>
    </main>
  );
}
