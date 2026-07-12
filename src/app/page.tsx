import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Cinzel } from "next/font/google";
import { ThresholdHero } from "@/components/home/threshold-hero";
import { OracleCathedral } from "@/components/home/oracle-cathedral";
import { EpisodeCard } from "@/components/archive/episode-card";
import { QuoteHighlightCard } from "@/components/episodes/quote-highlight-card";
import { GuestGrid } from "@/components/episodes/guest-grid";
import { SearchInput } from "@/components/search/search-input";
import { getEpisodes, formatEpisodeForCard } from "@/lib/queries/episodes";
import { getCounts } from "@/lib/queries/stats";
import { getQuotes } from "@/lib/queries/quotes";
import { getTopTopicsByEpisodes } from "@/lib/queries/analytics";
import { getDailyTransmission, getDailyIllustratedChapter } from "@/lib/queries/daily";
import { DailyTransmission } from "@/components/home/daily-transmission";
import { YouTubePlayer } from "@/components/home/youtube-player";
import { TopAscenders } from "@/components/home/top-ascenders";
import { getQuoteReactionCounts } from "@/lib/queries/quote-reactions";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format/date";
import { fixThumbnailUrl } from "@/lib/format/thumbnail";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { SacredGeometryOverlay, FloatingParticles } from "@/components/graphics/sacred-geometry";
import { ArchiveDisclaimer } from "@/components/ui/archive-disclaimer";
import { EmailCapture } from "@/components/marketing/email-capture";
import { GiftSignup } from "@/components/marketing/gift-signup";
import { jsonLdScript, organizationJsonLd } from "@/lib/seo";
import {
  IconTransmission,
  IconPerson,
  IconScroll,
  IconRecurring,
  IconLink,
} from "@/components/graphics/codex-icons";

export const dynamic = "force-dynamic";

// Threshold typography — Bodoni Moda (display italic) + Cinzel (sigil), scoped
// to the hero so the rest of the site keeps its own type system.
const thresholdDisplay = Bodoni_Moda({
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500"],
  variable: "--threshold-font-display",
  display: "swap",
});
const thresholdSigil = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--threshold-font-sigil",
  display: "swap",
});

export const metadata = {
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  title: "CultCodex — The Archive of Cult of Psyche | Tarot, Consciousness & Open Panels",
  description:
    "Cult of Psyche is a live, unscripted internet show — tarot, consciousness, spirituality, open-panel debates, and the strange edges of human behavior. CultCodex is its complete searchable archive: 2,600+ episodes with full transcripts, guest profiles, lore, and an AI Oracle.",
  openGraph: {
    title: "CultCodex — Decode Cult of Psyche",
    description:
      "Every Cult of Psyche transmission indexed. Psychological patterns, behavioral archetypes, guest profiles, and searchable transcripts — live since October 2024.",
    type: "website" as const,
    url: "/",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "CultCodex — Decode Cult of Psyche",
    description:
      "AI breakdowns, guest profiles, behavioral maps, and full transcript coverage for every Cult of Psyche live stream.",
  },
};

export default async function HomePage() {
  const [stats, recentEpisodes, recentQuotes, liveStatus, popularTopics, dailyTransmission, currentUser, latestDigest, dailyChapter, bookEdition] = await Promise.all([
    getCounts().catch(() => ({
      episodes: 0, segments: 0, people: 0, topics: 0,
      lore: 0, quotes: 0, totalHours: 0,
      transcribedEpisodes: 0, transcribedPct: 0,
    })),
    getEpisodes({ take: 5, orderBy: "airDate", order: "desc" }).catch(() => []),
    getQuotes({ take: 2 }).catch(() => []),
    prisma.liveStatus.findUnique({ where: { id: "singleton" } }).catch(() => null),
    getTopTopicsByEpisodes(10).catch(() => []),
    getDailyTransmission().catch(() => ({
      date: new Date().toISOString().slice(0, 10),
      quote: null,
      spotlightEpisode: null,
      pulse: { newEpisodes: 0, newLoreEntries: 0, newQuotes: 0, activeThreads: 0 },
    })),
    getCurrentUser().catch(() => null),
    prisma.weeklyDigest.findFirst({ where: { published: true }, orderBy: { weekOf: "desc" }, select: { title: true, blurb: true, weekOf: true } }).catch(() => null),
    getDailyIllustratedChapter().catch(() => null),
    prisma.bookEdition.findUnique({ where: { sku: "psychenomicon-vol-1" }, select: { title: true, pageCount: true, chapterFrom: true, chapterTo: true } }).catch(() => null),
  ]);

  // Redirect new users to complete onboarding before they see the main app
  if (currentUser && currentUser.onboardingCompleted === false) {
    redirect("/onboarding");
  }

  const dailyQuoteReactions = dailyTransmission.quote
    ? await getQuoteReactionCounts(dailyTransmission.quote.id, currentUser?.id).catch(() => undefined)
    : undefined;

  const recentCards = recentEpisodes.map(formatEpisodeForCard);
  const featured = recentEpisodes[0];
  const isLive = liveStatus?.isLive ?? false;

  // Threshold transmission stamp — TX-YYYYMMDD + a dotted date.
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const txId = `TX-${y}${m}${d}`;
  const dateLabel = `${y}.${m}.${d}`;

  return (
    <>
      {/* ── THE THRESHOLD (Dossier Ch. II §01) ───────────────────────── */}
      <ThresholdHero
        txId={txId}
        dateLabel={dateLabel}
        episodeCount={stats.episodes}
        transcribedPct={stats.transcribedPct}
        fontClass={`${thresholdDisplay.variable} ${thresholdSigil.variable}`}
      />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section id="codex-enter" className="relative flex min-h-[540px] sm:min-h-[620px] items-center justify-center overflow-hidden scroll-mt-0">
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
              style={{ textShadow: "0 0 60px rgba(200, 57, 46,0.3)" }}
            >
              The searchable memory of the Cult of Psyche.
              <br />
              <span className="text-accent-gold" style={{ textShadow: "0 0 40px rgba(200, 57, 46,0.6)" }}>
                Every pattern — still decoding.
              </span>
            </h1>
            {/* Plain-English "what is this" — leads with the show, then the archive */}
            <p className="font-mono text-sm text-text-primary/90 max-w-xl mx-auto leading-relaxed">
              <span className="text-white font-bold">Cult of Psyche</span> is a live, unscripted
              internet show — tarot, consciousness, spirituality, open-panel debates, and the
              strange edges of human behavior, broadcast since October 2024.
            </p>
          </div>

          <p className="font-mono text-[12px] text-text-muted max-w-lg mx-auto leading-relaxed">
            <span className="text-accent-gold font-bold">CultCodex</span> is the complete searchable
            archive: <span className="text-accent-cyan">{stats.episodes.toLocaleString()}+ episodes</span>{" "}
            indexed — full transcripts, guest profiles, lore, and an AI Oracle that answers questions
            from inside it all.
          </p>

          <div className="flex flex-col items-center gap-2">
            <Link
              href="/start-here"
              className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-10 py-4 font-mono text-sm font-bold text-accent-gold transition-all hover:bg-accent-gold/25 hover:shadow-xl hover:shadow-accent-gold/20"
            >
              Enter the Codex →
            </Link>
            <Link
              href="/oracle"
              className="font-mono text-[11px] text-text-muted/50 hover:text-accent-gold/70 transition-colors underline underline-offset-4"
            >
              Ask the Oracle — 3 free →
            </Link>
          </div>

          <GiftSignup source="gift:gospel" />

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
              {
                href: "/episodes",
                icon: <IconTransmission size={22} className="text-accent-gold" />,
                label: "Episodes",
                count: `${stats.episodes.toLocaleString()} transmissions`,
                accent: "hover:border-accent-gold/40 hover:bg-accent-gold/5",
              },
              {
                href: "/people",
                icon: <IconPerson size={22} className="text-accent-cyan" />,
                label: "People",
                count: `${stats.people.toLocaleString()} profiled`,
                accent: "hover:border-accent-cyan/40 hover:bg-accent-cyan/5",
              },
              {
                href: "/symbols",
                icon: <IconScroll size={22} className="text-accent-gold" />,
                label: "Symbol Codex",
                count: "esoteric encyclopedia",
                accent: "hover:border-accent-gold/40 hover:bg-accent-gold/5",
              },
              {
                href: "/archetype-quiz",
                icon: <IconRecurring size={22} className="text-accent-violet" />,
                label: "Archetype Quiz",
                count: "find your pattern",
                accent: "hover:border-accent-violet/40 hover:bg-accent-violet/5",
              },
              {
                href: "/graph",
                icon: <IconLink size={22} className="text-accent-violet" />,
                label: "Network Map",
                count: "relationship graph",
                accent: "hover:border-accent-violet/40 hover:bg-accent-violet/5",
              },
              {
                href: "/explore",
                icon: <IconScroll size={22} className="text-accent-cyan" />,
                label: "Explore",
                count: "tarot · occult · AI · more",
                accent: "hover:border-accent-cyan/40 hover:bg-accent-cyan/5",
              },
              {
                href: "/reports",
                icon: <IconTransmission size={22} className="text-accent-gold" />,
                label: "Codex Reports",
                count: "guest intelligence",
                accent: "hover:border-accent-gold/40 hover:bg-accent-gold/5",
              },
            ]).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-4 transition-all ${item.accent}`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold text-text-primary truncate">{item.label}</p>
                  <p className="font-mono text-[10px] text-text-muted truncate">{item.count}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* ── MUSIC PLAYER ─────────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60">{"/// the_signal"}</p>
            <YouTubePlayer
              videoId="xlpOB2eXM1o"
              playlistId="PLvfZtruvrMTufahIz2Mx9GI_4SJP-ySMw"
              title="Cult of Psyche — Signal Stream"
            />
          </div>

          {/* ── DAILY TRANSMISSION ───────────────────────────────────── */}
          <DailyTransmission
            data={dailyTransmission}
            quoteReactions={dailyQuoteReactions}
            isAuthenticated={Boolean(currentUser)}
          />

          {/* ── ILLUSTRATED CHAPTER OF THE DAY ───────────────────────── */}
          {dailyChapter && (
            <Link
              href={`/psychenomicon/chapters/${dailyChapter.slug}`}
              className="group block overflow-hidden rounded-xl border border-accent-violet/25 bg-gradient-to-b from-accent-violet/5 to-surface transition-colors hover:border-accent-violet/50"
            >
              <div className="flex items-stretch">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dailyChapter.coverUrl}
                  alt=""
                  loading="lazy"
                  className="h-32 w-24 flex-shrink-0 object-cover sm:h-40 sm:w-28"
                />
                <div className="flex flex-col justify-center gap-1.5 px-5 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-violet/60">{"/// chapter_of_the_day"}</p>
                  <h3 className="font-display text-lg font-bold leading-snug text-text-primary transition-colors group-hover:text-accent-violet">
                    {dailyChapter.title}
                  </h3>
                  <p className="font-mono text-[11px] text-text-muted">
                    Psychenomicon · Chapter {dailyChapter.chapterNumber} — an illustrated transmission. Read it →
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* ── THE BOOK — PSYCHENOMICON VOLUME I ─────────────────────── */}
          {bookEdition && (
            <Link
              href="/psychenomicon/book"
              className="group block overflow-hidden rounded-xl border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-surface transition-colors hover:border-accent-gold/60"
            >
              <div className="flex items-stretch">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/psychenomicon-art/chapter-${String(bookEdition.chapterFrom).padStart(3, "0")}/cover`}
                  alt=""
                  loading="lazy"
                  className="h-32 w-24 flex-shrink-0 object-cover sm:h-40 sm:w-28"
                />
                <div className="flex flex-col justify-center gap-1.5 px-5 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/70">{"/// the_book · $19"}</p>
                  <h3 className="font-display text-lg font-bold leading-snug text-text-primary transition-colors group-hover:text-accent-gold">
                    The Psychenomicon — Volume I
                  </h3>
                  <p className="font-mono text-[11px] text-text-muted">
                    {bookEdition.chapterTo - bookEdition.chapterFrom + 1} illustrated chapters · {bookEdition.pageCount}-page PDF, yours to keep. Get it →
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* ── ORACLE — AI SEARCH ───────────────────────────────────── */}
          <div className="rounded-xl border border-accent-violet/25 bg-gradient-to-b from-accent-violet/5 to-surface px-6 py-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-violet/60">{"/// ai_oracle"}</p>
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
            <OracleCathedral />
            <p className="font-mono text-[9px] text-text-muted/60 uppercase tracking-widest">
              The live Oracle above · cites exact episodes &amp; timestamps · Initiate+ $10/mo
            </p>
          </div>

          {/* ── TOP ASCENDERS ────────────────────────────────────────── */}
          <TopAscenders />

          {/* ── SUBSCRIBE CTA ────────────────────────────────────────── */}
          <div className="rounded-xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface px-6 py-8 text-center space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/60">{"/// unlock_the_archive"}</p>
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
                {"/// latest_transmission"} <span className="opacity-50 ml-1">→</span>
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
                  {/* summaryShort intentionally omitted — AI summaries read as filler in this context */}
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
                {"/// recent_transmissions"} <span className="opacity-50 ml-1">→</span>
              </Link>
              <div className="grid gap-3">
                {recentCards.slice(1).map((ep) => (
                  <EpisodeCard key={ep.id} episode={ep} hideDescription />
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
                {"/// active_signals"} <span className="opacity-50 ml-1">→</span>
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
                {"/// notable_moments"} <span className="opacity-50 ml-1">→</span>
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

          {/* ── NEW VISITOR PATHWAY ──────────────────────────────────── */}
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted/50">{"/// new here?"}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {([
                { href: "/start-here",     label: "Start Here",       desc: "Guided entry points chosen by people who've gone deep", accent: "text-accent-gold border-accent-gold/30 hover:bg-accent-gold/5" },
                { href: "/archetype-quiz", label: "Find Your Archetype", desc: "10 questions reveal which mythic pattern you embody", accent: "text-accent-violet border-accent-violet/30 hover:bg-accent-violet/5" },
                { href: "/symbols",        label: "Symbol Codex",     desc: "History and occult meaning of 20+ esoteric symbols", accent: "text-accent-gold border-accent-gold/30 hover:bg-accent-gold/5" },
              ] as const).map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className={`rounded-lg border px-4 py-3 space-y-1 transition-colors ${p.accent}`}
                >
                  <p className={`font-mono text-[11px] font-bold ${p.accent.split(" ")[0]}`}>{p.label} →</p>
                  <p className="font-mono text-[10px] text-text-muted/70 leading-relaxed">{p.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* ── EMAIL CAPTURE ────────────────────────────────────────── */}
          <EmailCapture source="homepage" />


          <ArchiveDisclaimer variant="full" />
        </div>
      </main>

      {/* WebSite + SearchAction JSON-LD is emitted once in the root layout —
          avoid a second, conflicting WebSite block here. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd()) }}
      />
    </>
  );
}
