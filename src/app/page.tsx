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
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format/date";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { SacredGeometryOverlay, FloatingParticles } from "@/components/graphics/sacred-geometry";
import { ArchiveDisclaimer } from "@/components/ui/archive-disclaimer";

export const revalidate = 300;

export const metadata = {
  title: "CultCodex — Decode Cult of Psyche | 1,500+ Episodes Archived",
  description:
    "The definitive archive of Cult of Psyche. 1,500+ episodes with full transcripts, AI psychological breakdowns, guest profiles, topic signals, and behavioral pattern maps.",
  openGraph: {
    title: "CultCodex — Decode Cult of Psyche",
    description:
      "1,500+ conversations decoded. Manipulation tactics, psychological patterns, and behavioral archetypes from every Cult of Psyche episode — all searchable.",
    type: "website" as const,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "CultCodex — Decode Cult of Psyche",
    description:
      "Full transcripts, AI breakdowns, guest profiles, and pattern maps for every Cult of Psyche episode.",
  },
};

export default async function HomePage() {
  const [stats, recentEpisodes, recentQuotes, liveStatus, popularTopics] = await Promise.all([
    getArchiveStats(),
    getEpisodes({ take: 5, orderBy: "airDate", order: "desc" }),
    getQuotes({ take: 2 }),
    prisma.liveStatus.findUnique({ where: { id: "singleton" } }),
    getTopTopicsByEpisodes(10),
  ]);

  const recentCards = recentEpisodes.map(formatEpisodeForCard);
  const featured = recentEpisodes[0];
  const isLive = liveStatus?.isLive ?? false;

  return (
    <>
      {/* ══════════════════════════════════════════════════
          HERO — "This isn't a content library."
      ══════════════════════════════════════════════════ */}
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
            <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-accent-cyan/80">
              ✦ &nbsp; CultCodex &nbsp; ✦
            </p>
            <h1
              className="font-display text-3xl sm:text-5xl font-bold leading-tight text-white"
              style={{ textShadow: "0 0 60px rgba(212,175,55,0.3)" }}
            >
              This isn&rsquo;t a content library.
              <br />
              <span className="text-accent-gold" style={{ textShadow: "0 0 40px rgba(212,175,55,0.6)" }}>
                It&rsquo;s a system for seeing
                <br className="hidden sm:block" /> what others miss.
              </span>
            </h1>
            <p className="font-mono text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
              {stats.episodes.toLocaleString()}+ conversations. Patterns decoded.
              Behavior mapped. Reality, organized.
            </p>
          </div>

          <Link
            href="/start-here"
            className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-8 py-3.5 font-mono text-sm font-bold text-accent-gold transition-all hover:bg-accent-gold/25 hover:shadow-xl hover:shadow-accent-gold/20"
          >
            Enter the Codex →
          </Link>

          {/* Search */}
          <div className="w-full max-w-md">
            <SearchInput />
          </div>
        </div>
      </section>

      <main id="main-content" className="space-y-0">

        {/* ══════════════════════════════════════════════════
            SOCIAL PROOF STRIP — live archive signals
        ══════════════════════════════════════════════════ */}
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

        {/* ══════════════════════════════════════════════════
            PROBLEM — "Most people watch content."
        ══════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-void via-[#0a0010] to-void py-20 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.04),transparent_70%)]" />
          <div className="relative mx-auto max-w-4xl text-center space-y-10">
            <div className="space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/50">
                /// the_problem
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
                Most people watch content.
                <br />
                <span className="text-text-muted font-normal text-2xl sm:text-3xl">They don&rsquo;t understand it.</span>
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 max-w-3xl mx-auto">
              {[
                { icon: "🎭", label: "Manipulation", desc: "Playing out in plain sight" },
                { icon: "🧠", label: "Psychological patterns", desc: "Repeating across every guest" },
                { icon: "⚡", label: "Power dynamics", desc: "Who controls the room and how" },
                { icon: "🕸️", label: "Hidden connections", desc: "Between people, events, episodes" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-accent-gold/10 bg-surface/60 p-5 text-center space-y-2">
                  <p className="text-2xl">{item.icon}</p>
                  <p className="font-mono text-xs font-bold text-text-primary">{item.label}</p>
                  <p className="font-mono text-[10px] text-text-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <p className="font-mono text-sm text-text-muted/80 max-w-lg mx-auto leading-relaxed italic">
              You&rsquo;ve seen it. You felt it. But you couldn&rsquo;t fully explain it.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            SOLUTION — "CultCodex turns chaos into structure."
        ══════════════════════════════════════════════════ */}
        <section className="relative bg-gradient-to-b from-[#0a0010] to-void py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,217,255,0.04),transparent_60%)]" />
          <div className="relative mx-auto max-w-5xl space-y-12">
            <div className="text-center space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-cyan/60">
                /// the_solution
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                CultCodex turns chaos into structure.
              </h2>
              <p className="font-mono text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
                Every guest, every panel, every moment becomes part of a larger map.
                <br />
                Not entertainment. <span className="text-text-primary font-bold">Intelligence.</span>
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: "📜",
                  title: "Full Transcripts",
                  desc: `${stats.segments.toLocaleString()} segments — every word spoken, searchable and timestamped. Click any line to seek.`,
                  tier: "Initiate+",
                  color: "gold",
                },
                {
                  icon: "🧠",
                  title: "Decode Mode",
                  desc: "AI psychological breakdowns of every panel. Guest archetypes, behavior patterns, manipulation tactics — named and mapped.",
                  tier: "Initiate+",
                  color: "gold",
                },
                {
                  icon: "🔍",
                  title: "Pattern Detection",
                  desc: "Find every time a tactic repeats across guests. Filter by archetype, behavior type, conflict pattern.",
                  tier: "Initiate+",
                  color: "gold",
                },
                {
                  icon: "🕸️",
                  title: "Hidden Connections",
                  desc: "Episodes, guests, and topics linked through shared patterns. The map shows what the timeline hides.",
                  tier: "Oracle",
                  color: "violet",
                },
                {
                  icon: "🎭",
                  title: "Behavioral Archetypes",
                  desc: "Every recurring guest profile broken down — not just who they are, but how they operate and why.",
                  tier: "Oracle",
                  color: "violet",
                },
                {
                  icon: "👁",
                  title: "Personal Codex",
                  desc: "Save signals, annotate transmissions, and build your own map of the Psycheverse. Your intelligence layer.",
                  tier: "Initiate+",
                  color: "gold",
                },
              ].map((item) => {
                const isViolet = item.color === "violet";
                return (
                  <div
                    key={item.title}
                    className={`rounded-xl border ${isViolet ? "border-accent-violet/20" : "border-accent-gold/20"} bg-surface p-6 space-y-3 transition-colors hover:${isViolet ? "border-accent-violet/40" : "border-accent-gold/40"}`}
                  >
                    <p className="text-2xl">{item.icon}</p>
                    <div>
                      <h3 className={`font-display text-base font-bold ${isViolet ? "text-accent-violet" : "text-accent-gold"}`}>
                        {item.title}
                      </h3>
                      <span className={`font-mono text-[9px] uppercase tracking-widest ${isViolet ? "text-accent-violet/60" : "text-accent-gold/60"}`}>
                        {item.tier}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-text-muted leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            TIER COMPARISON — simplified 3-role strip
        ══════════════════════════════════════════════════ */}
        <section className="bg-gradient-to-b from-void to-[#0a0010] py-20 px-4">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="text-center space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/50">
                /// three_roles
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Three positions in the system.
              </h2>
            </div>

            <div className="grid gap-px md:grid-cols-3 overflow-hidden rounded-2xl border border-border">
              {[
                {
                  role: "Observer",
                  price: "Free",
                  hook: "Limited access. Surface-level view.",
                  color: "text-text-muted",
                  bg: "bg-surface",
                  items: ["Browse episodes + summaries", "Guest profiles and bios", "Quotes, topics, lore", "Basic search"],
                },
                {
                  role: "Initiate+",
                  price: "$10/month",
                  hook: "Full access. Decode what you're watching. Build your personal Codex.",
                  color: "text-accent-gold",
                  bg: "bg-surface",
                  items: ["Everything above", "Full transcripts + click-to-seek", "Decode Mode (AI breakdowns)", "Pattern detection + advanced search", "Personal Codex"],
                },
                {
                  role: "Oracle",
                  price: "$25/month",
                  hook: "Direct access. Influence the system. See what's not public.",
                  color: "text-accent-violet",
                  bg: "bg-surface",
                  items: ["Everything above", "Vote on guests + topics", "Submit investigations", "Guest intelligence files", "Named Oracle role"],
                },
              ].map((tier, i) => (
                <div key={tier.role} className={`${tier.bg} p-6 space-y-4 ${i === 1 ? "border-t-2 border-t-accent-gold" : i === 2 ? "border-t-2 border-t-accent-violet" : ""}`}>
                  <div>
                    <h3 className={`font-display text-xl font-bold ${tier.color}`}>{tier.role}</h3>
                    <p className={`font-mono text-xs font-bold mt-0.5 ${tier.color}`}>{tier.price}</p>
                  </div>
                  <p className="font-mono text-[11px] italic text-text-muted leading-relaxed">{tier.hook}</p>
                  <ul className="space-y-1.5">
                    {tier.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 font-mono text-[11px] text-text-muted">
                        <span className={`mt-0.5 ${tier.color}`}>✦</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {i > 0 && (
                    <Link
                      href="/premium"
                      className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 font-mono text-xs font-bold transition-all ${
                        i === 1
                          ? "border-accent-gold/40 bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20"
                          : "border-accent-violet/40 bg-accent-violet/10 text-accent-violet hover:bg-accent-violet/20"
                      }`}
                    >
                      Become {tier.role} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            IDENTITY PUSH — "Two types of people."
        ══════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#0a0010] via-[#100020] to-void py-20 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_70%)]" />
          <div className="relative mx-auto max-w-2xl text-center space-y-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/50">
              /// identity
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
              There are two types of people here.
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-left">
              <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-2">
                <p className="font-mono text-xs font-bold text-text-muted uppercase tracking-widest">Those who watch</p>
                <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                  They see what happens on the surface. They can&rsquo;t explain the patterns underneath.
                  They leave entertained — but not changed.
                </p>
              </div>
              <div className="rounded-xl border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-surface p-5 space-y-2">
                <p className="font-mono text-xs font-bold text-accent-gold uppercase tracking-widest">Those who understand</p>
                <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                  They have the map. They see manipulation as it happens.
                  They know the archetypes before they speak. The archive gave them the system.
                </p>
              </div>
            </div>
            <p className="font-display text-xl font-bold text-accent-gold">
              Choose your role.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/premium"
                className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-7 py-3 font-mono text-sm font-bold text-accent-gold transition-all hover:bg-accent-gold/25 hover:shadow-xl hover:shadow-accent-gold/20"
              >
                Become Initiate+ — $10/mo
              </Link>
              <Link
                href="/premium#system"
                className="inline-flex items-center gap-2 rounded-lg border border-accent-violet/40 bg-accent-violet/10 px-7 py-3 font-mono text-sm font-bold text-accent-violet transition-all hover:bg-accent-violet/20"
              >
                Become Oracle — $25/mo
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            URGENCY — "Entering before it scales."
        ══════════════════════════════════════════════════ */}
        <section className="bg-void py-12 px-4">
          <div className="mx-auto max-w-2xl text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-gold/30 bg-accent-gold/8 px-5 py-2.5 shadow-lg shadow-accent-gold/10">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-accent-gold" />
              <span className="font-mono text-xs text-text-muted">
                Early adopter window &nbsp;·&nbsp;{" "}
                <span className="text-accent-gold font-bold">Oracle access is limited.</span>
              </span>
            </div>
            <p className="font-mono text-sm text-text-muted leading-relaxed max-w-md mx-auto">
              You&rsquo;re entering before this scales.
              The people who come in now lock founding rates and shape what gets built.
            </p>
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-8 py-3.5 font-mono text-sm font-bold text-accent-gold transition-all hover:bg-accent-gold/25 hover:shadow-xl hover:shadow-accent-gold/20"
            >
              Unlock the Codex →
            </Link>
          </div>
        </section>

        <MysticalDivider />

        {/* ══════════════════════════════════════════════════
            ARCHIVE — proof. Recent transmissions + live data.
        ══════════════════════════════════════════════════ */}
        <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">

          {/* Archive weight bar */}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[
              { n: stats.episodes.toLocaleString(), label: "Episodes" },
              { n: stats.people.toLocaleString(), label: "People" },
              { n: stats.loreEntries.toLocaleString(), label: "Lore entries" },
              { n: stats.quotes.toLocaleString(), label: "Quotes" },
              { n: stats.topics.toLocaleString(), label: "Signals" },
              { n: `${stats.totalHours.toLocaleString()}+`, label: "Hours" },
            ].map((s) => (
              <Link
                key={s.label}
                href={s.label === "Episodes" ? "/episodes" : s.label === "People" ? "/people" : s.label === "Lore entries" ? "/lore" : s.label === "Quotes" ? "/quotes" : s.label === "Signals" ? "/topics" : "/stats"}
                className="rounded-lg border border-border bg-surface p-3 text-center transition-colors hover:border-accent-gold/40 hover:bg-surface-raised"
              >
                <p className="font-mono text-lg font-bold text-accent-gold">{s.n}</p>
                <p className="mt-0.5 font-mono text-[10px] text-text-muted">{s.label}</p>
              </Link>
            ))}
          </div>

          {/* Featured + Recent */}
          {featured && (
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60">
                /// latest_transmission
              </p>
              <Link
                href={`/episodes/${featured.slug}`}
                className="group flex flex-col sm:flex-row items-start gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-accent-gold/30 hover:bg-elevated"
              >
                {featured.thumbnailUrl ? (
                  <img src={featured.thumbnailUrl} alt="" className="w-full sm:w-48 h-32 rounded-lg object-cover flex-shrink-0" />
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

          {/* Recent transmissions */}
          {recentCards.length > 1 && (
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60">
                /// recent_transmissions
              </p>
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

          {/* Popular Topics */}
          {popularTopics.length > 0 && (
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan/60">
                /// active_signals
              </p>
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

          {/* Recent Quotes */}
          {recentQuotes.length > 0 && (
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
                /// notable_moments
              </p>
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
              <Link href="/quotes" className="font-mono text-xs text-text-muted hover:underline">
                Explore all quotes →
              </Link>
            </div>
          )}

          <ArchiveDisclaimer variant="full" />
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Cult Codex",
            url: "https://cultcodex.me",
            description: "A pattern intelligence system. 1,500+ conversations. Every word. Every soul. Every connection.",
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
