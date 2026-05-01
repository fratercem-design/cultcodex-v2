import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import {
  EntityNetworkGraph,
  type NetworkNode,
  type NetworkEdge,
} from "@/components/psychenomicon/entity-network-graph";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Entity Network — Psychenomicon — CULT CODEX",
  description: "All tracked entities and their co-appearance relationships across Psychenomicon chapters.",
};

export default async function EntitiesPage() {
  const user = await getCurrentUser();
  const canRead = user ? await isSubscribed(user.id) : false;

  if (!canRead) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet">/// initiate_only</p>
          <p className="font-display text-xl font-bold text-text-primary">Entity network sealed.</p>
          <Link href="/premium#access" className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 px-5 py-2 font-mono text-xs font-bold text-accent-violet hover:bg-accent-violet/20 transition-colors">
            Become Initiate+ →
          </Link>
        </div>
      </main>
    );
  }

  const entities = await prisma.psychenomiconEntity.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      primaryArchetype: true,
      status: true,
      behaviorPatterns: true,
      appearances: {
        select: { chapterId: true },
      },
      archetypeEvents: {
        orderBy: { chapterNumber: "desc" },
        take: 1,
        select: { primaryArchetype: true, chapterNumber: true },
      },
    },
  });

  // Build network graph data
  const nodes: NetworkNode[] = entities.map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    primaryArchetype: e.primaryArchetype,
    status: e.status,
    appearanceCount: e.appearances.length,
  }));

  // Compute co-appearance edges: two entities connected if they share chapters
  const chapterEntityMap: Record<string, string[]> = {};
  for (const entity of entities) {
    for (const ap of entity.appearances) {
      if (!chapterEntityMap[ap.chapterId]) chapterEntityMap[ap.chapterId] = [];
      chapterEntityMap[ap.chapterId].push(entity.id);
    }
  }

  const edgeMap: Record<string, number> = {};
  for (const entityIds of Object.values(chapterEntityMap)) {
    for (let i = 0; i < entityIds.length; i++) {
      for (let j = i + 1; j < entityIds.length; j++) {
        const key = [entityIds[i], entityIds[j]].sort().join("||");
        edgeMap[key] = (edgeMap[key] ?? 0) + 1;
      }
    }
  }

  const edges: NetworkEdge[] = Object.entries(edgeMap).map(([key, strength]) => {
    const [sourceId, targetId] = key.split("||");
    return { sourceId, targetId, strength };
  });

  const STATUS_STYLES: Record<string, string> = {
    active:  "border-accent-violet/30 text-accent-violet",
    evolved: "border-accent-gold/30 text-accent-gold",
    dormant: "border-border text-text-muted",
  };

  return (
    <main className="min-h-screen bg-void">
      <header className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-10 px-4">
        <div className="mx-auto max-w-5xl space-y-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-violet/60">ψ PSYCHENOMICON · ENTITIES ψ</p>
          <h1 className="font-display text-2xl font-bold text-text-primary">Entity Network</h1>
          <p className="text-xs text-text-muted">
            {nodes.length} entities tracked &middot; {edges.length} relationship edges
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">
        {/* Network graph */}
        {nodes.length > 1 && (
          <EntityNetworkGraph nodes={nodes} edges={edges} width={700} height={420} />
        )}

        {/* Entity grid */}
        <div className="space-y-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">/// all_entities</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entities.map((e) => {
              const latestEvent = e.archetypeEvents[0];
              const statusStyle = STATUS_STYLES[e.status] ?? STATUS_STYLES.active;
              return (
                <Link
                  key={e.slug}
                  href={`/psychenomicon/entities/${e.slug}`}
                  className="group rounded-lg border border-border bg-surface p-4 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold text-text-primary group-hover:text-accent-violet transition-colors truncate">
                        {e.name}
                      </p>
                      {e.primaryArchetype && (
                        <p className="font-mono text-[9px] text-accent-violet/70 mt-0.5">{e.primaryArchetype}</p>
                      )}
                    </div>
                    <span className={`flex-shrink-0 font-mono text-[8px] uppercase px-1.5 py-0.5 rounded border ${statusStyle}`}>
                      {e.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-text-muted">
                    <span>{e.appearances.length} chapter{e.appearances.length !== 1 ? "s" : ""}</span>
                    {latestEvent && (
                      <span className="text-accent-gold/70">
                        CH.{String(latestEvent.chapterNumber).padStart(3, "0")} → {latestEvent.primaryArchetype}
                      </span>
                    )}
                  </div>

                  {e.behaviorPatterns.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {e.behaviorPatterns.slice(0, 2).map((p) => (
                        <span key={p} className="rounded border border-border px-1.5 py-0.5 font-mono text-[8px] text-text-muted">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <Link href="/psychenomicon" className="block font-mono text-[10px] text-text-muted hover:text-accent-violet transition-colors">
          ← Return to Psychenomicon
        </Link>
      </div>
    </main>
  );
}
