
import { fetchRelationshipGraph } from "@/lib/queries/graph";
import { RelationshipGraph } from "@/components/graph/relationship-graph";
import Link from "next/link";
import type { Metadata } from "next";
import { ERAS, getEraById } from "@/lib/eras";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/graph" },
  title: "Relationship Map — CULT CODEX",
  description:
    "Dynamic map of every recurring Cult of Psyche figure — who appeared with whom, how often, and what orbits formed. Click any node to focus their connections.",
};

const ERA_ACCENT: Record<string, string> = {
  gold:    "text-accent-gold-text border-accent-gold/50 bg-accent-gold/10",
  violet:  "text-accent-violet-text border-accent-violet/50 bg-accent-violet/10",
  cyan:    "text-accent-cyan border-accent-cyan/50 bg-accent-cyan/10",
  crimson: "text-accent-crimson-text border-accent-crimson/50 bg-accent-crimson/10",
  muted:   "text-text-muted border-border bg-surface",
};

export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<{ era?: string }>;
}) {
  const { era: eraParam } = await searchParams;
  const activeEra = eraParam && getEraById(eraParam) ? getEraById(eraParam) : null;

  const dateStart = activeEra ? new Date(activeEra.dateStart) : undefined;
  const dateEnd = activeEra?.dateEnd ? new Date(activeEra.dateEnd) : undefined;

  const { nodes, edges, totalEpisodes } = await fetchRelationshipGraph(2, {
    eraDateStart: dateStart,
    eraDateEnd: dateEnd,
  });

  const totalPeople = nodes.length;
  const totalConnections = edges.length;

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-10 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="space-y-4 max-w-3xl">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/50">
            {"/// relationship_map"}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
            The Network
            {activeEra && (
              <span className="ml-3 font-mono text-base font-normal text-text-muted">
                — {activeEra.sigil} {activeEra.label}
              </span>
            )}
          </h1>
        </div>
        <p className="font-mono text-sm text-text-muted leading-relaxed">
          Every recurring figure connected by co-appearance.{" "}
          <span className="text-text-primary">Node size</span> = total episodes.{" "}
          <span className="text-text-primary">Edge weight</span> = shared episodes together.{" "}
          Drag the threshold to isolate tight orbits. Click any node to focus its connections.
        </p>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {[
            { n: totalPeople, label: "recurring figures" },
            { n: totalConnections, label: "connections mapped" },
            { n: totalEpisodes, label: activeEra ? "episodes in era" : "episodes analyzed" },
          ].map((s) => (
            <span key={s.label} className="font-mono text-[11px] text-text-muted">
              <span className="text-accent-gold-text font-bold">{s.n.toLocaleString("en-US")}</span>{" "}
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Era Filter Tabs ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/graph"
          className={`rounded-lg border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
            !activeEra
              ? "border-border text-text-primary bg-surface"
              : "border-border/40 text-text-muted/50 hover:text-text-muted hover:border-border"
          }`}
        >
          All time
        </Link>
        {ERAS.map((era) => {
          const isActive = activeEra?.id === era.id;
          return (
            <Link
              key={era.id}
              href={`/graph?era=${era.id}`}
              className={`rounded-lg border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                isActive
                  ? ERA_ACCENT[era.color]
                  : "border-border/40 text-text-muted/50 hover:text-text-muted hover:border-border"
              }`}
            >
              {era.sigil} {era.label}
            </Link>
          );
        })}
        {activeEra && (
          <Link
            href={`/eras/${activeEra.id}`}
            className="ml-auto font-mono text-[10px] uppercase tracking-widest text-text-muted/50 hover:text-text-muted transition-colors"
          >
            Era detail →
          </Link>
        )}
      </div>

      {/* ── Graph ──────────────────────────────────────────────────────── */}
      <RelationshipGraph nodes={nodes} edges={edges} />

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-5 py-4">
        <p className="font-mono text-[11px] text-text-muted leading-relaxed max-w-lg">
          Connections show people who appeared together in published episodes
          {activeEra ? ` during ${activeEra.label}` : ""}.
          Archetype coloring comes from Psychenomicon analysis where available.
          Isolated figures (one-time guests) are hidden.
        </p>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/graph/path"
            className="inline-flex items-center gap-1 rounded border border-accent-violet/30 px-3 py-1.5 font-mono text-[10px] text-accent-violet-text hover:bg-accent-violet/10 transition-colors"
          >
            Find a path →
          </Link>
          <Link
            href="/people"
            className="inline-flex items-center gap-1 rounded border border-border px-3 py-1.5 font-mono text-[10px] text-text-muted hover:text-accent-gold-text hover:border-accent-gold/30 transition-colors"
          >
            All people →
          </Link>
          <Link
            href="/eras"
            className="inline-flex items-center gap-1 rounded border border-border px-3 py-1.5 font-mono text-[10px] text-text-muted hover:text-accent-cyan hover:border-accent-cyan/30 transition-colors"
          >
            Eras →
          </Link>
          <Link
            href="/psychenomicon/entities"
            className="inline-flex items-center gap-1 rounded border border-accent-violet/30 px-3 py-1.5 font-mono text-[10px] text-accent-violet-text hover:bg-accent-violet/10 transition-colors"
          >
            Psychenomicon →
          </Link>
        </div>
      </div>
    </main>
  );
}
