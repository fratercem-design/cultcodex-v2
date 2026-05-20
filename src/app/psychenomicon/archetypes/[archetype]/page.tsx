import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { getArchetypeDetail } from "@/lib/queries/archetypes";
import { archetypeHex } from "@/lib/archetype-colors";
import { ERAS, getEraById } from "@/lib/eras";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ archetype: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { archetype } = await params;
  const detail = await getArchetypeDetail(archetype);
  if (!detail) return { title: "Archetype Not Found — CULT CODEX" };
  return {
    title: `${detail.name} — Archetype — Psychenomicon — CULT CODEX`,
    description: `Every entity carrying the ${detail.name} archetype across the Cult of Psyche archive.`,
  };
}

const STATUS_STYLES: Record<string, string> = {
  active:  "border-accent-violet/30 text-accent-violet",
  evolved: "border-accent-gold/30 text-accent-gold",
  dormant: "border-border text-text-muted",
};

const ERA_TEXT: Record<string, string> = {
  gold:    "text-accent-gold",
  violet:  "text-accent-violet",
  cyan:    "text-accent-cyan",
  crimson: "text-accent-crimson",
  muted:   "text-text-muted",
};

export default async function ArchetypeDetailPage({ params }: PageProps) {
  const { archetype: archetypeSlug } = await params;

  const user = await getCurrentUser();
  const canRead = user ? await isSubscribed(user.id).catch(() => false) : false;

  if (!canRead) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet">
            /// initiate_only
          </p>
          <p className="font-display text-xl font-bold text-text-primary">
            Archetype atlas sealed.
          </p>
          <Link
            href="/premium#access"
            className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 px-5 py-2 font-mono text-xs font-bold text-accent-violet hover:bg-accent-violet/20 transition-colors"
          >
            Become Initiate+ →
          </Link>
        </div>
      </main>
    );
  }

  const detail = await getArchetypeDetail(archetypeSlug).catch(() => null);
  if (!detail) notFound();

  const hex = archetypeHex(detail.name);
  const maxEraCount = Math.max(...Object.values(detail.eraDistribution), 1);
  const totalAppearances = Object.values(detail.eraDistribution).reduce(
    (sum, n) => sum + n,
    0
  );

  return (
    <main className="min-h-screen bg-void">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header
        className="border-b py-10 px-4"
        style={{
          borderColor: `${hex}33`,
          background: `linear-gradient(to bottom, ${hex}0d, transparent)`,
        }}
      >
        <div className="mx-auto max-w-5xl space-y-3">
          <nav className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-text-muted/50">
            <Link
              href="/psychenomicon"
              className="hover:text-text-muted transition-colors"
            >
              Psychenomicon
            </Link>
            <span aria-hidden>/</span>
            <Link
              href="/psychenomicon/archetypes"
              className="hover:text-text-muted transition-colors"
            >
              Archetypes
            </Link>
            <span aria-hidden>/</span>
            <span style={{ color: hex }}>{detail.name}</span>
          </nav>

          <div className="flex items-center gap-4">
            <span
              className="h-5 w-5 rounded-full"
              style={{ backgroundColor: hex }}
              aria-hidden
            />
            <h1
              className="font-display text-3xl font-bold"
              style={{ color: hex }}
            >
              {detail.name}
            </h1>
          </div>
          <p className="font-mono text-[10px] text-text-muted/60 uppercase tracking-widest">
            archetype atlas
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 space-y-12">

        {/* ── Stats Row ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-surface px-5 py-4 space-y-1">
            <p
              className="font-display text-2xl font-bold tabular-nums"
              style={{ color: hex }}
            >
              {detail.entities.length}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              entities tagged
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface px-5 py-4 space-y-1">
            <p
              className="font-display text-2xl font-bold tabular-nums"
              style={{ color: hex }}
            >
              {totalAppearances}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              episode appearances
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface px-5 py-4 space-y-1">
            <p
              className="font-display text-2xl font-bold tabular-nums"
              style={{ color: hex }}
            >
              {Object.keys(detail.eraDistribution).length}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              eras spanned
            </p>
          </div>
        </div>

        {/* ── Era Distribution ───────────────────────────────────── */}
        {totalAppearances > 0 && (
          <section className="space-y-4">
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
                /// era_distribution
              </p>
              <h2 className="font-display text-lg font-bold text-text-primary">
                When this archetype showed up
              </h2>
            </div>
            <div className="space-y-2.5">
              {ERAS.map((era) => {
                const count = detail.eraDistribution[era.id] ?? 0;
                const pct = (count / maxEraCount) * 100;
                const accentClass = ERA_TEXT[era.color] ?? ERA_TEXT.muted;
                return (
                  <Link
                    key={era.id}
                    href={`/eras/${era.id}`}
                    className="block group"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`font-mono text-[10px] ${accentClass}`}>
                          {era.sigil}
                        </span>
                        <span className="font-mono text-[11px] text-text-primary group-hover:text-accent-violet transition-colors truncate">
                          {era.label}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-text-muted tabular-nums shrink-0">
                        {count} appearance{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: hex,
                          opacity: count > 0 ? 0.7 : 0,
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Cross-archetype affinity ───────────────────────────── */}
        {detail.coArchetypes.length > 0 && (
          <section className="space-y-4">
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
                /// often_paired_with
              </p>
              <h2 className="font-display text-lg font-bold text-text-primary">
                Compound currents
              </h2>
              <p className="font-mono text-[10px] text-text-muted/50">
                Other archetypes that show up alongside {detail.name} on the same entity.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {detail.coArchetypes.map((co) => {
                const coHex = archetypeHex(co.name);
                return (
                  <Link
                    key={co.name}
                    href={`/psychenomicon/archetypes/${co.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] transition-colors hover:bg-current/5"
                    style={{ borderColor: `${coHex}55`, color: coHex }}
                  >
                    {co.name}
                    <span className="opacity-60">×{co.count}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Entities ───────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
              /// entities_carrying_this_archetype
            </p>
            <h2 className="font-display text-lg font-bold text-text-primary">
              Who holds this current
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {detail.entities.map((entity) => {
              const statusStyle =
                STATUS_STYLES[entity.status] ?? STATUS_STYLES.active;
              return (
                <Link
                  key={entity.slug}
                  href={`/psychenomicon/entities/${entity.slug}`}
                  className="group rounded-lg border border-border bg-surface p-4 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {entity.avatarUrl ? (
                        <Image
                          src={entity.avatarUrl}
                          alt=""
                          width={28}
                          height={28}
                          className="h-7 w-7 rounded-full object-cover flex-shrink-0 border border-border group-hover:border-accent-violet/40 transition-colors"
                        />
                      ) : (
                        <div
                          className="h-7 w-7 rounded-full flex-shrink-0 border border-border flex items-center justify-center font-mono text-[9px]"
                          style={{
                            backgroundColor: `${hex}20`,
                            color: hex,
                          }}
                        >
                          {entity.name[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-text-primary group-hover:text-accent-violet transition-colors truncate">
                          {entity.name}
                        </p>
                        {entity.primaryArchetype && (
                          <p className="font-mono text-[9px] text-accent-violet/70 mt-0.5">
                            {entity.primaryArchetype}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 font-mono text-[8px] uppercase px-1.5 py-0.5 rounded border ${statusStyle}`}
                    >
                      {entity.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-text-muted">
                    <span>
                      {entity.chapterCount} chapter
                      {entity.chapterCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {entity.behaviorPatterns.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entity.behaviorPatterns.slice(0, 2).map((p) => (
                        <span
                          key={p}
                          className="rounded border border-border px-1.5 py-0.5 font-mono text-[8px] text-text-muted"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {entity.personSlug && (
                    <p className="font-mono text-[8px] text-accent-gold/50 group-hover:text-accent-gold/70 transition-colors">
                      ◈ archive profile →
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Footer Nav ─────────────────────────────────────────── */}
        <div className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/psychenomicon/archetypes"
            className="font-mono text-[10px] text-text-muted hover:text-accent-violet transition-colors"
          >
            ← All archetypes
          </Link>
          <Link
            href="/psychenomicon"
            className="font-mono text-[10px] text-text-muted hover:text-accent-violet transition-colors"
          >
            Return to Psychenomicon →
          </Link>
        </div>
      </div>
    </main>
  );
}
