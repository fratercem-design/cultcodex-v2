export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import { ERAS, getEraForEpisode } from "@/lib/eras";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Eras of the Archive — CULT CODEX",
  description:
    "The Cult of Psyche archive divided into its five defining eras — from the first raw transmissions to the ongoing signal. Browse episodes by the period that shaped them.",
  path: "/eras",
});

const ERA_BORDER: Record<string, string> = {
  gold:    "border-l-accent-gold/60",
  violet:  "border-l-accent-violet/60",
  cyan:    "border-l-accent-cyan/60",
  crimson: "border-l-accent-crimson/60",
  muted:   "border-l-border",
};

const ERA_TEXT: Record<string, string> = {
  gold:    "text-accent-gold",
  violet:  "text-accent-violet",
  cyan:    "text-accent-cyan",
  crimson: "text-accent-crimson",
  muted:   "text-text-muted",
};

const ERA_BG: Record<string, string> = {
  gold:    "bg-accent-gold/5",
  violet:  "bg-accent-violet/5",
  cyan:    "bg-accent-cyan/5",
  crimson: "bg-accent-crimson/5",
  muted:   "bg-surface",
};

const ERA_SIGIL_BG: Record<string, string> = {
  gold:    "bg-accent-gold/10    text-accent-gold",
  violet:  "bg-accent-violet/10  text-accent-violet",
  cyan:    "bg-accent-cyan/10    text-accent-cyan",
  crimson: "bg-accent-crimson/10 text-accent-crimson",
  muted:   "bg-surface           text-text-muted",
};

async function getEraCounts(): Promise<Map<string, number>> {
  const rows = await prisma.episode.findMany({
    where: { status: "published", airDate: { not: null } },
    select: { airDate: true },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    const era = getEraForEpisode(row.airDate);
    if (era) {
      counts.set(era.id, (counts.get(era.id) ?? 0) + 1);
    }
  }
  return counts;
}

export default async function ErasPage() {
  const counts = await getEraCounts();
  const totalEpisodes = Array.from(counts.values()).reduce((sum, n) => sum + n, 0);

  return (
    <>
      <PageHero
        title="ERAS"
        subtitle="Five chapters. One archive."
        backgroundImage="/articles-bacgkground.jpg"
      />

      <main id="main-content" className="mx-auto max-w-4xl px-4 py-12 space-y-4">
        {/* Intro */}
        <p className="font-mono text-sm text-text-muted leading-relaxed mb-10">
          The archive didn&apos;t arrive all at once. It evolved — through distinct periods,
          each with its own voice, obsessions, and cast. Browse by era to find the transmissions
          that define each chapter.
        </p>

        {/* Era cards */}
        {ERAS.map((era, index) => {
          const count = counts.get(era.id) ?? 0;
          const startYear = era.dateStart.slice(0, 4);
          const endYear = era.dateEnd ? era.dateEnd.slice(0, 4) : null;
          const rangeLabel = endYear && endYear !== startYear
            ? `${startYear} — ${endYear}`
            : endYear === startYear
            ? startYear
            : `${startYear} — ongoing`;

          return (
            <div
              key={era.id}
              className={`rounded-lg border border-border border-l-4 ${ERA_BORDER[era.color]} ${ERA_BG[era.color]} overflow-hidden`}
            >
              <div className="p-6">
                <div className="flex items-start gap-5">
                  {/* Sigil */}
                  <div
                    className={`flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center text-xl font-mono ${ERA_SIGIL_BG[era.color]}`}
                    aria-hidden="true"
                  >
                    {era.sigil}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 flex-wrap mb-0.5">
                      <span className="font-mono text-[9px] text-text-muted/50 uppercase tracking-[0.4em]">
                        Era {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-[9px] text-text-muted/40">
                        {rangeLabel}
                      </span>
                    </div>

                    <h2 className={`font-display text-xl font-bold leading-tight mb-0.5 ${ERA_TEXT[era.color]}`}>
                      {era.label}
                    </h2>
                    <p className="font-mono text-[10px] text-text-muted/60 uppercase tracking-widest mb-3">
                      {era.subtitle}
                    </p>

                    <p className="text-sm text-text-muted leading-relaxed mb-4">
                      {era.description}
                    </p>

                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <span className="font-mono text-[10px] text-text-muted/50">
                        {count > 0
                          ? `${count} episode${count !== 1 ? "s" : ""} in the archive`
                          : "Episodes being catalogued"}
                      </span>
                      <div className="flex items-center gap-3">
                        {count > 0 && (
                          <Link
                            href={`/episodes?era=${era.id}`}
                            className={`inline-flex items-center gap-1.5 font-mono text-[10px] ${ERA_TEXT[era.color]} hover:opacity-80 transition-opacity`}
                          >
                            Browse episodes
                            <span aria-hidden="true">→</span>
                          </Link>
                        )}
                        <Link
                          href={`/eras/${era.id}`}
                          className={`inline-flex items-center gap-1.5 font-mono text-[10px] ${ERA_TEXT[era.color]} hover:opacity-80 transition-opacity`}
                        >
                          Era overview
                          <span aria-hidden="true">↗</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div className="pt-6 border-t border-border flex items-center justify-between gap-4 flex-wrap">
          <p className="font-mono text-[10px] text-text-muted/40">
            {totalEpisodes} episodes catalogued across {ERAS.length} eras
          </p>
          <Link
            href="/episodes"
            className="font-mono text-[10px] text-text-muted hover:text-text-primary transition-colors"
          >
            Browse full archive →
          </Link>
        </div>
      </main>
    </>
  );
}
