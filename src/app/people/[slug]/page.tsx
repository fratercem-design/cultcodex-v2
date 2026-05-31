import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPersonBySlug, getCoAppearances } from "@/lib/queries/people";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { buildMetadata } from "@/lib/seo";
import { ERAS, getEraForEpisode } from "@/lib/eras";
import { archetypeToSlug, splitArchetypes } from "@/lib/queries/archetypes";
import { EntityHero } from "@/components/ui/entity-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EntityStatsPanel } from "@/components/ui/entity-stats-panel";
import { SectionCard } from "@/components/ui/section-card";
import { MetaRow } from "@/components/ui/meta-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ShareButtons } from "@/components/ui/share-buttons";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
import { QuoteHighlightCard } from "@/components/episodes/quote-highlight-card";
import { formatDate } from "@/lib/format/date";
import { fixThumbnailUrl } from "@/lib/format/thumbnail";
import { editorialFrame } from "@/lib/format/editorial-frame";
import { getExternalLinks } from "@/lib/format/external-links";
import { ArchiveDisclaimer } from "@/components/ui/archive-disclaimer";
import { ArchiveNotice } from "@/components/notices/archive-notice";
import { SuggestCorrection } from "@/components/ui/suggest-correction";
import { ColorLegend } from "@/components/ui/color-legend";
import { PersonSigil } from "@/components/ui/person-sigil";
import { ArchetypeTimeline } from "@/components/people/archetype-timeline";
import { ArchetypeCard } from "@/components/people/archetype-card";
import { PersonMediaSection, type PersonMediaItem } from "@/components/people/person-media-section";
import { PersonCrossRef } from "@/components/people/person-cross-ref";
import type { Metadata } from "next";

// ── Lore Summary renderer ─────────────────────────────────────────────────────
// Handles two formats:
//   1. Flat prose — render as paragraphs (legacy)
//   2. Sectioned markdown with ## headers — unified codex-entry card
function LoreSummaryCard({ loreSummary }: { loreSummary: string }) {
  const hasSections = /^##\s+\S/m.test(loreSummary);

  if (!hasSections) {
    return (
      <SectionCard title="Codex Entry">
        {loreSummary.split(/\n{2,}/).map((para, i) => (
          <p key={i} className="text-sm text-text-primary leading-relaxed mb-3 last:mb-0">
            {editorialFrame(para.trim())}
          </p>
        ))}
      </SectionCard>
    );
  }

  const sections: Array<{ heading: string; body: string }> = [];
  const parts = loreSummary.split(/^##\s+/m).filter(Boolean);
  for (const part of parts) {
    const newline = part.indexOf("\n");
    const heading = newline === -1 ? part.trim() : part.slice(0, newline).trim();
    const body = newline === -1 ? "" : part.slice(newline + 1).trim();
    sections.push({ heading, body });
  }

  const SECTION_SIGILS: Record<string, string> = {
    overview: "◈",
    storylines: "⬡",
    controversies: "⚡",
    "key relationships": "◉",
  };

  function renderBody(body: string) {
    return body.split(/\n{2,}|\n(?=[-•*])/).map((para, i) => {
      const trimmed = para.trim();
      if (!trimmed) return null;
      if (/^[-•*]\s/.test(trimmed)) {
        const bullets = trimmed.split(/\n/).filter((l) => l.trim()).map((l) => l.replace(/^[-•*]\s*/, "").trim());
        return (
          <ul key={i} className="space-y-1 mb-3 last:mb-0">
            {bullets.map((b, j) => (
              <li key={j} className="flex gap-2 text-sm text-text-primary leading-relaxed">
                <span className="text-accent-gold/60 flex-shrink-0 mt-0.5">·</span>
                <span>{editorialFrame(b)}</span>
              </li>
            ))}
          </ul>
        );
      }
      return (
        <p key={i} className="text-sm text-text-primary leading-relaxed mb-3 last:mb-0">
          {editorialFrame(trimmed)}
        </p>
      );
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      {/* Codex entry header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-elevated">
        <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold">/// codex_entry</p>
        <p className="font-mono text-[9px] text-text-muted/50 tracking-widest">AI · ARCHIVAL</p>
      </div>

      {/* Sections */}
      <div className="divide-y divide-border/60">
        {sections.map(({ heading, body }) => {
          const sigil = SECTION_SIGILS[heading.toLowerCase()] ?? "◇";
          const isControversy = heading.toLowerCase() === "controversies";
          return (
            <div key={heading} className={`px-4 py-4 ${isControversy ? "bg-red-950/10" : ""}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`font-mono text-xs ${isControversy ? "text-red-400" : "text-accent-gold"}`}>
                  {sigil}
                </span>
                <h4 className={`font-mono text-[10px] uppercase tracking-[0.3em] font-semibold ${isControversy ? "text-red-400/80" : "text-text-muted"}`}>
                  {heading}
                </h4>
              </div>
              {renderBody(body)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const people = await prisma.person.findMany({
      select: { slug: true },
      take: 300,
      orderBy: { updatedAt: "desc" },
    });
    return people.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);

  if (!person) {
    notFound();
  }

  // Noindex for "mentioned" people — they were only name-dropped, never appeared as guests.
  // This reduces SEO risk for people who didn't actively participate.
  const shouldNoIndex = person.personType === "mentioned";

  return {
    ...buildMetadata({
      title: person.displayName,
      description: person.shortBio || person.searchText || null,
      path: `/people/${person.slug}`,
    }),
    ...(shouldNoIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

const PERSON_TYPE_LABELS: Record<string, string> = {
  host: "Host",
  recurring: "Recurring",
  guest: "Guest",
  mentioned: "Mentioned",
};

const PERSON_TYPE_VARIANTS: Record<string, "green" | "purple" | "gold" | "muted"> = {
  host: "gold",
  recurring: "purple",
  guest: "green",
  mentioned: "muted",
};

export default async function PersonDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);

  if (!person) notFound();

  const allEpisodes = [
    ...person.guestAppearances.map((g) => g.episode),
    ...person.mentions.map((m) => m.episode),
  ];

  // Deduplicate by id and sort newest first
  const uniqueEpisodes = Array.from(
    new Map(allEpisodes.map((e) => [e.id, e])).values()
  ).sort((a, b) => (b.airDate?.getTime() ?? 0) - (a.airDate?.getTime() ?? 0));

  const coAppearances = person.guestAppearances.length >= 2
    ? await getCoAppearances(person.id, 6).catch(() => [])
    : [];

  // Archetype evolution — query guest appearance episodes with decodeData (not null)
  const archetypeEpisodes = person.guestAppearances.length > 0
    ? await prisma.episode.findMany({
        where: {
          guests: { some: { personId: person.id } },
          NOT: { decodeData: { equals: Prisma.AnyNull } },
        },
        select: {
          slug: true,
          title: true,
          episodeNumber: true,
          airDate: true,
          decodeData: true,
        },
        orderBy: { airDate: "asc" },
        take: 30,
      }).catch(() => [])
    : [];

  type ArchetypeEntry = {
    episodeSlug: string;
    episodeTitle: string;
    episodeNumber: number | null;
    airDate: Date | null;
    archetype: string;
    supporting: string;
  };

  const archetypeEntries: ArchetypeEntry[] = archetypeEpisodes.flatMap((ep) => {
    const data = ep.decodeData as Record<string, unknown> | null;
    if (!data) return [];
    const archetypes = data.archetypes as Array<{ speaker: string; archetype: string; supporting: string }> | undefined;
    if (!archetypes) return [];

    // Match by name similarity — person.displayName or altNames
    const names = [person.displayName, ...person.altNames].map((n) => n.toLowerCase());
    const match = archetypes.find((a) =>
      names.some((n) => a.speaker.toLowerCase().includes(n) || n.includes(a.speaker.toLowerCase()))
    );
    if (!match) return [];

    return [{
      episodeSlug: ep.slug,
      episodeTitle: ep.title,
      episodeNumber: ep.episodeNumber,
      airDate: ep.airDate,
      archetype: match.archetype,
      supporting: match.supporting,
    }];
  });

  // Psychenomicon entity cross-link — soft join via personSlug
  const psychenomiconEntity = await prisma.psychenomiconEntity.findFirst({
    where: { personSlug: slug },
    select: { slug: true, name: true, primaryArchetype: true, status: true, radarData: true, behaviorPatterns: true },
  }).catch(() => null);

  // External media (videos + wiki) — only loaded for people who have it
  const personMediaRaw = await prisma.personMedia.findMany({
    where: { personSlug: slug },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      source: true,
      sourceId: true,
      sourceUrl: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      publishedAt: true,
      durationStr: true,
      viewCount: true,
      rawContent: true,
      channelHandle: true,
    },
  }).catch(() => []);

  // Serialize Date → string before crossing the server/client boundary
  const personMediaSerialized: PersonMediaItem[] = personMediaRaw.map((m) => ({
    ...m,
    publishedAt: m.publishedAt ? m.publishedAt.toISOString() : null,
  }));
  const personMediaVideos = personMediaSerialized.filter((m) => m.source === "youtube");
  const personMediaWiki = personMediaSerialized.find((m) => m.source === "wiki") ?? null;
  const hasPersonMedia = personMediaRaw.length > 0;

  // Era presence — bucket uniqueEpisodes by era (client-side, no extra DB query)
  const ERA_BAR_COLOR: Record<string, string> = {
    gold:    "bg-accent-gold",
    violet:  "bg-accent-violet",
    cyan:    "bg-accent-cyan",
    crimson: "bg-accent-crimson",
    muted:   "bg-text-muted",
  };
  const ERA_TEXT_COLOR: Record<string, string> = {
    gold:    "text-accent-gold",
    violet:  "text-accent-violet",
    cyan:    "text-accent-cyan",
    crimson: "text-accent-crimson",
    muted:   "text-text-muted",
  };
  const eraPresence = ERAS.map((era) => {
    const count = uniqueEpisodes.filter((ep) => {
      if (!ep.airDate) return false;
      return getEraForEpisode(ep.airDate)?.id === era.id;
    }).length;
    return { era, count };
  }).filter((e) => e.count > 0);
  const maxEraCount = Math.max(...eraPresence.map((e) => e.count), 1);

  // Archetype atlas slug for backlink
  const atlasArchetypeSlug = psychenomiconEntity?.primaryArchetype
    ? archetypeToSlug(splitArchetypes(psychenomiconEntity.primaryArchetype)[0])
    : null;

  // Episodes grouped by era for the appearances section
  type EpisodeCard = (typeof uniqueEpisodes)[number];
  type EraGroup = { eraId: string; eraLabel: string; eraSigil: string; eraColor: string; episodes: EpisodeCard[] };
  const episodesByEra: EraGroup[] = [];
  const unclassified: EpisodeCard[] = [];
  for (const ep of uniqueEpisodes) {
    const era = ep.airDate ? getEraForEpisode(ep.airDate) : null;
    if (era) {
      let group = episodesByEra.find((g) => g.eraId === era.id);
      if (!group) {
        group = { eraId: era.id, eraLabel: era.label, eraSigil: era.sigil, eraColor: era.color, episodes: [] };
        episodesByEra.push(group);
      }
      group.episodes.push(ep);
    } else {
      unclassified.push(ep);
    }
  }
  // Sort era groups in reverse chronological order (newest era first, matching uniqueEpisodes sort)
  const ERA_ORDER = ERAS.map((e) => e.id);
  episodesByEra.sort((a, b) => ERA_ORDER.indexOf(b.eraId) - ERA_ORDER.indexOf(a.eraId));

  const typeLabel = PERSON_TYPE_LABELS[person.personType] ?? person.personType;
  const typeVariant = PERSON_TYPE_VARIANTS[person.personType] ?? "muted";

  const glanceItems = [
    { icon: "🎭", label: typeLabel },
    ...(uniqueEpisodes.length > 0
      ? [{ icon: "🎬", label: `${uniqueEpisodes.length} appearance${uniqueEpisodes.length !== 1 ? "s" : ""}` }]
      : []),
    ...(person.quotes.length > 0
      ? [{ icon: "💬", label: `${person.quotes.length} quote${person.quotes.length !== 1 ? "s" : ""}` }]
      : []),
    ...(person.firstAppearanceEpisode?.airDate
      ? [{ icon: "📅", label: `First seen ${formatDate(person.firstAppearanceEpisode.airDate)}` }]
      : []),
    ...(person.topics.length > 0
      ? [{ icon: "🏷️", label: `${person.topics.length} topic${person.topics.length !== 1 ? "s" : ""}` }]
      : []),
  ];

  return (
    <>
      <EntityHero
        title={person.displayName}
        subtitle={person.shortBio ?? undefined}
        backgroundImage="/wiki-page-header.jpg"
        avatarUrl={person.avatarUrl}
        fallbackAvatar={
          <PersonSigil
            slug={person.slug}
            name={person.displayName}
            personType={person.personType}
            size={80}
            decorative
            className="h-14 w-14 sm:h-20 sm:w-20 rounded-full border-2 border-accent-gold/40 shadow-lg"
          />
        }
        badges={[{ label: typeLabel, variant: typeVariant }]}
        neonTitle={person.slug === "alexandra-mayers"}
        label="voice"
      />
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "People", href: "/people" },
        { label: person.displayName },
      ]} />
      <EntityGlanceBar items={glanceItems} />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
        <ArchiveNotice
          entityType="person"
          entityName={person.displayName}
          className="mb-6"
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Codex profile — AI-generated character entry */}
            {person.loreSummary ? (
              <LoreSummaryCard loreSummary={person.loreSummary} />
            ) : person.guestAppearances.length >= 2 && (
              <div className="rounded-lg border border-border bg-surface overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-elevated">
                  <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-text-muted">/// codex_entry</p>
                  <p className="font-mono text-[9px] text-text-muted/40 tracking-widest">PENDING</p>
                </div>
                <div className="px-4 py-5 flex items-center gap-3">
                  <span className="font-mono text-sm text-text-muted/30">◈</span>
                  <p className="font-mono text-[10px] text-text-muted/50 uppercase tracking-widest">
                    Awaiting archival — profile not yet generated
                  </p>
                </div>
              </div>
            )}

            {/* Archetype Evolution */}
            {archetypeEntries.length > 0 && (
              <SectionCard title="Archetype Evolution">
                <ArchetypeTimeline
                  entries={archetypeEntries}
                  personName={person.displayName}
                />
              </SectionCard>
            )}

            {/* Color legend */}
            <ColorLegend />

            {/* Appearances */}
            <SectionCard title={`Appearances (${uniqueEpisodes.length})`} accent="gold">
              {uniqueEpisodes.length > 0 ? (
                <div className="space-y-6">
                  {episodesByEra.map((group) => (
                    <div key={group.eraId}>
                      <Link
                        href={`/eras/${group.eraId}`}
                        className={`group mb-3 flex items-center gap-2 ${ERA_TEXT_COLOR[group.eraColor] ?? "text-text-muted"}`}
                      >
                        <span className="font-mono text-[11px]">{group.eraSigil}</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">
                          {group.eraLabel}
                        </span>
                        <span className="font-mono text-[9px] text-text-muted/50">
                          {group.episodes.length} ep{group.episodes.length !== 1 ? "s" : ""}
                        </span>
                        <span className="ml-auto font-mono text-[9px] text-text-muted/40 group-hover:text-text-muted transition-colors">
                          era →
                        </span>
                      </Link>
                      <div className="grid gap-3">
                        {group.episodes.map((ep) => (
                          <EpisodeListItem
                            key={ep.id}
                            slug={ep.slug}
                            title={ep.title}
                            episodeNumber={ep.episodeNumber}
                            airDate={ep.airDate}
                            summaryShort={ep.summaryShort}
                            thumbnailUrl={fixThumbnailUrl(ep.thumbnailUrl)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  {unclassified.length > 0 && (
                    <div>
                      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-text-muted/40">
                        Unclassified
                      </p>
                      <div className="grid gap-3">
                        {unclassified.map((ep) => (
                          <EpisodeListItem
                            key={ep.id}
                            slug={ep.slug}
                            title={ep.title}
                            episodeNumber={ep.episodeNumber}
                            airDate={ep.airDate}
                            summaryShort={ep.summaryShort}
                            thumbnailUrl={fixThumbnailUrl(ep.thumbnailUrl)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-muted">No appearances recorded</p>
              )}
            </SectionCard>

            {/* Quotes */}
            {person.quotes.length > 0 && (
              <SectionCard title={`Quotes (${person.quotes.length})`} accent="red">
                <div className="space-y-4">
                  {person.quotes.map((q) => (
                    <QuoteHighlightCard
                      key={q.id}
                      id={q.id}
                      text={q.text}
                      speakerName={person.displayName}
                      speakerAvatarUrl={person.avatarUrl}
                      speakerSlug={person.slug}
                      speakerType={person.personType}
                      timestampSeconds={q.timestampSeconds}
                    />
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EntityStatsPanel
              stats={[
                { icon: "🎤", label: "Appearances", value: person.guestAppearances.length },
                { icon: "📢", label: "Mentions", value: person.mentions.length },
                { icon: "💬", label: "Quotes", value: person.quotes.length },
                { icon: "🏷️", label: "Topics", value: person.topics.length },
                { icon: "🔗", label: "Lore Links", value: person.loreConnections.length },
              ]}
            />

            {/* Era Presence */}
            {eraPresence.length > 0 && (
              <div className="rounded-lg border border-border bg-surface overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-elevated">
                  <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-text-muted/70">
                    Era Presence
                  </p>
                  <p className="font-mono text-[9px] text-text-muted/40">
                    {eraPresence.length} era{eraPresence.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="px-4 py-3 space-y-2.5">
                  {eraPresence.map(({ era, count }) => {
                    const barColor = ERA_BAR_COLOR[era.color] ?? "bg-text-muted";
                    const textColor = ERA_TEXT_COLOR[era.color] ?? "text-text-muted";
                    const pct = Math.round((count / maxEraCount) * 100);
                    return (
                      <Link
                        key={era.id}
                        href={`/eras/${era.id}`}
                        className="group block"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-mono text-[10px] ${textColor} group-hover:opacity-80 transition-opacity`}>
                            {era.sigil} {era.label}
                          </span>
                          <span className="font-mono text-[9px] text-text-muted/50 tabular-nums">
                            {count}
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-border overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor} opacity-60 group-hover:opacity-80 transition-opacity`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {eraPresence.length === ERAS.length && (
                  <div className="border-t border-border/60 px-4 py-2">
                    <p className="font-mono text-[9px] text-accent-gold/60 uppercase tracking-widest">
                      ◈ Spans all eras
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Psychenomicon archetype intelligence card */}
            {psychenomiconEntity && (
              <ArchetypeCard
                entitySlug={psychenomiconEntity.slug}
                primaryArchetype={psychenomiconEntity.primaryArchetype}
                status={psychenomiconEntity.status}
                radarData={psychenomiconEntity.radarData}
                behaviorPatterns={psychenomiconEntity.behaviorPatterns}
                archetypeAtlasSlug={atlasArchetypeSlug}
              />
            )}

            {coAppearances.length > 0 && (
              <SectionCard title="Frequently Appears With" accent="gold">
                <div className="grid grid-cols-3 gap-3">
                  {coAppearances.map((coGuest) => (
                    <Link
                      key={coGuest.id}
                      href={`/people/${coGuest.slug}`}
                      className="group flex flex-col items-center gap-1.5 text-center"
                    >
                      {coGuest.avatarUrl ? (
                        <Image
                          src={coGuest.avatarUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover border border-border group-hover:border-accent-gold/50 transition-colors"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-gold/15 font-mono text-sm font-bold text-accent-gold border border-border group-hover:border-accent-gold/50 transition-colors">
                          {coGuest.displayName[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <span className="font-mono text-[10px] text-text-muted group-hover:text-accent-gold transition-colors line-clamp-1">
                        {coGuest.displayName}
                      </span>
                      <span className="font-mono text-[9px] text-text-muted">
                        {coGuest.sharedEpisodes} shared
                      </span>
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/graph/path?from=${person.slug}`}
                  className="mt-4 block w-full rounded border border-accent-violet/30 bg-accent-violet/5 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-accent-violet hover:bg-accent-violet/10 transition-colors"
                >
                  Find a path to anyone →
                </Link>
              </SectionCard>
            )}

            <ShareButtons
              url={`/people/${person.slug}`}
              title={person.displayName}
              type="person"
            />

            <SectionCard title="Dossier">
              <MetaRow
                label="Type"
                value={<StatusBadge label={typeLabel} variant={typeVariant} />}
              />
              {person.firstAppearanceEpisode && (
                <MetaRow
                  label="First Seen"
                  value={formatDate(person.firstAppearanceEpisode.airDate)}
                />
              )}
              {person.altNames.length > 0 && (
                <MetaRow label="Also Known As" value={person.altNames.join(", ")} />
              )}
            </SectionCard>

            {/* External Links */}
            {(() => {
              const links = getExternalLinks(person.slug);
              if (links.length === 0) return null;
              const isYt = (url: string) => url.includes("youtube.com") || url.includes("youtu.be");
              return (
                <SectionCard title="External Links">
                  <ul className="space-y-2">
                    {links.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`group flex items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                            isYt(link.url)
                              ? "border-red-800/50 bg-red-950/30 hover:border-red-500/60 hover:bg-red-900/30"
                              : "border-border bg-surface hover:border-accent-cyan/40 hover:bg-elevated"
                          }`}
                        >
                          <span className="text-sm">
                            {isYt(link.url) ? "▶" : (link.icon ?? "🔗")}
                          </span>
                          <span className={`font-mono text-xs group-hover:underline ${isYt(link.url) ? "text-red-400" : "text-accent-cyan"}`}>
                            {link.label}
                          </span>
                          {isYt(link.url) && (
                            <span className="ml-1 rounded-sm bg-red-600 px-1 py-0.5 text-[9px] font-bold uppercase text-white tracking-wide">
                              YouTube
                            </span>
                          )}
                          <span className="ml-auto font-mono text-[10px] text-text-muted">↗</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              );
            })()}

            <SectionCard>
              <EntityChipList
                title="Topics"
                entities={person.topics.map((t) => ({
                  label: t.topic.title,
                  slug: t.topic.slug,
                  type: "topic",
                }))}
              />
            </SectionCard>

            <SectionCard>
              <EntityChipList
                title="Lore Connections"
                entities={person.loreConnections.map((l) => ({
                  label: l.loreEntry.title,
                  slug: l.loreEntry.slug,
                  type: "lore",
                }))}
              />
            </SectionCard>

            {/* Semantic cross-reference — moments across the archive about this person */}
            <Suspense fallback={null}>
              <PersonCrossRef
                personName={person.displayName}
                shortBio={person.shortBio ?? undefined}
              />
            </Suspense>

          {/* Alexandra Mayers external content section */}
          {hasPersonMedia && (
            <PersonMediaSection
              personName={person.displayName}
              videos={personMediaVideos}
              wiki={personMediaWiki}
            />
          )}
          </div>
        </div>

        <SuggestCorrection
          entityType="person"
          entityTitle={person.displayName}
          className="mt-8"
        />
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: person.displayName,
            ...(person.shortBio ? { description: person.shortBio } : {}),
            ...(person.avatarUrl ? { image: person.avatarUrl } : {}),
            url: `https://cultcodex.me/people/${person.slug}`,
            ...(person.firstAppearanceEpisode?.airDate
              ? { firstAppearance: person.firstAppearanceEpisode.airDate.toISOString().slice(0, 10) }
              : {}),
            numberOfAppearances: uniqueEpisodes.length,
            ...(uniqueEpisodes.length > 0
              ? { numberOfItems: uniqueEpisodes.length }
              : {}),
          }),
        }}
      />
    </>
  );
}
