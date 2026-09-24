export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { listArchetypes } from "@/lib/queries/archetypes";
import { archetypeHex } from "@/lib/archetype-colors";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/psychenomicon/archetypes" },
  title: "Archetypes — Psychenomicon — CULT CODEX",
  description:
    "Every archetypal current running through the Cult of Psyche — Mirror, Siren, Chaos, Flame and beyond. The patterns that recur across guests, eras, and chapters.",
};

export default async function ArchetypesIndexPage() {
  const user = await getCurrentUser();
  const canRead = user ? await isSubscribed(user.id).catch(() => false) : false;

  if (!canRead) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-violet-text">
            {"/// initiate_only"}
          </p>
          <p className="font-display text-xl font-bold text-text-primary">
            Archetype atlas sealed.
          </p>
          <Link
            href="/premium#access"
            className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 px-5 py-2 font-mono text-xs font-bold text-accent-violet-text hover:bg-accent-violet/20 transition-colors"
          >
            Become Initiate+ →
          </Link>
        </div>
      </main>
    );
  }

  const archetypes = await listArchetypes().catch(() => []);
  const totalEntities = archetypes.reduce((sum, a) => sum + a.entityCount, 0);

  return (
    <main className="min-h-screen bg-void">
      <header className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-10 px-4">
        <div className="mx-auto max-w-5xl space-y-2">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-violet-text/70">
            ψ PSYCHENOMICON · ARCHETYPES ψ
          </p>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            The Archetype Atlas
          </h1>
          <p className="text-xs text-text-muted max-w-2xl">
            Patterns that recur. Currents that carry. Each archetype is a way of
            being a person in this world — and the same archetype shows up
            across guests, eras, and chapters in slightly different forms.
          </p>
          <p className="font-mono text-[12px] text-text-muted">
            {archetypes.length} archetype{archetypes.length !== 1 ? "s" : ""}
            {" · "}
            {totalEntities} entity tag
            {totalEntities !== 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {archetypes.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="font-mono text-4xl text-accent-violet-text/55">ψ</p>
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-violet-text/70">
              {"/// no_archetypes_recorded"}
            </p>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              Archetypes will appear here as entities are tagged across the
              Psychenomicon chapters.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {archetypes.map((archetype) => {
              const hex = archetypeHex(archetype.name);
              return (
                <Link
                  key={archetype.slug}
                  href={`/psychenomicon/archetypes/${archetype.slug}`}
                  className="group rounded-lg border border-border bg-surface p-5 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p
                        className="font-display text-lg font-bold leading-tight"
                        style={{ color: hex }}
                      >
                        {archetype.name}
                      </p>
                      <p className="font-mono text-[12px] uppercase tracking-widest text-text-muted">
                        {archetype.entityCount}{" "}
                        {archetype.entityCount === 1 ? "entity" : "entities"}
                      </p>
                    </div>
                    <span
                      className="flex-shrink-0 h-3 w-3 rounded-full"
                      style={{ backgroundColor: hex, opacity: 0.8 }}
                    />
                  </div>

                  {archetype.sampleEntities.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {archetype.sampleEntities.slice(0, 4).map((ent) =>
                        ent.avatarUrl ? (
                          <Image
                            key={ent.slug}
                            src={ent.avatarUrl}
                            alt={ent.name}
                            width={22}
                            height={22}
                            className="h-5.5 w-5.5 rounded-full object-cover border border-border"
                            style={{ height: 22, width: 22 }}
                          />
                        ) : (
                          <div
                            key={ent.slug}
                            className="h-5.5 w-5.5 rounded-full border border-border flex items-center justify-center font-mono text-[12px]"
                            style={{
                              height: 22,
                              width: 22,
                              backgroundColor: `${hex}20`,
                              color: hex,
                            }}
                          >
                            {ent.name[0]}
                          </div>
                        )
                      )}
                      {archetype.entityCount > 4 && (
                        <span className="font-mono text-[12px] text-text-muted ml-1">
                          +{archetype.entityCount - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="font-mono text-[12px] text-accent-violet-text/70 group-hover:text-accent-violet-text transition-colors">
                    Open atlas →
                  </p>
                </Link>
              );
            })}
          </div>
        )}

        <div className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/psychenomicon"
            className="font-mono text-[12px] text-text-muted hover:text-accent-violet-text transition-colors"
          >
            ← Return to Psychenomicon
          </Link>
          <Link
            href="/psychenomicon/entities"
            className="font-mono text-[12px] text-accent-violet-text/70 hover:text-accent-violet-text transition-colors"
          >
            All entities →
          </Link>
        </div>
      </div>
    </main>
  );
}
