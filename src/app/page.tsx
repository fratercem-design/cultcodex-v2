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
import { getTopTopicsByEpisodes } from "@/lib/queries/analytics";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format/date";
import { IconTransmission, IconPerson, IconScroll, IconQuote, IconTopic, IconSeries, IconCrystalBall } from "@/components/graphics/codex-icons";
import { MysticalDivider, OrnamentalBreak } from "@/components/graphics/mystical-divider";
import { SacredGeometryOverlay, FloatingParticles } from "@/components/graphics/sacred-geometry";
import { ArchiveDisclaimer } from "@/components/ui/archive-disclaimer";
import { ColorLegend } from "@/components/ui/color-legend";

export const revalidate = 300;

export default async function HomePage() {
  const [stats, recentEpisodes, recentQuotes, liveStatus, featuredSeries, popularTopics, quoteCount] = await Promise.all([
    getArchiveStats(),
    getEpisodes({ take: 6, orderBy: "airDate", order: "desc" }),
    getQuotes({ take: 3 }),
    prisma.liveStatus.findUnique({ where: { id: "singleton" } }),
    prisma.series.findMany({
      where: { type: { notIn: ["other"] } },
      select: { title: true, slug: true, type: true, coverImageUrl: true, description: true, _count: { select: { episodes: true } } },
      orderBy: { episodes: { _count: "desc" } },
      take: 4,
    }),
    getTopTopicsByEpisodes(12),
    prisma.quote.count(),
  ]);

  // Random oracle quote for the homepage teaser
  const oracleQuote = quoteCount > 0
    ? await prisma.quote.findFirst({
        skip: Math.floor(Math.random() * quoteCount),
        select: {
          text: true,
          speaker: { select: { displayName: true, slug: true } },
        },
      })
    : null;

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
        <SacredGeometryOverlay />
        <FloatingParticles count={16} />

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

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 space-y-10">
        {/* New visitor prompt */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/start-here"
            className="inline-flex items-center gap-2 rounded-full border border-accent-gold/20 bg-accent-gold/5 px-4 py-1.5 font-mono text-xs text-accent-gold/80 transition-all hover:border-accent-gold/40 hover:bg-accent-gold/10 hover:text-accent-gold"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-gold/60 animate-pulse" />
            New to the Codex? Start here
          </Link>
        </div>

        {/* Archive stats */}
        <ArchiveStatsBar
          stats={[
            { icon: <IconTransmission size={22} />, label: "Episodes", value: stats.episodes },
            { icon: <IconPerson size={22} />, label: "People", value: stats.people },
            { icon: <IconScroll size={22} />, label: "Lore Entries", value: stats.loreEntries },
            { icon: <IconQuote size={22} />, label: "Quotes", value: stats.quotes },
            { icon: <IconTopic size={22} />, label: "Topics", value: stats.topics },
            { icon: <IconSeries size={22} />, label: "Series", value: stats.series },
          ]}
        />

        {/* Color legend */}
        <ColorLegend className="justify-center" />

        {/* Featured episode */}
        {featured && (
          <SectionCard title="Latest Transmission">
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
                <div className="w-full sm:w-48 h-32 rounded-lg bg-gradient-to-br from-accent-gold/10 to-accent-violet/10 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {featured.episodeNumber && (
                    <span className="font-mono text-[10px] text-accent-gold font-bold">
                      EP.{String(featured.episodeNumber).padStart(3, "0")}
                    </span>
                  )}
                  {featured.airDate && (
                    <span className="font-mono text-[10px] text-text-muted">
                      {formatDate(featured.airDate)}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-medium text-text-primary group-hover:text-accent-gold transition-colors">
                  {featured.title}
                </h3>
                {featured.summaryShort && (
                  <p className="mt-2 text-sm text-text-muted line-clamp-3">
                    {featured.summaryShort}
                  </p>
                )}
                <GuestGrid
                  guests={featured.guests
                    .filter((g) => g.person.personType !== "host")
                    .map((g) => ({
                      displayName: g.person.displayName,
                      slug: g.person.slug,
                      avatarUrl: g.person.avatarUrl,
                    }))}
                />
              </div>
            </Link>
          </SectionCard>
        )}

        <MysticalDivider />

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
              className="font-mono text-xs text-accent-gold hover:underline"
            >
              View all episodes →
            </Link>
          </div>
        </SectionCard>

        {/* Featured Series */}
        {featuredSeries.length > 0 && (
          <SectionCard title="Featured Series">
            <div className="grid gap-3 sm:grid-cols-2">
              {featuredSeries.map((s) => (
                <Link
                  key={s.slug}
                  href={`/series/${s.slug}`}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-surface/50 p-3 transition-all hover:border-accent-cyan/30 hover:bg-elevated"
                >
                  {s.coverImageUrl ? (
                    <img src={s.coverImageUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br from-accent-cyan/10 to-accent-violet/10 text-xl">
                      {s.type === "tarot" ? "🔮" : s.type === "panel" ? "🎙️" : s.type === "story" ? "📖" : "📚"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-cyan transition-colors">
                      {s.title}
                    </h3>
                    <p className="font-mono text-[10px] text-text-muted">
                      {s._count.episodes} episode{s._count.episodes !== 1 ? "s" : ""}
                    </p>
                    {s.description && (
                      <p className="mt-0.5 text-xs text-text-muted line-clamp-1">{s.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-3">
              <Link href="/series" className="font-mono text-xs text-accent-cyan hover:underline">
                View all series →
              </Link>
            </div>
          </SectionCard>
        )}

        {/* Popular Topics — cyan (topics color) */}
        {popularTopics.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-lg font-bold text-accent-cyan flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-cyan shrink-0" />
              Popular Topics
            </h2>
            <div className="flex flex-wrap gap-2">
              {popularTopics.map((topic) => (
                <Link
                  key={topic.slug}
                  href={`/topics/${topic.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-mono text-xs text-accent-cyan transition-colors hover:bg-elevated hover:border-accent-cyan/30"
                >
                  {topic.title}
                  <span className="opacity-40 text-[9px]">{topic.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Psychenomicon Teaser */}
        <Link href="/lore/psychenomicon" className="group block">
          <div className="relative rounded-lg border border-accent-gold/20 bg-gradient-to-br from-[#1a0033]/60 via-void to-[#1a0033]/60 p-8 text-center transition-all hover:border-accent-gold/40 hover:shadow-xl hover:shadow-accent-gold/10 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,169,107,0.06),transparent_70%)]" />
            <div className="relative z-10">
              <p className="font-mono text-[9px] text-accent-gold/50 uppercase tracking-[0.3em] mb-4">
                From the Forbidden Chronicle
              </p>
              <p className="font-display text-xl sm:text-2xl font-bold text-accent-gold leading-relaxed max-w-2xl mx-auto">
                &ldquo;In the beginning, there was static.&rdquo;
              </p>
              <p className="mt-3 text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
                Then a voice cut through the noise. Over {stats.episodes.toLocaleString()} transmissions,
                a universe was born. The Psychenomicon is its grimoire.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 font-mono text-xs text-accent-gold/70 group-hover:text-accent-gold transition-colors">
                <span className="h-px w-8 bg-accent-gold/30 group-hover:bg-accent-gold/60 transition-colors" />
                Enter the Psychenomicon
                <span className="h-px w-8 bg-accent-gold/30 group-hover:bg-accent-gold/60 transition-colors" />
              </p>
            </div>
          </div>
        </Link>

        <MysticalDivider />

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
                className="font-mono text-xs text-red-400 hover:underline"
              >
                Explore all quotes →
              </Link>
            </div>
          </SectionCard>
        )}

        <MysticalDivider />

        {/* Oracle Teaser */}
        {oracleQuote && (
          <Link href="/oracle" className="group block">
            <div className="relative rounded-lg border border-accent-violet/20 bg-gradient-to-r from-accent-violet/5 via-transparent to-accent-violet/5 p-6 text-center transition-all hover:border-accent-violet/40 hover:shadow-lg hover:shadow-accent-violet/10 overflow-hidden">
              <div className="absolute top-2 left-4 font-mono text-[9px] text-accent-violet/50 uppercase tracking-widest">
                The Oracle Speaks
              </div>
              <div className="flex justify-center mb-2">
                <IconCrystalBall size={28} className="text-accent-violet/60 group-hover:text-accent-violet transition-colors" />
              </div>
              <p className="font-mono text-sm text-text-muted italic line-clamp-2 max-w-2xl mx-auto">
                &ldquo;{oracleQuote.text.length > 140 ? `${oracleQuote.text.slice(0, 140)}…` : oracleQuote.text}&rdquo;
              </p>
              {oracleQuote.speaker && (
                <p className="mt-1 font-mono text-[10px] text-accent-gold">
                  — {oracleQuote.speaker.displayName}
                </p>
              )}
              <p className="mt-2 font-mono text-[10px] text-accent-violet/60 group-hover:text-accent-violet transition-colors">
                Consult the Oracle →
              </p>
            </div>
          </Link>
        )}

        <OrnamentalBreak />

        {/* Explore the Archive — color-coded by category */}
        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-accent-gold">
            Explore the Archive
          </h2>

          {/* Archive (Gold) */}
          <div className="mb-4">
            <h3 className="mb-2 font-mono text-[10px] text-accent-gold/70 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
              Archive
            </h3>
            <div className="grid gap-2 sm:grid-cols-3">
              {([
                { href: "/episodes", icon: <IconTransmission size={20} />, label: "Episodes", count: stats.episodes, desc: "Browse all transmissions" },
                { href: "/people", icon: <IconPerson size={20} />, label: "People", count: stats.people, desc: "Guests, hosts, and figures" },
                { href: "/quotes", icon: <IconQuote size={20} />, label: "Quotes", count: stats.quotes, desc: "Notable words and wisdom" },
              ] as const).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-all hover:border-accent-gold/30 hover:bg-elevated"
                >
                  <div className="flex-shrink-0 text-accent-gold/60">{item.icon}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-gold transition-colors">{item.label}</span>
                      <span className="font-mono text-[10px] text-accent-gold/60">{item.count}</span>
                    </div>
                    <p className="text-[11px] text-text-muted truncate">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Explore (Cyan) */}
          <div className="mb-4">
            <h3 className="mb-2 font-mono text-[10px] text-accent-cyan/70 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
              Explore
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {([
                { href: "/lore", icon: <IconScroll size={20} />, label: "Lore", count: stats.loreEntries, desc: "Mythology and deep lore" },
                { href: "/series", icon: <IconSeries size={20} />, label: "Series", count: stats.series, desc: "Collections and arcs" },
                { href: "/topics", icon: <IconTopic size={20} />, label: "Topics", count: stats.topics, desc: "Themes and subjects" },
                { href: "/collections", icon: <IconSeries size={20} />, label: "Collections", count: null, desc: "Curated pathways" },
              ] as const).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-all hover:border-accent-cyan/30 hover:bg-elevated"
                >
                  <div className="flex-shrink-0 text-accent-cyan/60">{item.icon}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-cyan transition-colors">{item.label}</span>
                      {item.count != null && <span className="font-mono text-[10px] text-accent-cyan/60">{item.count}</span>}
                    </div>
                    <p className="text-[11px] text-text-muted truncate">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Reference (Violet) */}
          <div>
            <h3 className="mb-2 font-mono text-[10px] text-accent-violet/70 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-violet" />
              Reference
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {([
                { href: "/lexicon", label: "Lexicon", desc: "Panelverse dictionary" },
                { href: "/timeline", label: "Timeline", desc: "Chronological archive" },
                { href: "/stats", label: "Stats", desc: "Archive analytics" },
                { href: "/mythic-map", label: "Mythic Map", desc: "Connections mapped" },
              ] as const).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-all hover:border-accent-violet/30 hover:bg-elevated"
                >
                  <div className="min-w-0">
                    <span className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-violet transition-colors">{item.label}</span>
                    <p className="text-[11px] text-text-muted truncate">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <MysticalDivider />

        <ArchiveDisclaimer variant="full" />
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Cult Codex",
            url: "https://cultcodex.me",
            description: "The Living Archive of the Cult of Psyche",
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
