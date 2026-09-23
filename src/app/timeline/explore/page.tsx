
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/ui/page-hero";
import { TimelineExplorer, type TimelineItem } from "@/components/timeline/timeline-explorer";
import { cleanTitle } from "@/lib/format/text";
import { ERAS } from "@/lib/eras";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 600;
export const maxDuration = 30;

export const metadata: Metadata = buildMetadata({
  title: "Timeline Explorer — Navigate the Archive by Era",
  description:
    "An interactive map of every Cult of Psyche transmission across time. Filter by era, scan the activity histogram, and dive into any month of the archive.",
  path: "/timeline/explore",
});

export default async function TimelineExplorePage() {
  const rows = await prisma.episode
    .findMany({
      where: { status: "published", airDate: { not: null } },
      select: { slug: true, title: true, episodeNumber: true, airDate: true },
      orderBy: { airDate: "asc" },
    })
    .catch(() => [] as { slug: string; title: string; episodeNumber: number | null; airDate: Date | null }[]);

  const items: TimelineItem[] = rows
    .filter((r) => r.airDate)
    .map((r) => ({
      slug: r.slug,
      title: cleanTitle(r.title).slice(0, 120),
      episodeNumber: r.episodeNumber,
      date: r.airDate!.toISOString().slice(0, 10),
    }));

  return (
    <>
      <PageHero
        title="TIMELINE EXPLORER"
        subtitle="Navigate the archive across time and era."
        backgroundImage="/hero-bg.jpg"
        label="timeline"
      />

      <main id="main-content" className="mx-auto max-w-4xl px-4 py-12 space-y-10">
        {/* Era legend */}
        <section className="grid gap-3 sm:grid-cols-2">
          {ERAS.map((era) => (
            <div key={era.id} className="rounded-xl border border-border bg-surface p-4">
              <p className="font-display text-sm font-bold text-text-primary">
                {era.sigil} {era.label}
              </p>
              <p className="font-mono text-[12px] uppercase tracking-widest text-text-muted">{era.subtitle}</p>
              <p className="mt-1 font-mono text-[12px] text-text-muted leading-relaxed">{era.description}</p>
            </div>
          ))}
        </section>

        {items.length > 0 ? (
          <TimelineExplorer items={items} />
        ) : (
          <p className="text-center font-mono text-sm text-text-muted">No dated transmissions yet.</p>
        )}

        <section className="text-center">
          <Link href="/timeline" className="font-mono text-xs uppercase tracking-widest text-text-muted hover:text-accent-gold-text transition-colors">
            ← Classic chronological timeline
          </Link>
        </section>
      </main>
    </>
  );
}
