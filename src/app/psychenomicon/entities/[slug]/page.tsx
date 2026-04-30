import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entity = await prisma.psychenomiconEntity.findUnique({ where: { slug }, select: { name: true, primaryArchetype: true } });
  if (!entity) return { title: "Entity Not Found" };
  return { title: `${entity.name} — ${entity.primaryArchetype ?? "Entity"} — Psychenomicon` };
}

interface RadarData {
  influence?: number;
  volatility?: number;
  manipulation?: number;
  control?: number;
  emotionalIntensity?: number;
}

interface ArchetypeHistoryEntry {
  archetype: string;
  chapterNumber: number;
  reason: string;
}

function RadarBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted">{label}</span>
        <span className="font-mono text-[9px] text-text-muted">{value}/10</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function EntityPage({ params }: PageProps) {
  const { slug } = await params;

  const user = await getCurrentUser();
  const canRead = user ? await isSubscribed(user.id) : false;

  if (!canRead) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet">/// initiate_only</p>
          <p className="font-display text-xl font-bold text-text-primary">Entity sealed.</p>
          <Link href="/premium#access" className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 px-5 py-2 font-mono text-xs font-bold text-accent-violet hover:bg-accent-violet/20 transition-colors">
            Become Initiate+ →
          </Link>
        </div>
      </main>
    );
  }

  const entity = await prisma.psychenomiconEntity.findUnique({
    where: { slug },
    include: {
      appearances: {
        include: {
          chapter: { select: { slug: true, chapterNumber: true, title: true, isMajorEvent: true } },
        },
        orderBy: { chapter: { chapterNumber: "asc" } },
      },
    },
  });

  if (!entity) notFound();

  const archetypeHistory = (entity.archetypeHistory as ArchetypeHistoryEntry[] | null) ?? [];
  const radarData = (entity.radarData as RadarData | null) ?? {};
  const hasRadar = Object.keys(radarData).length > 0;

  const radarFields: Array<{ key: keyof RadarData; label: string; color: string }> = [
    { key: "influence", label: "Influence", color: "bg-accent-gold" },
    { key: "volatility", label: "Volatility", color: "bg-red-500" },
    { key: "manipulation", label: "Manipulation", color: "bg-accent-violet" },
    { key: "control", label: "Control", color: "bg-accent-cyan" },
    { key: "emotionalIntensity", label: "Emotional Intensity", color: "bg-amber-500" },
  ];

  return (
    <main className="min-h-screen bg-void">
      {/* Entity header */}
      <header className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-12 px-4">
        <div className="mx-auto max-w-4xl space-y-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet/60">
            ψ PSYCHENOMICON · ENTITY ψ
          </p>
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">{entity.name}</h1>
              {entity.primaryArchetype && (
                <p className="font-mono text-sm text-accent-violet mt-1">{entity.primaryArchetype}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`inline-flex items-center rounded border px-2.5 py-1 font-mono text-[9px] uppercase ${
                entity.status === "evolved"
                  ? "border-accent-gold/40 text-accent-gold bg-accent-gold/10"
                  : entity.status === "dormant"
                  ? "border-border text-text-muted"
                  : "border-accent-violet/40 text-accent-violet bg-accent-violet/10"
              }`}>
                {entity.status}
              </span>
              <span className="font-mono text-[9px] text-text-muted">{entity.appearances.length} chapter{entity.appearances.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Behavior patterns */}
          {entity.behaviorPatterns.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {entity.behaviorPatterns.slice(0, 6).map((p) => (
                <span key={p} className="inline-flex items-center rounded border border-border px-2 py-0.5 font-mono text-[9px] text-text-muted">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 grid gap-8 lg:grid-cols-3">
        {/* Main: Archetype timeline */}
        <div className="lg:col-span-2 space-y-8">
          {/* Chapter appearances timeline */}
          <section className="space-y-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">/// archetype_timeline</p>
            {entity.appearances.length > 0 ? (
              <div className="relative pl-6">
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-4">
                  {entity.appearances.map((ap, i) => {
                    const isLast = i === entity.appearances.length - 1;
                    const prevArchetype = i > 0 ? entity.appearances[i - 1].archetypeAt : null;
                    const shifted = prevArchetype && ap.archetypeAt && prevArchetype !== ap.archetypeAt;
                    return (
                      <div key={ap.chapter.slug} className="relative">
                        <div className={`absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-void ${
                          ap.chapter.isMajorEvent ? "bg-accent-gold" : isLast ? "bg-accent-violet" : "bg-border"
                        }`} />
                        <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/psychenomicon/chapters/${ap.chapter.slug}`}
                              className="font-mono text-[10px] text-text-muted hover:text-accent-violet transition-colors"
                            >
                              CH.{String(ap.chapter.chapterNumber).padStart(3, "0")}
                            </Link>
                            {ap.archetypeAt && (
                              <span className="inline-flex items-center rounded border border-accent-violet/30 bg-accent-violet/10 px-2 py-0.5 font-mono text-[9px] text-accent-violet">
                                {ap.archetypeAt}
                              </span>
                            )}
                            {shifted && (
                              <span className="font-mono text-[9px] text-accent-gold">
                                ← evolved from {prevArchetype}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/psychenomicon/chapters/${ap.chapter.slug}`}
                            className="font-mono text-xs text-text-primary hover:text-accent-violet transition-colors line-clamp-2"
                          >
                            {ap.chapter.title}
                          </Link>
                          {ap.significance && (
                            <p className="text-[10px] text-text-muted leading-relaxed italic">{ap.significance}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No chapter appearances recorded.</p>
            )}
          </section>

          {/* Full archetype history */}
          {archetypeHistory.length > 1 && (
            <section className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">/// archetype_evolution</p>
              <div className="space-y-2">
                {archetypeHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <span className="font-mono text-[9px] text-text-muted w-16 flex-shrink-0 pt-0.5">
                      CH.{String(h.chapterNumber).padStart(3, "0")}
                    </span>
                    <span className="inline-flex items-center rounded border border-accent-violet/20 bg-accent-violet/5 px-2 py-0.5 font-mono text-[9px] text-accent-violet flex-shrink-0">
                      {h.archetype}
                    </span>
                    {h.reason && <span className="text-text-muted leading-relaxed">{h.reason}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: Radar */}
        <aside className="space-y-6">
          {hasRadar && (
            <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">/// trait_profile</p>
              {radarFields.map((f) => {
                const val = radarData[f.key];
                if (val == null) return null;
                return <RadarBar key={f.key} label={f.label} value={val} color={f.color} />;
              })}
            </div>
          )}

          {entity.personSlug && (
            <Link
              href={`/people/${entity.personSlug}`}
              className="block rounded border border-border bg-surface px-4 py-3 font-mono text-[10px] text-text-muted hover:text-accent-cyan hover:border-accent-cyan/30 transition-all"
            >
              View archive profile →
            </Link>
          )}

          <Link
            href="/psychenomicon"
            className="block font-mono text-[10px] text-text-muted hover:text-accent-violet transition-colors"
          >
            ← Return to Psychenomicon
          </Link>
        </aside>
      </div>
    </main>
  );
}
