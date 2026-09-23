import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda } from "next/font/google";
import { ThresholdHero } from "@/components/home/threshold-hero";
import { OracleCathedral } from "@/components/home/oracle-cathedral";
import { EpisodeCard } from "@/components/archive/episode-card";
import { GuestGrid } from "@/components/episodes/guest-grid";
import { SearchInput } from "@/components/search/search-input";
import { getEpisodeCards } from "@/lib/queries/episodes";
import { getCounts, fmtEpisodeCount } from "@/lib/queries/stats";
import { getTopTopicsByEpisodes } from "@/lib/queries/analytics";
import { getDailyTransmission } from "@/lib/queries/daily";
import { DailyTransmission } from "@/components/home/daily-transmission";
import { getQuoteReactionCounts } from "@/lib/queries/quote-reactions";
import { OnboardingGate } from "@/components/auth/onboarding-gate";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format/date";
import { fixThumbnailUrl } from "@/lib/format/thumbnail";
import { ArchiveDisclaimer } from "@/components/ui/archive-disclaimer";
import { GiftSignup } from "@/components/marketing/gift-signup";
import { ArchiveStatsLine, WhyCultCodex } from "@/components/home/value-proposition";
import { organizationJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { getTier, INITIATE_ORACLE_MONTHLY_LIMIT } from "@/lib/subscription-tiers";

const initiateTier = getTier("access");

// ISR, not force-dynamic. The homepage has no per-visitor content left: the
// session is read client-side (<OnboardingGate>, the user menu, the reaction
// bar) and live status refreshes through /api/live/status. Rendering on demand
// made the HTML `private, no-store`, so every visitor and every crawler paid
// full TTFB for a page that is identical for all of them.
//
// 60s matches the root layout and bounds how stale the daily transmission,
// episode counts and recent-episode strip can get.
export const revalidate = 60;

// Threshold typography — Bodoni Moda italic is the ritual display face and is
// used for exactly one moment: "the Codex." (Cinzel was dropped in the
// 2026-09 redesign: a fifth typeface with no job.)
const thresholdDisplay = Bodoni_Moda({
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500"],
  variable: "--threshold-font-display",
  display: "swap",
});

export async function generateMetadata() {
  const counts = await getCounts().catch(() => null);
    return {
    robots: { index: true, follow: true },
    alternates: { canonical: "/" },
    title: "CultCodex — The Archive of Cult of Psyche | Tarot, Consciousness & Open Panels",
    description:
      `Cult of Psyche is a live, unscripted internet show — tarot, consciousness, spirituality, open-panel debates, and the strange edges of human behavior. CultCodex is its complete searchable archive: ${fmtEpisodeCount(counts?.episodes ?? 0)} episodes with full transcripts, guest profiles, lore, and an AI Oracle.`,
    openGraph: {
      title: "CultCodex — Decode Cult of Psyche",
      description:
        "Every Cult of Psyche transmission indexed. Psychological patterns, behavioral archetypes, guest profiles, and searchable transcripts — live since October 2024.",
      type: "website" as const,
      url: "/",
      // Required explicitly. Next replaces the `openGraph` object wholesale
      // rather than deep-merging it, so declaring one here without `images`
      // dropped the root layout's og:image and the page shipped with none -
      // every share of the homepage rendered as a bare text link.
      images: [{ url: "/images/site/og.jpg", width: 1200, height: 630, alt: "CultCodex - the Cult of Psyche archive" }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: "CultCodex — Decode Cult of Psyche",
      description:
        "AI breakdowns, guest profiles, behavioral maps, and full transcript coverage for every Cult of Psyche live stream.",
      // Same replacement rule as openGraph above - `summary_large_image` with
      // no image is the worst of both worlds.
      images: ["/images/site/og.jpg"],
    },
  };
}

export default async function HomePage() {
  const [stats, recentEpisodes, liveStatus, popularTopics, dailyTransmission] = await Promise.all([
    getCounts().catch(() => ({
      episodes: 0, segments: 0, people: 0, topics: 0,
      lore: 0, quotes: 0, totalHours: 0,
      transcribedEpisodes: 0, transcribedPct: 0,
    })),
    // Decoded episodes only. The newest stream is usually still in the
    // transcription queue for a day or so, and a "No Transcript" card in the
    // most prominent slot on the site undercuts the whole archive pitch. It
    // surfaces here as soon as its segments land; until then /episodes has it.
    getEpisodeCards({ take: 4, orderBy: "airDate", order: "desc", hasTranscript: true }).catch(() => []),
    prisma.liveStatus.findUnique({ where: { id: "singleton" } }).catch(() => null),
    // Real, most-discussed topics become the hero's suggested searches.
    getTopTopicsByEpisodes(3).catch(() => []),
    getDailyTransmission().catch(() => ({
      date: new Date().toISOString().slice(0, 10),
      quote: null,
      spotlightEpisode: null,
      pulse: { newEpisodes: 0, newLoreEntries: 0, newQuotes: 0, activeThreads: 0 },
    })),
  ]);

  // Reaction TOTALS are public and identical for every visitor, so they are
  // fetched without a user id. The viewer's own reactions are resolved in the
  // client bar. Passing a user id here would personalise the HTML and make it
  // uncacheable - the same trap that <OnboardingGate> exists to avoid.
  const dailyQuoteReactions = dailyTransmission.quote
    ? await getQuoteReactionCounts(dailyTransmission.quote.id).catch(() => undefined)
    : undefined;

  const featured = recentEpisodes[0];
  const isLive = liveStatus?.isLive ?? false;

  // "As of" stamp for every count on the page (threshold + stats line).
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const dateLabel = `${y}.${m}.${d}`;
  const asOf = now.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  // Homepage structure — Ritual Research Instrument (2026-09 audit, §06).
  // Nine sections, one job each, one brand-filled action (Search). What was
  // cut is still one click away: quick-link tiles (sidebar/footer), the
  // Signal Stream player (/cult-live), leaderboard (/leaderboard), chapter of
  // the day + the $5 book (/psychenomicon), topics (/topics), quotes (/quotes),
  // this week (/this-week), the second newsletter form.
  return (
    <>
      {/* Renders nothing; sends half-onboarded members to /onboarding. */}
      <OnboardingGate />

      {/* ── 1 · THRESHOLD — the one ritual moment ─────────────────────── */}
      <ThresholdHero
        dateLabel={dateLabel}
        episodeCount={stats.episodes}
        transcribedPct={stats.transcribedPct}
        fontClass={thresholdDisplay.variable}
      />

      {/* ── 2 · HERO — say what this is, start a search ───────────────── */}
      <section id="codex-enter" className="relative overflow-hidden scroll-mt-0">
        {/* Art stays behind nothing readable: dimmed to a texture. */}
        <Image src="/images/site/hero.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-[0.12]" />
        <div className="absolute inset-0 bg-gradient-to-b from-void/40 via-void/70 to-void" />

        {isLive && (
          <Link
            href="/live"
            className="absolute top-4 right-4 z-20 inline-flex min-h-11 items-center gap-2 rounded-full border border-evidence px-4 font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-evidence"
          >
            <span className="h-2 w-2 rounded-full bg-evidence" aria-hidden="true" />
            Live now
          </Link>
        )}

        <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 sm:py-24">
          <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3">
            {"///"} CultCodex · the Cult of Psyche archive
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink sm:text-5xl">
            Search every Cult of Psyche episode — every word, every guest, every recurring pattern.
          </h1>
          <p className="mt-5 max-w-[68ch] font-display text-[17px] leading-relaxed text-ink-2">
            <span className="font-semibold text-ink">Cult of Psyche</span> is a live, unscripted
            internet show — tarot, consciousness, spirituality, open-panel debates and the strange
            edges of human behavior, broadcast since October 2024. CultCodex is its archive:
            full transcripts, guest profiles, lore, and an AI Oracle that cites its sources.
          </p>

          <div className="mt-8">
            <SearchInput />
          </div>

          {popularTopics.length > 0 && (
            <p className="mt-4 flex flex-wrap items-center gap-2 font-display text-[15px] text-ink-3">
              <span>Try:</span>
              {popularTopics.map((t) => (
                <Link
                  key={t.slug}
                  href={`/search?q=${encodeURIComponent(t.title)}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-line-strong px-4 text-ink-2 transition-colors hover:border-ink hover:text-ink"
                >
                  {t.title}
                </Link>
              ))}
            </p>
          )}

          <p className="mt-6 font-display text-[15px] text-ink-2">
            New here?{" "}
            <Link href="/start-here" className="font-semibold text-ink underline underline-offset-4 hover:text-brand-ink">
              Start here →
            </Link>
          </p>
        </div>
      </section>

      {/* ── 3 · PROOF — one consistent line of scale ──────────────────── */}
      <ArchiveStatsLine
        asOf={asOf}
        stats={[
          { value: stats.episodes, label: "episodes" },
          { value: stats.people, label: "people" },
          { value: stats.segments, label: "transcript moments" },
          { value: stats.transcribedPct, suffix: "%", label: "transcribed" },
        ]}
      />

      <main id="main-content" className="mx-auto max-w-[1120px] space-y-24 px-4 py-16">

        {/* ── 4 · LATEST — prove the archive is alive ─────────────────── */}
        {featured && (
          <section aria-labelledby="latest-heading" className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="latest-heading" className="font-display text-2xl font-bold text-ink">
                <span className="block font-mono text-[12px] font-normal uppercase tracking-[0.08em] text-ink-3">
                  {"///"} Latest transmissions
                </span>
                Latest episodes
              </h2>
              <Link href="/episodes" className="text-[15px] text-ink underline underline-offset-4 hover:text-brand-ink">
                All {fmtEpisodeCount(stats.episodes)} →
              </Link>
            </div>

            <Link
              href={`/episodes/${featured.slug}`}
              className="group flex flex-col items-start gap-5 border-y border-line py-5 sm:flex-row"
            >
              {featured.thumbnailUrl ? (
                <div className="relative h-36 w-full flex-shrink-0 overflow-hidden border border-line sm:w-60">
                  <Image
                    src={fixThumbnailUrl(featured.thumbnailUrl)!}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 240px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[13px] text-ink-3">
                  {featured.episodeNumber && (
                    <span className="font-bold text-brand-ink">EP.{String(featured.episodeNumber).padStart(3, "0")} · </span>
                  )}
                  {featured.airDate && formatDate(featured.airDate)}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-ink group-hover:underline group-hover:underline-offset-4">
                  {featured.title}
                </h3>
                <GuestGrid
                  bare
                  guests={featured.guests.filter((g) => g.personType !== "host")}
                />
              </div>
            </Link>

            {recentEpisodes.length > 1 && (
              <div className="grid gap-3">
                {recentEpisodes.slice(1).map((ep) => (
                  <EpisodeCard key={ep.id} episode={ep} hideDescription />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── 5 · THREE WAYS IN — guided discovery ────────────────────── */}
        <WhyCultCodex />

        {/* ── 6 · ORACLE — demonstrate a cited answer ─────────────────── */}
        <section aria-labelledby="oracle-heading" className="space-y-5 border-t border-line pt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-oracle">
                {"///"} The Oracle · AI
              </p>
              <h2 id="oracle-heading" className="font-display text-2xl font-bold text-ink">
                Ask the archive anything.
              </h2>
              <p className="font-display text-[15px] leading-relaxed text-ink-2">
                It reads transcripts, lore and profiles in this archive — nothing outside it — and
                cites the episodes and timestamps it used. It can be wrong; the citations are there so
                you can check.
              </p>
            </div>
            <Link
              href="/oracle"
              className="inline-flex min-h-11 shrink-0 items-center self-start rounded-sm border border-oracle px-5 text-[15px] font-semibold text-oracle transition-colors hover:bg-oracle/10 sm:self-auto"
            >
              Open the Oracle →
            </Link>
          </div>
          <OracleCathedral />
        </section>

        {/* ── 7 · TODAY'S SIGNAL — a reason to return ─────────────────── */}
        <DailyTransmission
          data={dailyTransmission}
          quoteReactions={dailyQuoteReactions}
        />

        {/* ── 8 · HOW THIS ARCHIVE IS MADE — trust ────────────────────── */}
        <ArchiveDisclaimer variant="full" />

        {/* ── 9 · MEMBERSHIP + CAPTURE — one offer, one form ──────────── */}
        <section aria-labelledby="membership-heading" className="grid gap-10 border-t border-line pt-10 md:grid-cols-2">
          <div className="space-y-4">
            <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-member">
              {"///"} Go deeper
            </p>
            <h2 id="membership-heading" className="font-display text-2xl font-bold text-ink">
              Initiate+ — ${initiateTier.priceMonthly}/mo
            </h2>
            <ul className="space-y-2 font-display text-[15px] text-ink-2">
              <li>◆ {INITIATE_ORACLE_MONTHLY_LIMIT} Oracle questions a month</li>
              <li>◆ Decode Mode on every episode</li>
              <li>◆ The full Psychenomicon</li>
            </ul>
            <p className="text-[13px] text-ink-3">Cancel any time. No contracts.</p>
            <Link
              href="/premium"
              className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-member px-5 text-[15px] font-semibold text-member transition-colors hover:bg-member/10"
            >
              Compare Initiate+ tiers →
            </Link>
          </div>
          {/* GiftSignup carries its own heading and copy. */}
          <GiftSignup source="gift:gospel" />
        </section>
      </main>

      {/* WebSite + SearchAction JSON-LD is emitted once in the root layout —
          avoid a second, conflicting WebSite block here. */}
      <JsonLd data={organizationJsonLd(stats.episodes)} />
    </>
  );
}
