
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ERAS, getEraById } from "@/lib/eras";
import { fetchEraStats } from "@/lib/queries/eras";
import { fetchRelationshipGraph } from "@/lib/queries/graph";
import { RelationshipGraph } from "@/components/graph/relationship-graph";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  return ERAS.map((era) => ({ eraId: era.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eraId: string }>;
}): Promise<Metadata> {
  const { eraId } = await params;
  const era = getEraById(eraId);
  if (!era) return {};
  return buildMetadata({
    title: `${era.label} — Eras`,
    description: era.description,
    path: `/eras/${era.id}`,
  });
}

// ── Color maps (mirror the graph component) ───────────────────────────────────
const ERA_ACCENT: Record<string, string> = {
  gold:    "text-accent-gold-text",
  violet:  "text-accent-violet-text",
  cyan:    "text-accent-cyan",
  crimson: "text-accent-crimson-text",
  muted:   "text-text-muted",
};
const ERA_BORDER_L: Record<string, string> = {
  gold:    "border-l-accent-gold/60",
  violet:  "border-l-accent-violet/60",
  cyan:    "border-l-accent-cyan/60",
  crimson: "border-l-accent-crimson/60",
  muted:   "border-l-border",
};
const ERA_BG: Record<string, string> = {
  gold:    "bg-accent-gold/5",
  violet:  "bg-accent-violet/5",
  cyan:    "bg-accent-cyan/5",
  crimson: "bg-accent-crimson/5",
  muted:   "bg-surface",
};
const ERA_SIGIL_BG: Record<string, string> = {
  gold:    "bg-accent-gold/10 text-accent-gold-text",
  violet:  "bg-accent-violet/10 text-accent-violet-text",
  cyan:    "bg-accent-cyan/10 text-accent-cyan",
  crimson: "bg-accent-crimson/10 text-accent-crimson-text",
  muted:   "bg-surface text-text-muted",
};

// Archetype → hex color (matches graph component)
const ARCHETYPE_HEX: Record<string, string> = {
  Mirror:    "#a78bfa",
  Gravity:   "#a78bfa",
  Siren:     "#f472b6",
  Chaos:     "#f87171",
  Echo:      "#fb923c",
  Flame:     "#fbbf24",
  Contested: "#6ee7b7",
  Fractured: "#94a3b8",
  Silent:    "#64748b",
  Seekers:   "#67e8f9",
  Loyalist:  "#818cf8",
};

function archetypeHex(archetype: string): string {
  for (const [key, hex] of Object.entries(ARCHETYPE_HEX)) {
    if (archetype.includes(key)) return hex;
  }
  return "#475569";
}

export default async function EraDetailPage({
  params,
}: {
  params: Promise<{ eraId: string }>;
}) {
  const { eraId } = await params;
  const era = getEraById(eraId);
  if (!era) notFound();

  const eraIndex = ERAS.findIndex((e) => e.id === era.id);
  const dateStart = new Date(era.dateStart);
  const dateEnd = era.dateEnd ? new Date(era.dateEnd) : null;

  const startYear = era.dateStart.slice(0, 4);
  const endYear = era.dateEnd ? era.dateEnd.slice(0, 4) : null;
  const rangeLabel = endYear && endYear !== startYear
    ? `${startYear} — ${endYear}`
    : endYear === startYear
    ? startYear
    : `${startYear} — ongoing`;

  const [stats, graphData] = await Promise.all([
    fetchEraStats(era.id).catch(() => null),
    fetchRelationshipGraph(2, {
      eraDateStart: dateStart,
      eraDateEnd: dateEnd ?? undefined,
    }).catch(() => ({ nodes: [], edges: [] })),
  ]);

  const accentClass = ERA_ACCENT[era.color] ?? ERA_ACCENT.muted;
  const borderLClass = ERA_BORDER_L[era.color] ?? ERA_BORDER_L.muted;
  const bgClass = ERA_BG[era.color] ?? ERA_BG.muted;
  const sigilBgClass = ERA_SIGIL_BG[era.color] ?? ERA_SIGIL_BG.muted;

  const prevEra = eraIndex > 0 ? ERAS[eraIndex - 1] : null;
  const nextEra = eraIndex < ERAS.length - 1 ? ERAS[eraIndex + 1] : null;

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-10 space-y-12">

      {/* ── Breadcrumb ──────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-text-muted/50">
        <Link href="/eras" className="hover:text-text-muted transition-colors">
          Eras
        </Link>
        <span aria-hidden>/</span>
        <span className={accentClass}>{era.label}</span>
      </nav>

      {/* ── Era Header ─────────────────────────────────────────────── */}
      <div className={`rounded-xl border border-border border-l-4 ${borderLClass} ${bgClass} p-8`}>
        <div className="flex items-start gap-6">
          <div
            className={`flex-shrink-0 h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-mono ${sigilBgClass}`}
            aria-hidden="true"
          >
            {era.sigil}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-mono text-[9px] text-text-muted/50 uppercase tracking-[0.4em]">
                Era {String(eraIndex + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-[9px] text-text-muted/60">
                {rangeLabel}
              </span>
            </div>
            <h1 className={`font-display text-3xl font-bold ${accentClass}`}>
              {era.label}
            </h1>
            <p className="font-mono text-[11px] text-text-muted/60 uppercase tracking-widest">
              {era.subtitle}
            </p>
            <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
              {era.description}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { n: stats.episodeCount, label: "episodes" },
            { n: stats.uniqueGuests, label: "recurring guests" },
            { n: stats.archetypeDistribution.length, label: "archetypes present" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border bg-surface px-5 py-4 space-y-1"
            >
              <p className={`font-display text-2xl font-bold tabular-nums ${accentClass}`}>
                {s.n.toLocaleString()}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Archetype Distribution ─────────────────────────────────── */}
      {stats && stats.archetypeDistribution.length > 0 && (
        <section className="space-y-5">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
              {"/// archetype_distribution"}
            </p>
            <h2 className="font-display text-lg font-bold text-text-primary">
              Archetypes in this era
            </h2>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {stats.archetypeDistribution.map(({ archetype, count }) => {
              const maxCount = stats.archetypeDistribution[0].count;
              const pct = Math.round((count / maxCount) * 100);
              const hex = archetypeHex(archetype);
              return (
                <div
                  key={archetype}
                  className="rounded-lg border border-border bg-surface px-4 py-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="font-mono text-[11px] font-medium"
                      style={{ color: hex }}
                    >
                      {archetype}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted tabular-nums">
                      {count} {count === 1 ? "person" : "people"}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: hex, opacity: 0.7 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Top Guests ─────────────────────────────────────────────── */}
      {stats && stats.topGuests.length > 0 && (
        <section className="space-y-5">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
              {"/// most_active_voices"}
            </p>
            <h2 className="font-display text-lg font-bold text-text-primary">
              Top guests this era
            </h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {stats.topGuests.map((guest, i) => {
              const hex = guest.archetype ? archetypeHex(guest.archetype) : "#475569";
              return (
                <Link
                  key={guest.personId}
                  href={`/people/${guest.slug}`}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 hover:border-border/60 hover:bg-surface/80 transition-colors"
                >
                  <span className="font-mono text-[10px] text-text-muted/60 tabular-nums w-5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {guest.avatarUrl ? (
                    <Image
                      src={guest.avatarUrl}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center font-mono text-[9px]"
                      style={{ backgroundColor: `${hex}20`, color: hex }}
                    >
                      {guest.name[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-gold-text transition-colors truncate">
                      {guest.name}
                    </p>
                    {guest.archetype ? (
                      <p className="font-mono text-[9px]" style={{ color: hex }}>
                        {guest.archetype}
                      </p>
                    ) : (
                      <p className="font-mono text-[9px] text-text-muted/60">
                        {guest.appearances} ep{guest.appearances !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-text-muted/50 tabular-nums shrink-0">
                    ×{guest.appearances}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Relationship Graph ─────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
              {"/// network_map"}
            </p>
            <h2 className="font-display text-lg font-bold text-text-primary">
              Relationships in this era
            </h2>
          </div>
          <Link
            href={`/graph?era=${era.id}`}
            className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1"
          >
            Full graph view →
          </Link>
        </div>

        {graphData.nodes.length > 0 ? (
          <RelationshipGraph nodes={graphData.nodes} edges={graphData.edges} />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface/50 p-10 text-center">
            <p className="font-mono text-sm text-text-muted/50">
              Not enough co-appearances in this era to render a network.
            </p>
          </div>
        )}
      </section>

      {/* ── CTA Row ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href={`/episodes?era=${era.id}`}
          className={`inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${accentClass} border-current/30 hover:bg-current/5`}
        >
          Browse all episodes in this era <span aria-hidden>→</span>
        </Link>
        <Link
          href={`/search/deep?era=${era.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-text-muted hover:text-text-primary hover:border-border/60 transition-colors"
        >
          Deep search in this era <span aria-hidden>→</span>
        </Link>
      </div>

      {/* ── Era Pagination ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
        {prevEra ? (
          <Link
            href={`/eras/${prevEra.id}`}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
          >
            <span aria-hidden>←</span>
            <span>
              <span className="block text-text-muted/50 text-[9px]">Previous era</span>
              {prevEra.sigil} {prevEra.label}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {nextEra ? (
          <Link
            href={`/eras/${nextEra.id}`}
            className="flex items-center gap-2 text-right font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
          >
            <span>
              <span className="block text-text-muted/50 text-[9px]">Next era</span>
              {nextEra.sigil} {nextEra.label}
            </span>
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <div />
        )}
      </div>

    </main>
  );
}
