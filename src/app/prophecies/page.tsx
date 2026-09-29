import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { NOT_REMOVED_LORE } from "@/lib/lore/removed-lore";

export const revalidate = 600;

export const metadata: Metadata = {
  alternates: { canonical: "/prophecies" },
  title: "The Prophecy Ledger — CULT CODEX",
  description:
    "Every prophecy the archive has recorded — fulfilled, pending, and disputed. The Codex makes no promises about timelines.",
};

const CANON_BADGE: Record<string, { label: string; cls: string }> = {
  canonical: { label: "CANON", cls: "border-accent-violet/40 text-accent-violet-text bg-accent-violet/10" },
  speculative: { label: "SPECULATIVE", cls: "border-accent-gold/40 text-accent-gold-text bg-accent-gold/10" },
  community_myth: { label: "COMMUNITY MYTH", cls: "border-accent-cyan/40 text-accent-cyan bg-accent-cyan/10" },
  disputed: { label: "DISPUTED", cls: "border-red-400/40 text-red-400 bg-red-500/10" },
  humorous: { label: "HUMOROUS", cls: "border-accent-gold/40 text-accent-gold-text bg-accent-gold/10" },
};

export default async function PropheciesPage() {
  const prophecies = await prisma.loreEntry
    .findMany({
      where: { ...NOT_REMOVED_LORE, category: "prophecy" },
      select: { title: true, slug: true, summary: true, canonStatus: true },
      orderBy: [{ canonStatus: "asc" }, { title: "asc" }],
      take: 200,
    })
    .catch(() => []);

  return (
    <main className="min-h-screen bg-void">
      <section className="border-b border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-void py-12 px-4">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
            {"/// future_tense · accuracy_not_guaranteed"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
            The Prophecy Ledger
          </h1>
          <p className="text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
            Every prophecy the archive has committed to the record — some
            fulfilled, some pending, some argued over to this day. The Codex
            files them all and makes no promises about timelines.
          </p>
          <p className="font-mono text-[12px] text-text-muted">
            {prophecies.length} prophec{prophecies.length === 1 ? "y" : "ies"} on the ledger
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 space-y-3">
        {prophecies.length === 0 ? (
          <div className="rounded border border-border bg-surface px-6 py-16 text-center">
            <p className="text-sm text-text-muted">The future is, for now, unwritten.</p>
          </div>
        ) : (
          prophecies.map((p, i) => {
            const badge = CANON_BADGE[p.canonStatus] ?? CANON_BADGE.speculative;
            return (
              <Link
                key={p.slug}
                href={`/lore/${p.slug}`}
                className="group block rounded border border-border bg-surface p-5 hover:border-accent-gold/40 hover:bg-accent-gold/5 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
                      OMEN №{String(i + 1).padStart(3, "0")}
                    </p>
                    <h2 className="font-display text-lg font-bold text-text-primary group-hover:text-accent-gold-text transition-colors">
                      {p.title}
                    </h2>
                    {p.summary && (
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-3">{p.summary}</p>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 rounded border px-2 py-0.5 font-mono text-[12px] uppercase ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                </div>
              </Link>
            );
          })
        )}

        <div className="pt-6 text-center">
          <Link href="/fun" className="font-mono text-[12px] text-text-muted hover:text-accent-violet-text transition-colors">
            ← The Fun Wing
          </Link>
        </div>
      </div>
    </main>
  );
}
