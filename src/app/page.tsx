import Image from "next/image";
import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { EpisodeCard } from "@/components/archive/episode-card";
import { ArchiveStatsBar } from "@/components/archive/archive-stats-bar";
import { QuoteHighlightCard } from "@/components/episodes/quote-highlight-card";
import { GuestGrid } from "@/components/episodes/guest-grid";
import { SearchInput } from "@/components/search/search-input";
import { getEpisodes, formatEpisodeForCard } from "@/lib/queries/episodes";
import { getArchiveStats } from "@/lib/queries/stats";
import { getQuotes } from "@/lib/queries/quotes";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format/date";

export default async function HomePage() {
  const [stats, recentEpisodes, recentQuotes, liveStatus] = await Promise.all([
    getArchiveStats(),
    getEpisodes({ take: 6, orderBy: "episodeNumber", order: "desc" }),
    getQuotes({ take: 3 }),
    prisma.liveStatus.findUnique({ where: { id: "singleton" } }),
  ]);

  const recentCards = recentEpisodes.map(formatEpisodeForCard);
  const featured = recentEpisodes[0];
  const isLive = liveStatus?.isLive ?? false;

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[320px] sm:min-h-[420px] items-center justify-center overflow-hidden">
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-void" />

        {/* Live banner */}
        {isLive && (
          <Link
            href="/live"
            className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-red-600/90 px-4 py-1.5 font-mono text-xs font-bold text-white shadow-lg animate-pulse"
          >
            <span className="h-2 w-2 rounded-full bg-white" />
            LIVE NOW
          </Link>
        )}

        <div className="relative z-10 flex flex-col items-center gap-4 px-4 text-center">
          <Image
            src="/logo.jpg"
            alt="Cult of Psyche"
            width={120}
            height={120}
            className="rounded-full border-2 border-accent-gold shadow-lg shadow-accent-gold/20 w-20 h-20 sm:w-[120px] sm:h-[120px]"
          />
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-accent-gold drop-shadow-lg md:text-5xl">
            Cult of Psyche
          </h1>
          <p className="max-w-lg font-mono text-sm text-accent-cyan">
            The Living Archive of the Cult of Psyche
          </p>

          {/* Search bar */}
          <div className="mt-2 w-full max-w-md">
            <SearchInput />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-10">
        {/* Archive stats */}
        <ArchiveStatsBar
          stats={[
            { icon: "\uD83C\uDFAC", label: "Episodes", value: stats.episodes },
            { icon: "\uD83D\uDC64", label: "People", value: stats.people },
            { icon: "\uD83D\uDCDC", label: "Lore Entries", value: stats.loreEntries },
            { icon: "\uD83D\uDCAC", label: "Quotes", value: stats.quotes },
            { icon: "\uD83C\uDFF7\uFE0F", label: "Topics", value: stats.topics },
            { icon: "\uD83D\uDCDA", label: "Series", value: stats.series },
          ]}
        />

        {/* Featured episode */}
        {featured && (
          <SectionCard title="Featured Episode">
            <Link
              href={`/episodes/${featured.slug}`}
              className="group flex flex-col sm:flex-row items-start gap-4"
            >
              {featured.thumbnailUrl ? (
                <img
                  src={featured.thumbnailUrl}
                  alt=""
                  className="w-full sm:w-48 h-32 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-full sm:w-48 h-32 rounded-lg bg-gradient-to-br from-accent-green/10 to-accent-purple/10 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {featured.episodeNumber && (
                    <span className="font-mono text-[10px] text-accent-green font-bold">
                      EP.{String(featured.episodeNumber).padStart(3, "0")}
                    </span>
                  )}
                  {featured.airDate && (
                    <span className="font-mono text-[10px] text-text-muted">
                      {formatDate(featured.airDate)}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-medium text-text-primary group-hover:text-accent-green transition-colors">
                  {featured.title}
                </h3>
                {featured.summaryShort && (
                  <p className="mt-2 text-sm text-text-muted line-clamp-3">
                    {featured.summaryShort}
                  </p>
                )}
                <GuestGrid
                  guests={featured.guests.map((g) => ({
                    displayName: g.person.displayName,
                    slug: g.person.slug,
                    avatarUrl: g.person.avatarUrl,
                  }))}
                />
              </div>
            </Link>
          </SectionCard>
        )}

        {/* Recent Transmissions */}
        <SectionCard title="Recent Transmissions">
          {recentCards.length > 0 ? (
            <div className="grid gap-3">
              {recentCards.slice(1).map((ep) => (
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

        {/* Recent Quotes */}
        {recentQuotes.length > 0 && (
          <SectionCard title="Notable Quotes">
            <div className="space-y-4">
              {recentQuotes.map((q) => (
                <QuoteHighlightCard
                  key={q.id}
                  id={q.id}
                  text={q.text}
                  speakerName={q.speaker?.displayName}
                  speakerAvatarUrl={q.speaker?.avatarUrl}
                  timestampSeconds={q.timestampSeconds}
                />
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/quotes"
                className="font-mono text-xs text-accent-green hover:underline"
              >
                Explore all quotes →
              </Link>
            </div>
          </SectionCard>
        )}

        {/* Quick Links */}
        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-accent-gold">
            Explore the Archive
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/episodes", icon: "\uD83C\uDFAC", label: "Episodes", count: stats.episodes, desc: "Browse all transmissions" },
              { href: "/people", icon: "\uD83D\uDC64", label: "People", count: stats.people, desc: "Guests, hosts, and figures" },
              { href: "/lore", icon: "\uD83D\uDCDC", label: "Lore", count: stats.loreEntries, desc: "Concepts, doctrines, and myths" },
              { href: "/topics", icon: "\uD83C\uDFF7\uFE0F", label: "Topics", count: stats.topics, desc: "Key themes and subjects" },
              { href: "/series", icon: "\uD83D\uDCDA", label: "Series", count: stats.series, desc: "Collections and arcs" },
              { href: "/quotes", icon: "\uD83D\uDCAC", label: "Quotes", count: stats.quotes, desc: "Notable words and wisdom" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-green/30 hover:bg-elevated"
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors">
                      {item.label}
                    </h3>
                    <span className="font-mono text-[10px] text-accent-green">
                      {item.count}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Cult Codex",
            url: "https://cultcodex.me",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://cultcodex.me/search?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
    </>
  );
}
