import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { jsonLdScript, breadcrumbListJsonLd } from "@/lib/seo";
import { ArchetypeTimelineChart } from "@/components/psychenomicon/archetype-timeline-chart";
import { ArchetypeRadarChart } from "@/components/psychenomicon/archetype-radar-chart";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entity = await prisma.psychenomiconEntity.findUnique({ where: { slug }, select: { name: true, primaryArchetype: true } }).catch(() => null);
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

export default async function EntityPage({ params }: PageProps) {
  const { slug } = await params;

  const user = await getCurrentUser();
  const canRead = user ? await isSubscribed(user.id).catch(() => false) : false;

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
        include: { chapter: { select: { slug: true, chapterNumber: true, title: true, isMajorEvent: true } } },
        orderBy: { chapter: { chapterNumber: "asc" } },
      },
      archetypeEvents: {
        orderBy: { chapterNumber: "asc" },
        select: { chapterNumber: true, primaryArchetype: true, secondaryArchetypes: true, confidenceScore: true, triggerEvent: true },
      },
    },
  }).catch(() => null);

  if (!entity) notFound();

  const archetypeHistory = (entity.archetypeHistory as ArchetypeHistoryEntry[] | null) ?? [];
  const radarData = (entity.radarData as RadarData | null) ?? {};
  const hasRadar = Object.keys(radarData).length > 0;
  const hasEvents = entity.archetypeEvents.length > 0;

  // Detect archetype shifts for alert badges
  const shifts: Array<{ from: string; to: string; chapterNumber: number; trigger?: string }> = [];

  // Pattern detection: derive behavioral insights from events + trigger text
  const patterns: string[] = [];
  if (entity.archetypeEvents.length >= 2) {
    // Dominant archetype
    const archetypeCounts: Record<string, number> = {};
    for (const e of entity.archetypeEvents) {
      archetypeCounts[e.primaryArchetype] = (archetypeCounts[e.primaryArchetype] ?? 0) + 1;
    }
    const dominant = Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1])[0];
    if (dominant) patterns.push(`Default state: ${dominant[0]}`);

    // Trigger keyword patterns
    const triggerText = entity.archetypeEvents
      .map((e) => e.triggerEvent ?? "")
      .join(" ")
      .toLowerCase();
    if (triggerText.includes("chaos") || triggerText.includes("disrupt")) {
      patterns.push("Escalates under structural tension");
    }
    if (triggerText.includes("ignored") || triggerText.includes("no response") || triggerText.includes("silence")) {
      patterns.push("Shifts archetype when responses are withheld");
    }
    if (triggerText.includes("accused") || triggerText.includes("accusation") || triggerText.includes("cult")) {
      patterns.push("Identity intensifies under external accusation");
    }
    if (triggerText.includes("boundary") || triggerText.includes("enforce") || triggerText.includes("authority")) {
      patterns.push("Tests the limit of enforcement, not permission");
    }
    if (triggerText.includes("consistent") || triggerText.includes("presence") || triggerText.includes("orbit")) {
      patterns.push("Influence compounds through repetition, not force");
    }

    // Trajectory
    const first = entity.archetypeEvents[0].primaryArchetype;
    const last = entity.archetypeEvents[entity.archetypeEvents.length - 1].primaryArchetype;
    if (first !== last) {
      patterns.push(`Trajectory: ${first} → ${last}`);
    }
  }
  for (let i = 1; i < entity.archetypeEvents.length; i++) {
    const prev = entity.archetypeEvents[i - 1];
    const curr = entity.archetypeEvents[i];
    if (prev.primaryArchetype !== curr.primaryArchetype) {
      shifts.push({
        from: prev.primaryArchetype,
        to: curr.primaryArchetype,
        chapterNumber: curr.chapterNumber,
        trigger: curr.triggerEvent ?? undefined,
      });
    }
  }

  return (
    <main className="min-h-screen bg-void">
      {/* Header */}
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
            <div className="flex flex-col items-end gap-1.5">
              <span className={`inline-flex items-center rounded border px-2.5 py-1 font-mono text-[9px] uppercase ${
                entity.status === "evolved"
                  ? "border-accent-gold/40 text-accent-gold bg-accent-gold/10"
                  : entity.status === "dormant"
                  ? "border-border text-text-muted"
                  : "border-accent-violet/40 text-accent-violet bg-accent-violet/10"
              }`}>
                {entity.status}
              </span>
              <span className="font-mono text-[9px] text-text-muted">
                {entity.appearances.length} chapter{entity.appearances.length !== 1 ? "s" : ""}
              </span>
              {shifts.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded border border-accent-gold/40 bg-accent-gold/10 px-2 py-0.5 font-mono text-[9px] text-accent-gold">
                  ⚠ {shifts.length} shift{shifts.length !== 1 ? "s" : ""} detected
                </span>
              )}
            </div>
          </div>

          {entity.behaviorPatterns.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {entity.behaviorPatterns.map((p) => (
                <span key={p} className="inline-flex items-center rounded border border-border px-2 py-0.5 font-mono text-[9px] text-text-muted">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 grid gap-8 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">

          {/* Evolution timeline chart */}
          {hasEvents && (
            <ArchetypeTimelineChart
              events={entity.archetypeEvents}
              entityName={entity.name}
            />
          )}

          {/* Archetype shift alerts */}
          {shifts.length > 0 && (
            <div className="space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold">/// shift_alerts</p>
              {shifts.map((s, i) => (
                <div key={i} className="rounded border border-accent-gold/20 bg-accent-gold/5 px-4 py-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-accent-gold">⚠ CH.{String(s.chapterNumber).padStart(3, "0")}</span>
                    <span className="font-mono text-[9px] text-text-muted">{s.from}</span>
                    <span className="font-mono text-[9px] text-text-muted">→</span>
                    <span className="font-mono text-[9px] text-accent-gold font-bold">{s.to}</span>
                  </div>
                  {s.trigger && <p className="text-[10px] text-text-muted italic leading-relaxed">{s.trigger}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Pattern detection */}
          {patterns.length > 0 && (
            <div className="space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">/// behavioral_patterns</p>
              <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
                {patterns.map((p, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="font-mono text-[9px] text-accent-violet/60 flex-shrink-0 mt-0.5">▸</span>
                    <p className="text-xs text-text-muted leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapter appearances timeline */}
          <section className="space-y-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">/// chapter_appearances</p>
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

          {/* Archetype history detail */}
          {archetypeHistory.length > 1 && (
            <section className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">/// known_transitions</p>
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

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Radar chart */}
          {hasRadar && (
            <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">/// trait_profile</p>
              <ArchetypeRadarChart radarData={radarData} />
              <div className="space-y-1.5 pt-1">
                {(["influence", "volatility", "manipulation", "control", "emotionalIntensity"] as const).map((key) => {
                  const labels: Record<string, string> = {
                    influence: "Influence",
                    volatility: "Volatility",
                    manipulation: "Manipulation",
                    control: "Control",
                    emotionalIntensity: "Emotion",
                  };
                  const val = radarData[key];
                  if (val == null) return null;
                  const pct = (val / 10) * 100;
                  const colors: Record<string, string> = {
                    influence: "bg-accent-gold",
                    volatility: "bg-red-500",
                    manipulation: "bg-accent-violet",
                    control: "bg-accent-cyan",
                    emotionalIntensity: "bg-amber-500",
                  };
                  return (
                    <div key={key} className="space-y-0.5">
                      <div className="flex justify-between">
                        <span className="font-mono text-[8px] uppercase tracking-widest text-text-muted">{labels[key]}</span>
                        <span className="font-mono text-[8px] text-text-muted">{val}/10</span>
                      </div>
                      <div className="h-1 rounded-full bg-border overflow-hidden">
                        <div className={`h-full rounded-full ${colors[key]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            "@context": "https://schema.org",
            "@type": entity.personSlug ? "Person" : "Thing",
            name: entity.name,
            ...(entity.primaryArchetype ? { description: `${entity.primaryArchetype} — Psychenomicon entity` } : {}),
            url: `https://cultcodex.me/psychenomicon/entities/${entity.slug}`,
            ...(entity.personSlug
              ? { sameAs: `https://cultcodex.me/people/${entity.personSlug}` }
              : {}),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbListJsonLd([
              { name: "CultCodex", url: "https://cultcodex.me" },
              { name: "Psychenomicon", url: "https://cultcodex.me/psychenomicon" },
              { name: "Entities", url: "https://cultcodex.me/psychenomicon/entities" },
              { name: entity.name, url: `https://cultcodex.me/psychenomicon/entities/${entity.slug}` },
            ])
          ),
        }}
      />
    </main>
  );
}
