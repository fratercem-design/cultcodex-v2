import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { SyncPanel } from "./sync-panel";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sync — Admin — CULT CODEX",
};

export default async function SyncPage() {
  await requireAdmin();

  const [
    totalEpisodes,
    withTranscript,
    withoutTranscript,
    withYoutubeId,
    unenrichedEpisodes,
    enrichmentQueued,
    unenrichedPeople,
    totalPeople,
  ] = await Promise.all([
    prisma.episode.count({ where: { status: "published" } }),
    prisma.episode.count({
      where: { status: "published", youtubeVideoId: { not: null }, segments: { some: {} } },
    }),
    prisma.episode.count({
      where: { status: "published", youtubeVideoId: { not: null }, segments: { none: {} } },
    }),
    prisma.episode.count({ where: { youtubeVideoId: { not: null } } }),
    prisma.episode.count({
      where: {
        AND: [
          { OR: [{ summaryShort: null }, { summaryShort: "" }] },
          { OR: [{ summaryFacts: null }, { summaryFacts: "" }, { summaryFacts: "—" }] },
          { OR: [{ summaryLong: null }, { summaryLong: "" }] },
        ],
      },
    }),
    prisma.episode.count({ where: { enrichmentQueued: true } }),
    prisma.person.count({
      where: {
        guestAppearances: { some: {} },
        OR: [{ loreSummary: null }, { loreSummary: "" }],
      },
    }),
    prisma.person.count({ where: { guestAppearances: { some: {} } } }),
  ]);

  return (
    <main id="main-content" className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-accent-gold">Sync & Enrich</h1>
        <p className="font-mono text-xs text-text-muted mt-1">
          Import episodes, fetch transcripts, and run AI enrichment to build the archive.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total episodes", value: totalEpisodes, color: "text-text-primary" },
          { label: "Have transcript", value: withTranscript, color: "text-accent-violet-text" },
          { label: "Need transcript", value: withoutTranscript, color: "text-accent-cyan" },
          { label: "Need enrichment", value: unenrichedEpisodes, color: "text-accent-gold-text" },
          { label: "⚡ Enrich queued", value: enrichmentQueued, color: "text-accent-gold-text" },
          { label: "With YouTube ID", value: withYoutubeId, color: "text-text-muted" },
          { label: "Total people", value: totalPeople, color: "text-text-muted" },
          { label: "Need profiles", value: unenrichedPeople, color: "text-accent-crimson-text" },
          {
            label: "Profiles done",
            value: totalPeople - unenrichedPeople,
            color: "text-accent-gold-text",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-surface p-4 text-center">
            <p className={`font-display text-3xl font-bold ${s.color}`}>{s.value.toLocaleString("en-US")}</p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <SyncPanel
        withoutTranscript={withoutTranscript}
        unenrichedEpisodes={unenrichedEpisodes}
        enrichmentQueued={enrichmentQueued}
        unenrichedPeople={unenrichedPeople}
      />
    </main>
  );
}
