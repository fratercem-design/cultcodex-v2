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

  const [totalEpisodes, withTranscript, withoutTranscript, withYoutubeId] = await Promise.all([
    prisma.episode.count({ where: { status: "published" } }),
    prisma.episode.count({
      where: {
        status: "published",
        youtubeVideoId: { not: null },
        segments: { some: {} },
      },
    }),
    prisma.episode.count({
      where: {
        status: "published",
        youtubeVideoId: { not: null },
        segments: { none: {} },
      },
    }),
    prisma.episode.count({ where: { youtubeVideoId: { not: null } } }),
  ]);

  return (
    <main id="main-content" className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-accent-gold">Sync & Ingest</h1>
        <p className="font-mono text-xs text-text-muted mt-1">
          Import all YouTube episodes and fetch transcripts for the Codex.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total episodes", value: totalEpisodes, color: "text-text-primary" },
          { label: "With YouTube ID", value: withYoutubeId, color: "text-accent-cyan" },
          { label: "Have transcript", value: withTranscript, color: "text-accent-violet" },
          { label: "Need transcript", value: withoutTranscript, color: "text-accent-gold" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-surface p-4 text-center">
            <p className={`font-display text-3xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <SyncPanel withoutTranscript={withoutTranscript} />
    </main>
  );
}
