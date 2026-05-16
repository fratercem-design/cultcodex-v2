import { fetchRelationshipGraph } from "@/lib/queries/graph";
import { RelationshipGraph } from "@/components/graph/relationship-graph";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Relationship Map — CULT CODEX",
  description:
    "Dynamic map of every recurring Cult of Psyche figure — who appeared with whom, how often, and what orbits formed. Click any node to focus their connections.",
};

export default async function GraphPage() {
  const { nodes, edges, totalEpisodes } = await fetchRelationshipGraph(2);

  const totalPeople = nodes.length;
  const totalConnections = edges.length;

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-10 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="space-y-4 max-w-3xl">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/50">
            /// relationship_map
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
            The Network
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
            { n: totalEpisodes, label: "episodes analyzed" },
          ].map((s) => (
            <span key={s.label} className="font-mono text-[11px] text-text-muted">
              <span className="text-accent-gold font-bold">{s.n.toLocaleString()}</span>{" "}
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Graph ──────────────────────────────────────────────────────── */}
      <RelationshipGraph nodes={nodes} edges={edges} />

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-5 py-4">
        <p className="font-mono text-[11px] text-text-muted leading-relaxed max-w-lg">
          Connections show people who appeared together in published episodes.
          Archetype coloring comes from Psychenomicon analysis where available.
          Isolated figures (one-time guests) are hidden.
        </p>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/people"
            className="inline-flex items-center gap-1 rounded border border-border px-3 py-1.5 font-mono text-[10px] text-text-muted hover:text-accent-gold hover:border-accent-gold/30 transition-colors"
          >
            All people →
          </Link>
          <Link
            href="/psychenomicon/entities"
            className="inline-flex items-center gap-1 rounded border border-accent-violet/30 px-3 py-1.5 font-mono text-[10px] text-accent-violet hover:bg-accent-violet/10 transition-colors"
          >
            Psychenomicon →
          </Link>
        </div>
      </div>
    </main>
  );
}
