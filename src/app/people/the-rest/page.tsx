
/**
 * /people/the-rest
 *
 * A compiled entry for all guests and unknowns who passed through the archive
 * without accumulating a full profile — one-time appearances, name-drops,
 * unidentified voices. Their appearances and moments are collected here rather
 * than scattered across dozens of stub pages.
 */

import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
import { AiNotice } from "@/components/ui/ai-notice";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The Rest — Voices — CultCodex",
  description:
    "Every guest, unknown, or passing voice who entered the Cult of Psyche stream without a full profile. One-time appearances, unidentified voices, and name-drops — compiled in one entry.",
  alternates: { canonical: "/people/the-rest" },
  robots: { index: false },
};

const EPISODE_SELECT = {
  id: true,
  slug: true,
  title: true,
  episodeNumber: true,
  airDate: true,
  summaryShort: true,
  thumbnailUrl: true,
} as const;

export default async function TheRestPage() {
  // All guests + mentioned without a profile (no bio, no lore)
  const [unprofiled, profiled] = await Promise.all([
    prisma.person.findMany({
      where: {
        personType: { in: ["guest", "mentioned"] },
        loreSummary: null,
        shortBio: null,
      },
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        slug: true,
        personType: true,
        guestAppearances: {
          select: { episode: { select: EPISODE_SELECT } },
          orderBy: { episode: { airDate: "desc" } },
          take: 5,
        },
        mentions: {
          select: { episode: { select: EPISODE_SELECT } },
          orderBy: { episode: { airDate: "desc" } },
          take: 3,
        },
        quotes: {
          select: { id: true, text: true, episode: { select: { id: true } } },
          take: 2,
        },
      },
    }).catch(() => []),
    prisma.person.findMany({
      where: {
        personType: "guest",
        OR: [{ loreSummary: { not: null } }, { shortBio: { not: null } }],
      },
      orderBy: [{ guestAppearances: { _count: "desc" } }, { displayName: "asc" }],
      select: {
        id: true,
        displayName: true,
        slug: true,
        shortBio: true,
        _count: { select: { guestAppearances: true } },
      },
      take: 60,
    }).catch(() => []),
  ]);

  // Aggregate episode list across all unprofiled (deduplicated, newest first)
  type EpRow = (typeof unprofiled)[0]["guestAppearances"][0]["episode"];
  const episodeMap = new Map<string, EpRow>();
  for (const person of unprofiled) {
    for (const g of person.guestAppearances) {
      if (!episodeMap.has(g.episode.id)) episodeMap.set(g.episode.id, g.episode);
    }
  }
  const recentEpisodes = [...episodeMap.values()]
    .sort((a, b) => (b.airDate?.getTime() ?? 0) - (a.airDate?.getTime() ?? 0))
    .slice(0, 20);

  const totalGuests = unprofiled.filter((p) => p.personType === "guest").length;
  const totalMentioned = unprofiled.filter((p) => p.personType === "mentioned").length; // "unknown" in archive parlance

  return (
    <>
      <PageHero
        title="THE REST"
        subtitle="Every guest, unknown, and passing voice"
        backgroundImage="/wiki-page-header.jpg"
        label="voices · archive"
      />

      {/* Stats strip */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--term-line)",
          backgroundColor: "var(--term-bg-1)",
        }}
      >
        {[
          { value: unprofiled.length, label: "Total in this entry" },
          { value: totalGuests, label: "One-time guests" },
          { value: totalMentioned, label: "Unknown / mentioned" },
          { value: profiled.length, label: "Guests with profiles" },
        ].map(({ value, label }, i, arr) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: "16px 12px",
              textAlign: "center",
              borderRight: i < arr.length - 1 ? "1px solid var(--term-line)" : undefined,
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: "var(--neon-3)",
                textShadow: "0 0 8px currentColor",
                lineHeight: 1,
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontSize: 9,
                color: "var(--term-fg-faint)",
                letterSpacing: "0.1em",
                marginTop: 4,
              }}
            >
              {label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Codex entry */}
        <SectionCard title="Codex Entry">
          <p className="text-sm text-text-primary leading-relaxed mb-3">
            Not every voice that entered the Cult of Psyche stream left a name. Not every
            name left a story. The Rest is the archive&apos;s acknowledgment of that — a
            collective entry for the {unprofiled.length.toLocaleString()} guests,
            one-time speakers, and mentioned figures who passed through without accumulating
            enough of a footprint to justify a standalone profile.
          </p>
          <p className="text-sm text-text-primary leading-relaxed mb-3">
            Their appearances are real. Their moments in the transcript are real. But the
            archive&apos;s function is to surface signal, not to maintain stubs. When a voice
            becomes distinct enough to require its own entry — through recurring appearances,
            a developed lore connection, or a notable moment — it gets promoted out of
            this page. Until then: this is where they live.
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            If a specific guest is missing context or has been misidentified, use the{" "}
            <Link href="/corrections" className="underline hover:text-text-primary">
              corrections channel
            </Link>
            .
          </p>
          <AiNotice className="mt-4" />
        </SectionCard>

        {/* Profiled guests with links */}
        {profiled.length > 0 && (
          <SectionCard title={`Notable Guests — Full Profiles (${profiled.length})`}>
            <p className="text-xs text-text-muted mb-4">
              These guests have enough archive footprint for a dedicated entry.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 8,
              }}
            >
              {profiled.map((p) => (
                <Link
                  key={p.id}
                  href={`/people/${p.slug}`}
                  className="rest-person-link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 4,
                    textDecoration: "none",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "var(--neon-3)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ fontSize: 12, color: "var(--term-fg)", flex: 1, minWidth: 0 }}
                    className="truncate"
                  >
                    {p.displayName}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: "var(--term-fg-faint)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {p._count.guestAppearances}×
                  </span>
                </Link>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Recent episodes with any of these guests */}
        {recentEpisodes.length > 0 && (
          <SectionCard title="Recent Episodes with Unproiled Voices">
            <p className="text-xs text-text-muted mb-4">
              Episodes where one or more voices in this entry appeared.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentEpisodes.map((ep) => (
                <EpisodeListItem key={ep.id} {...ep} />
              ))}
            </div>
          </SectionCard>
        )}

        {/* A–Z name list of unprofiled */}
        <SectionCard title={`All Voices In This Entry (${unprofiled.length})`}>
          <p className="text-xs text-text-muted mb-4">
            Alphabetical. Names without hyperlinks have no standalone profile — their
            appearances are documented in episode transcripts only.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 4,
            }}
          >
            {unprofiled.map((p) => {
              const appearances =
                p.guestAppearances.length + p.mentions.length;
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px",
                    borderRadius: 3,
                  }}
                >
                  <span
                    title={p.personType === "mentioned" ? "Unknown / mentioned only" : "Guest"}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: p.personType === "mentioned" ? 1 : "50%", // square = unknown
                      flexShrink: 0,
                      backgroundColor:
                        p.personType === "mentioned"
                          ? "var(--term-fg-faint)"
                          : "var(--neon-3)",
                      opacity: 0.5,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--term-fg-dim)",
                      flex: 1,
                      minWidth: 0,
                    }}
                    className="truncate"
                    title={p.displayName}
                  >
                    {p.displayName}
                  </span>
                  {appearances > 0 && (
                    <span
                      style={{
                        fontSize: 9,
                        color: "var(--term-fg-faint)",
                        flexShrink: 0,
                      }}
                    >
                      {appearances}×
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
          <Link
            href="/people"
            style={{
              fontSize: 10,
              color: "var(--term-fg-faint)",
              textDecoration: "none",
              letterSpacing: "0.08em",
            }}
          >
            ← ALL VOICES
          </Link>
          <Link
            href="/people?filter=recurring"
            style={{
              fontSize: 10,
              color: "var(--term-fg-faint)",
              textDecoration: "none",
              letterSpacing: "0.08em",
            }}
          >
            RECURRING FIGURES →
          </Link>
        </div>
      </div>
    </>
  );
}
