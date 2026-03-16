import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { SectionCard } from "@/components/ui/section-card";
import { EpisodeCard } from "@/components/archive/episode-card";
import { ArchiveStatsDisplay } from "@/components/archive/archive-stats";
import { getEpisodes, formatEpisodeForCard } from "@/lib/queries/episodes";
import { getArchiveStats } from "@/lib/queries/stats";

export default async function HomePage() {
  const [stats, recentEpisodes] = await Promise.all([
    getArchiveStats(),
    getEpisodes({ take: 5, orderBy: "episodeNumber", order: "desc" }),
  ]);

  const recentCards = recentEpisodes.map(formatEpisodeForCard);

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[420px] items-center justify-center overflow-hidden">
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#1a0033]" />
        <div className="relative z-10 flex flex-col items-center gap-4 px-4 text-center">
          <Image
            src="/logo.jpg"
            alt="Cult of Psyche"
            width={120}
            height={120}
            className="rounded-full border-2 border-[#ffd700] shadow-lg shadow-[#ffd700]/20"
          />
          <h1 className="font-serif text-4xl font-bold tracking-tight text-[#ffd700] drop-shadow-lg md:text-5xl">
            Cult of Psyche
          </h1>
          <p className="max-w-lg font-mono text-sm text-[#00d9ff]">
            The sacred intelligence terminal &mdash; 1,000+ episodes archived
          </p>
          <div className="mt-2 flex gap-3">
            <Link
              href="/episodes"
              className="rounded border border-[#ffd700] px-4 py-2 font-mono text-xs text-[#ffd700] transition hover:bg-[#ffd700]/10"
            >
              Browse Episodes
            </Link>
            <Link
              href="/search"
              className="rounded border border-[#00d9ff] px-4 py-2 font-mono text-xs text-[#00d9ff] transition hover:bg-[#00d9ff]/10"
            >
              Search Archive
            </Link>
          </div>
        </div>
      </section>

      <PageShell
        title="MATRIX ARCHIVE"
        subtitle="The sacred intelligence terminal of the Cult of Psyche"
      >
        <div className="space-y-8">
          {/* Archive status */}
          <TerminalPanel header="SYS::STATUS">
            <p className="text-accent-green">Archive online. All data feeds nominal.</p>
          </TerminalPanel>

          {/* Stats */}
          <ArchiveStatsDisplay stats={stats} />

          {/* Recent episodes */}
          <SectionCard title="Recent Transmissions">
            {recentCards.length > 0 ? (
              <div className="grid gap-3">
                {recentCards.map((ep) => (
                  <EpisodeCard key={ep.id} episode={ep} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No transmissions yet.</p>
            )}
            <div className="mt-4">
              <Link
                href="/episodes"
                className="font-mono text-xs text-accent-green hover:underline"
              >
                View all episodes →
              </Link>
            </div>
          </SectionCard>
        </div>
      </PageShell>
    </>
  );
}
