import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { NOT_REMOVED_LORE } from "@/lib/lore/removed-lore";

export const revalidate = 600;

export const metadata: Metadata = {
  alternates: { canonical: "/trollopedia" },
  title: "The Trollopedia — CULT CODEX",
  description:
    "The field guide to the trolls of the Cult of Psyche — every raider, sock puppet, and bridge-dweller the archive has catalogued.",
};

const CANON_BADGE: Record<string, { label: string; cls: string }> = {
  canonical: { label: "CANON", cls: "border-accent-cyan/40 text-accent-cyan bg-accent-cyan/10" },
  speculative: { label: "SPECULATIVE", cls: "border-accent-gold/40 text-accent-gold-text bg-accent-gold/10" },
  community_myth: { label: "COMMUNITY MYTH", cls: "border-accent-violet/40 text-accent-violet-text bg-accent-violet/10" },
  disputed: { label: "DISPUTED", cls: "border-red-400/40 text-red-400 bg-red-500/10" },
  humorous: { label: "HUMOROUS", cls: "border-accent-gold/40 text-accent-gold-text bg-accent-gold/10" },
};

export default async function TrollopediaPage() {
  const entries = await prisma.loreEntry
    .findMany({
      where: {
        ...NOT_REMOVED_LORE,
        OR: [
          { title: { contains: "troll", mode: "insensitive" } },
          { summary: { contains: "troll", mode: "insensitive" } },
        ],
      },
      select: { title: true, slug: true, summary: true, canonStatus: true },
      orderBy: { title: "asc" },
      take: 300,
    })
    .catch(() => []);

  return (
    <main className="min-h-screen bg-void">
      <section className="relative overflow-hidden border-b border-accent-cyan/20 py-14 px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/trollopedia/hero.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-void/75 via-void/70 to-void" />
        <div className="relative mx-auto max-w-3xl text-center space-y-3">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-cyan/60">
            {"/// field_guide · do_not_feed"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
            The Trollopedia
          </h1>
          <p className="text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
            The archive&rsquo;s complete field guide to its oldest institution:
            the trolls. Raiders, sock puppets, bridge-dwellers, and the whole
            catalogued bloodline. Observe from a safe distance.
          </p>
          <p className="font-mono text-[12px] text-text-muted">
            {entries.length} entr{entries.length === 1 ? "y" : "ies"} on file
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 space-y-3">
        {entries.length === 0 ? (
          <div className="rounded border border-border bg-surface px-6 py-16 text-center">
            <p className="text-sm text-text-muted">The bridge is quiet. For now.</p>
          </div>
        ) : (
          entries.map((e, i) => {
            const badge = CANON_BADGE[e.canonStatus] ?? CANON_BADGE.speculative;
            return (
              <Link
                key={e.slug}
                href={`/lore/${e.slug}`}
                className="group block rounded border border-border bg-surface p-5 hover:border-accent-cyan/40 hover:bg-accent-cyan/5 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-cyan/50">
                      SPECIMEN №{String(i + 1).padStart(3, "0")}
                    </p>
                    <h2 className="font-display text-lg font-bold text-text-primary group-hover:text-accent-cyan transition-colors">
                      {e.title}
                    </h2>
                    {e.summary && (
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-3">{e.summary}</p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 rounded border px-2 py-0.5 font-mono text-[12px] uppercase ${badge.cls}`}>
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
