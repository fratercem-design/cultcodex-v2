import Image from "next/image";
import Link from "next/link";
import { EpisodeCard } from "@/components/archive/episode-card";
import { QuoteHighlightCard } from "@/components/episodes/quote-highlight-card";
import { GuestGrid } from "@/components/episodes/guest-grid";
import { SearchInput } from "@/components/search/search-input";
import { getEpisodes, formatEpisodeForCard } from "@/lib/queries/episodes";
import { getArchiveStats } from "@/lib/queries/stats";
import { getQuotes } from "@/lib/queries/quotes";
import { getTopTopicsByEpisodes } from "@/lib/queries/analytics";
import { getDailyTransmission } from "@/lib/queries/daily";
import { DailyTransmission } from "@/components/home/daily-transmission";
import { YouTubePlayer } from "@/components/home/youtube-player";
import { getQuoteReactionCounts } from "@/lib/queries/quote-reactions";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format/date";
import { fixThumbnailUrl } from "@/lib/format/thumbnail";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { SacredGeometryOverlay, FloatingParticles } from "@/components/graphics/sacred-geometry";
import { ArchiveDisclaimer } from "@/components/ui/archive-disclaimer";
import { EmailCapture } from "@/components/marketing/email-capture";
import { jsonLdScript } from "@/lib/seo";

export const revalidate = 300;

export const metadata = {
  title: "CultCodex — Decode Cult of Psyche | 2,600+ Episodes Archived",
  description:
    "The definitive archive of Cult of Psyche. 2,600+ transmissions with AI psychological breakdowns, guest profiles, topic signals, behavioral pattern maps, and growing transcript coverage.",
  openGraph: {
    title: "CultCodex — Decode Cult of Psyche",
    description:
      "2,600+ conversations indexed. Manipulation tactics, psychological patterns, and behavioral archetypes from every Cult of Psyche episode — all searchable.",
    type: "website" as const,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "CultCodex — Decode Cult of Psyche",
    description:
      "AI breakdowns, guest profiles, behavioral maps, and growing transcript coverage for every Cult of Psyche episode.",
  },
};

export default async function HomePage() {
  const [stats, recentEpisodes, recentQuotes, liveStatus, popularTopics, dailyTransmission, currentUser, latestDigest] = await Promise.all([
    getArchiveStats().catch(() => ({
      episodes: 0, people: 0, loreEntries: 0, quotes: 0,
      series: 0, topics: 0, segments: 0, totalHours: 0,
      comments: 0, reactions: 0,
    })),
    getEpisodes({ take: 5, orderBy: "airDate", order: "desc" }),
    getQuotes({ take: 2 }),
    prisma.liveStatus.findUnique({ where: { id: "singleton" } }),
    getTopTopicsByEpisodes(10),
    getDailyTransmission().catch(() => ({
      date: new Date().toISOString().slice(0, 10),
      quote: null,
      spotlightEpisode: null,
      pulse: { newEpisodes: 0, newLoreEntries: 0, newQuotes: 0, activeThreads: 0 },
    })),
    getCurrentUser(),
    prisma.weeklyDigest.findFirst({ where: { published: true }, orderBy: { weekOf: "desc" }, select: { title: true, blurb: true, weekOf: true } }).catch(() => null),
  ]);

  const dailyQuoteReactions = dailyTransmission.quote
    ? await getQuoteReactionCounts(dailyTransmission.quote.id, currentUser?.id).catch(() => undefined)
    : undefined;

  const recentCards = recentEpisodes.map(formatEpisodeForCard);
  const featured = recentEpisodes[0];
  const isLive = liveStatus?.isLive ?? false;

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[540px] sm:min-h-[620px] items-center justify-center overflow-hidden">
        <Image src="/hero-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-void" />
        <SacredGeometryOverlay />
        <FloatingParticles count={20} />

        {isLive && (
          <Link
            href="/live"
            className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-red-600/90 px-4 py-1.5 font-mono text-xs font-bold text-white shadow-lg animate-pulse"
          >
            <span className="h-2 w-2 rounded-full bg-white" />
            LIVE NOW
          </Link>
        )}

        <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center max-w-3xl mx-auto">
          <Image
            src="/logo.jpg"
            alt="Cult of Psyche"
            width={80}
            height={80}
            className="rounded-full border-2 border-accent-gold/60 shadow-xl shadow-accent-gold/20 opacity-90"
          />
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-accent-cyan/80">
                ✦ &nbsp; CultCodex &nbsp; ✦
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60">
                The Cult of Psyche intelligence archive
              </p>
            </div>
            <h1
              className="font-display text-3xl sm:text-5xl font-bold leading-tight text-white"
              style={{ textShadow: "0 0 60px rgba(212,175,55,0.3)" }}
            >
              2,600+ transmissions.
              <br />
              <span className="text-accent-gold" style={{ textShadow: "0 0 40px rgba(212,175,55,0.6)" }}>
                Every pattern — still decoding.
              </span>
            </h1>
            <p className="font-mono text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
              {stats.episodes.toLocaleString()}+ Cult of Psyche conversations. Full transcripts,
              AI psychological breakdowns, and behavioral maps — all searchable.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/start-here"
              className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-8 py-3.5 font-mono text-sm font-bold text-accent-gold transition-all hover:bg-accent-gold/25 hover:shadow-xl hover:shadow-accent-gold/20"
            >
              Enter the Codex →
            </Link>
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-6 py-3.5 font-mono text-sm text-text-muted transition-all hover:border-accent-gold/30 hover:text-accent-gold"
            >
              Unlock full access
            </Link>
          </div>

          <div className="w-full max-w-md">
            <SearchInput />
          </div>
        </div>
      </section>

      <main id="main-content" className="space-y-0">

        {/* ── STATS STRIP ──────────────────────────────────────────────── */}
        <div className="border-b border-border/40 bg-void/80 backdrop-blur-sm py-3 px-4">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-x-8 gap-y-1">
            {[
              { value: stats.episodes.toLocaleString(), label: "transmissions archived" },
              { value: stats.segments.toLocaleString(), label: "transcript segments" },
              { value: stats.people.toLocaleString(), label: "voices profiled" },
              { value: `${stats.totalHours.toLocaleString()}+`, label: "hours decoded" },
            ].map((s) => (
              <span key={s.label} className="font-mono text-[11px] text-text-muted whitespace-nowrap">
                <span className="text-accent-gold font-bold">{s.value}</span>{" "}{s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 space-y-12">

          {/* ── SECTION NAV ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {([
              { href: "/episodes", icon: "📺", label: "Episodes",    count: stats.episodes.toLocaleString(),    accent: "hover:border-accent-gold/40 hover:bg-accent-gold/5 group-hover:text-accent-gold" },
              { href: "/people",   icon: "👁",  label: "People",      count: stats.people.toLocaleString(),      accent: "hover:border-accent-cyan/40 hover:bg-accent-cyan/5 group-hover:text-accent-cyan" },
              { href: "/graph",    icon: "🕸️", label: "Network Map", count: "relationship graph",               accent: "hover:border-accent-violet/40 hover:bg-accent-violet/5 group-hover:text-accent-violet" },
              { href: "/topics",   icon: "◈",  label: "Signals",     count: stats.topics.toLocaleString(),      accent: "hover:border-accent-violet/40 hover:bg-accent-violet/5 group-hover:text-accent-violet" },
              { href: "/lore",     icon: "📜",  label: "Lore",        count: stats.loreEntries.toLocaleString(), accent: "hover:border-accent-violet/40 hover:bg-accent-violet/5 group-hover:text-accent-violet" },
            ] as const).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-4 transition-all ${item.accent}`}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold text-text-primary truncate">{item.label}</p>
                  <p className="font-mono text-[10px] text-text-muted truncate">{item.count}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* ── DAILY TRANSMISSION ───────────────────────────────────── */}
          <DailyTransmission
            data={dailyTransmission}
            quoteReactions={dailyQuoteReactions}
            isAuthenticated={Boolean(currentUser)}
          />

          {/* ── MUSIC PLAYER ─────────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60">/// the_signal</p>
            <YouTubePlayer
              videoId="xlpOB2eXM1o"
              playlistId="PLvfZtruvrMTufahIz2Mx9GI_4SJP-ySMw"
              title="Cult of Psyche — Signal Stream"
            />
          </div>

          {/* ── ORACLE — AI SEARCH ───────────────────────────────────── */}
          <div className="rounded-xl border border-accent-violet/25 bg-gradient-to-b from-accent-violet/5 to-surface px-6 py-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-violet/60">/// ai_oracle</p>
                <h2 className="font-display text-lg font-bold text-white">Ask the archive anything.</h2>
                <p className="font-mono text-[11px] text-text-muted leading-relaxed max-w-lg">
                  AI trained on every transcript, lore entry, and behavioral profile. Ask a question —
                  get an answer grounded in actual archive content, with citations.
                </p>
              </div>
              <Link
                href="/oracle"
                className="shrink-0 self-start inline-flex items-center gap-1.5 rounded-lg border border-accent-violet bg-accent-violet/15 px-4 py-2.5 font-mono text-xs font-bold text-accent-violet transition-all hover:bg-accent-violet/25 whitespace-nowrap"
              >
                Ask the Oracle →
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "What are Beetle's recurring patterns?",
                "Who challenged the host and won?",
                "What does the archive say about manipulation?",
                "How has Tracy-X evolved over time?",
              ].map((q) => (
                <Link
                  key={q}
                  href="/oracle"
                  className="rounded-full border border-accent-violet/20 bg-surface px-3 py-1.5 font-mono text-[10px] text-text-muted hover:border-accent-violet/50 hover:text-accent-violet transition-colors"
                >
                  {q}
                </Link>
              ))}
            </div>
            <p className="font-mono text-[9px] text-text-muted/40 uppercase tracking-widest">
              Initiate+ · $10/mo · Answers cite actual episodes, transcripts, and lore
            </p>
          </div>

          {/* ── SUBSCRIBE CTA ────────────────────────────────────────── */}
          <div className="rounded-xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface px-6 py-8 text-center space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/60">/// unlock_the_archive</p>
            <p className="font-display text-xl font-bold text-white">Full transcripts. AI Oracle. The Psychenomicon.</p>
            <p className="font-mono text-xs text-text-muted max-w-md mx-auto">Initiate+ opens the AI Oracle, every transcript, Decode Mode, and your member identity — $10/mo. No contracts.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/premium"
                className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-7 py-3 font-mono text-sm font-bold text-accent-gold transition-all hover:bg-accent-gold/25 hover:shadow-lg hover:shadow-accent-gold/20"
              >
                Become Initiate+ — $10/mo →
              </Link>
              <Link
                href="/premium"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-mono text-xs text-text-muted transition-all hover:border-accent-gold/30 hover:text-text-primary"
              >
                Compare tiers
              </Link>
            </div>
          </div>

          {/* ── FEATURED EPISODE ─────────────────────────────────────── */}
          {featured && (
            <div className="space-y-3">
              <Link
                href="/episodes"
                className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60 hover:text-accent-gold transition-colors"
              >
                /// latest_transmission <span className="opacity-50 ml-1">→</span>
              </Link>
              <Link
                href={`/episodes/${featured.slug}`}
                className="group flex flex-col sm:flex-row items-start gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-accent-gold/30 hover:bg-elevated"
              >
                {featured.thumbnailUrl ? (
                  <div className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={fixThumbnailUrl(featured.thumbnailUrl)!}
                      alt={featured.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 192px"
                      className="object-cover"
                    />
                  </div>
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
                      <span className="font-mono text-[10px] text-text-muted">{formatDate(featured.airDate)}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-text-primary group-hover:text-accent-gold transition-colors">
                    {featured.title}
                  </h3>
                  {featured.summaryShort && (
                    <p className="mt-2 text-sm text-text-muted line-clamp-2">{featured.summaryShort}</p>
                  )}
                  <GuestGrid
                    bare
                    guests={featured.guests
                      .filter((g) => g.person.personType !== "host")
                      .map((g) => ({
                        displayName: g.person.displayName,
                        slug: g.person.slug,
                        avatarUrl: g.person.avatarUrl,
                        personType: g.person.personType,
                      }))}
                  />
                </div>
              </Link>
            </div>
          )}

          {/* ── RECENT TRANSMISSIONS ─────────────────────────────────── */}
          {recentCards.length > 1 && (
            <div className="space-y-3">
              <Link
                href="/episodes"
                className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60 hover:text-accent-gold transition-colors"
              >
                /// recent_transmissions <span className="opacity-50 ml-1">→</span>
              </Link>
              <div className="grid gap-3">
                {recentCards.slice(1).map((ep) => (
                  <EpisodeCard key={ep.id} episode={ep} />
                ))}
              </div>
              <Link href="/episodes" className="font-mono text-xs text-accent-gold hover:underline">
                View all {stats.episodes.toLocaleString()} episodes →
              </Link>
            </div>
          )}

          <MysticalDivider />

          {/* ── ACTIVE SIGNALS ───────────────────────────────────────── */}
          {popularTopics.length > 0 && (
            <div className="space-y-3">
              <Link
                href="/topics"
                className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan/60 hover:text-accent-cyan transition-colors"
              >
                /// active_signals <span className="opacity-50 ml-1">→</span>
              </Link>
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
              <Link href="/topics" className="font-mono text-xs text-accent-cyan hover:underline">
                Explore all signals →
              </Link>
            </div>
          )}

          {/* ── NOTABLE MOMENTS ──────────────────────────────────────── */}
          {recentQuotes.length > 0 && (
            <div className="space-y-3">
              <Link
                href="/quotes"
                className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-red-400/60 hover:text-red-400 transition-colors"
              >
                /// notable_moments <span className="opacity-50 ml-1">→</span>
              </Link>
              <div className="space-y-4">
                {recentQuotes.map((q) => (
                  <QuoteHighlightCard
                    key={q.id}
                    id={q.id}
                    text={q.text}
                    speakerName={q.speaker?.displayName}
                    speakerAvatarUrl={q.speaker?.avatarUrl}
                    speakerSlug={q.speaker?.slug}
                    speakerType={q.speaker?.personType}
                    timestampSeconds={q.timestampSeconds}
                  />
                ))}
              </div>
              <Link href="/quotes" className="font-mono text-xs text-red-400/70 hover:text-red-400 hover:underline">
                Explore all quotes →
              </Link>
            </div>
          )}

          {/* ── THIS WEEK ────────────────────────────────────────────── */}
          {latestDigest && (
            <Link
              href="/this-week"
              className="group flex items-start gap-4 rounded-xl border border-accent-gold/20 bg-gradient-to-r from-accent-gold/5 to-surface p-5 transition-all hover:border-accent-gold/40 hover:from-accent-gold/8"
            >
              <div className="shrink-0 mt-0.5">
                <span className="font-mono text-lg text-accent-gold/60">◑</span>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold/50">
                  ✦ &nbsp; This week in the archive &nbsp; ✦
                </p>
                <p className="font-display text-sm font-bold text-text-primary group-hover:text-accent-gold transition-colors">
                  {latestDigest.title}
                </p>
                {latestDigest.blurb && (
                  <p className="font-mono text-[11px] text-text-muted leading-relaxed line-clamp-2">
                    {latestDigest.blurb}
                  </p>
                )}
              </div>
              <span className="font-mono text-[10px] text-accent-gold/40 group-hover:text-accent-gold transition-colors shrink-0 self-center">
                →
              </span>
            </Link>
          )}

          {/* ── EMAIL CAPTURE ────────────────────────────────────────── */}
          <EmailCapture source="homepage" />

          <ArchiveDisclaimer variant="full" />
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Cult Codex",
            url: "https://cultcodex.me",
            description: "A pattern intelligence system. 2,600+ conversations. Every soul. Every pattern — decoded.",
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: "https://cultcodex.me/search?q={search_term_string}" },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
    </>
  );
}
