import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { getArchiveStats, getMemberCount } from "@/lib/queries/stats";
import { SubscriptionCTA } from "@/components/subscription/subscription-cta";
import { ManageSubscription } from "@/components/subscription/manage-subscription";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Unlock the Archive — CultCodex Premium",
  description:
    "Every word spoken. Every soul catalogued. Every secret documented. Full transcripts, The Psychenomicon, and your official cult identity — $10/month.",
};

const FOUNDING_CAP = 22;

export default async function SubscribePage() {
  const user = await getCurrentUser();
  const [subStatus, stats, memberCount] = await Promise.all([
    user ? getSubscriptionStatus(user.id) : Promise.resolve(null),
    getArchiveStats(),
    getMemberCount(),
  ]);

  const isActive = subStatus?.isAdmin || subStatus?.status === "active";
  const seatsLeft = Math.max(0, FOUNDING_CAP - memberCount);

  return (
    <>
      {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a0033] via-[#100020] to-void">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-accent-gold/8 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent-cyan/6 blur-[80px]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-purple-600/8 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-20 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-accent-cyan">
            ✦ &nbsp; CultCodex Premium &nbsp; ✦
          </p>

          <h1
            className="mt-4 font-display text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl"
            style={{ textShadow: "0 0 60px rgba(212,175,55,0.35)" }}
          >
            The Archive{" "}
            <span
              className="text-accent-gold"
              style={{ textShadow: "0 0 30px rgba(212,175,55,0.6)" }}
            >
              Is Open.
            </span>
            <br />
            <span className="text-3xl font-normal text-text-muted sm:text-4xl">
              Are you ready to enter?
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl font-mono text-sm leading-relaxed text-text-muted">
            Every word spoken on{" "}
            <span className="text-text-primary font-bold">
              {stats.episodes.toLocaleString()} episodes
            </span>
            . Every soul catalogued. Every secret documented and searchable.{" "}
            <span className="text-accent-gold">
              {stats.totalHours.toLocaleString()}+ hours
            </span>{" "}
            of transmissions — at your fingertips.
          </p>

          {/* Founding cohort pill */}
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-accent-gold/30 bg-accent-gold/8 px-5 py-2.5 shadow-lg shadow-accent-gold/10">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-accent-gold" />
            <span className="font-mono text-xs text-text-muted">
              <span className="font-bold text-accent-gold">{memberCount}</span>{" "}
              founding {memberCount === 1 ? "initiate" : "initiates"}{" "}
              {seatsLeft > 0 ? (
                <>· <span className="font-bold text-accent-gold">{seatsLeft}</span> founding {seatsLeft === 1 ? "seat" : "seats"} remain</>
              ) : (
                "· founding cohort sealed"
              )}
            </span>
          </div>

          {!isActive && (
            <div className="mt-8">
              <SubscriptionCTA variant="inline" />
              {!user && (
                <p className="mt-3 font-mono text-[10px] text-accent-cyan/60">
                  <Link href="/auth/signin" className="hover:text-accent-cyan underline">
                    Sign in with Google
                  </Link>{" "}
                  to subscribe
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {!isActive && (
        <>
          {/* ═══ PROBLEM ══════════════════════════════════════════════════════ */}
          <section className="border-b border-border/40 bg-void/80 py-14 px-4">
            <div className="mx-auto max-w-4xl">
              <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/50">
                /// the_problem
              </p>
              <h2 className="mb-4 text-center font-display text-3xl font-bold text-white">
                Most people watch content.
                <br />
                <span className="text-2xl font-normal text-text-muted">
                  They don&apos;t understand it.
                </span>
              </h2>
              <p className="mx-auto mb-10 max-w-2xl text-center font-mono text-sm text-text-muted">
                Cult of Psyche is 8+ years of live-streamed psychology, manipulation, and chaos.
                Without a system for decoding it, you&apos;re just watching. With CultCodex, you see everything.
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { icon: "🎭", label: "Manipulation tactics", desc: "Identified and documented across every episode" },
                  { icon: "🧠", label: "Psychological patterns", desc: "Recurring behaviors mapped across years" },
                  { icon: "⚡", label: "Power dynamics", desc: "Who holds power, who loses it, and why" },
                  { icon: "🕸️", label: "Hidden connections", desc: "Links between guests, events, and arcs" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-surface p-4 text-center">
                    <p className="mb-2 text-2xl">{item.icon}</p>
                    <p className="font-mono text-xs font-bold text-text-primary">{item.label}</p>
                    <p className="mt-1 font-mono text-[10px] leading-relaxed text-text-muted">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ SOLUTION ═════════════════════════════════════════════════════ */}
          <section className="border-b border-border/40 bg-surface/50 py-14 px-4">
            <div className="mx-auto max-w-4xl">
              <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-accent-cyan/50">
                /// the_system
              </p>
              <h2 className="mb-10 text-center font-display text-3xl font-bold text-white">
                CultCodex turns chaos
                <br />
                <span className="text-accent-cyan">into structure.</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: "🔍", label: "Full-text search", desc: "Search every word spoken across all episodes. Find any quote, topic, or moment instantly." },
                  { icon: "📜", label: "The Psychenomicon", desc: "A living grimoire of every soul, saga, and spectacle. The mythology of the Psycheverse, documented." },
                  { icon: "👁️", label: "Character profiles", desc: "Every guest profiled — their patterns, their history, their arc across the show." },
                  { icon: "🗺️", label: "Topic signal maps", desc: "See which themes dominate, which topics connect, and what patterns keep surfacing." },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5">
                    <span className="flex-shrink-0 text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-mono text-xs font-bold text-text-primary">{item.label}</p>
                      <p className="mt-1 font-mono text-[10px] leading-relaxed text-text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <main className="mx-auto max-w-5xl px-4 py-12">

        {/* ═══ ALREADY SUBSCRIBED ═══════════════════════════════════════════ */}
        {isActive && subStatus && (
          <div className="mb-12">
            <ManageSubscription
              status={subStatus.status}
              periodEnd={subStatus.periodEnd ? subStatus.periodEnd.toISOString() : null}
              isAdmin={subStatus.isAdmin}
            />
            <p className="mt-4 text-center font-mono text-xs text-accent-gold">
              You have full premium access.{" "}
              <Link href="/episodes" className="underline hover:text-accent-gold/80">
                Browse episodes
              </Link>{" "}
              ·{" "}
              <Link href="/lore/psychenomicon" className="underline hover:text-accent-gold/80">
                Open the Psychenomicon
              </Link>{" "}
              ·{" "}
              <Link href="/members" className="underline hover:text-accent-gold/80">
                View Member Roll
              </Link>
            </p>
          </div>
        )}

        {/* ═══ ARCHIVE STATS ════════════════════════════════════════════════ */}
        <div className="mb-14 rounded-2xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface p-8 shadow-xl shadow-accent-gold/5">
          <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60">
            What You&apos;re Unlocking
          </p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
            {[
              { n: stats.episodes.toLocaleString(), label: "Episodes", icon: "📺", color: "text-accent-gold" },
              { n: stats.segments.toLocaleString(), label: "Transcript Lines", icon: "📝", color: "text-accent-cyan" },
              { n: stats.quotes.toLocaleString(), label: "Quotes", icon: "💬", color: "text-accent-gold" },
              { n: stats.people.toLocaleString(), label: "Profiled Souls", icon: "👁", color: "text-accent-cyan" },
              { n: stats.loreEntries.toLocaleString(), label: "Lore Entries", icon: "📖", color: "text-accent-gold" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl">{stat.icon}</p>
                <p
                  className={`mt-1 font-display text-3xl font-bold ${stat.color}`}
                  style={{
                    textShadow:
                      stat.color === "text-accent-gold"
                        ? "0 0 20px rgba(212,175,55,0.4)"
                        : "0 0 20px rgba(0,217,255,0.4)",
                  }}
                >
                  {stat.n}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          {stats.totalHours > 0 && (
            <p className="mt-6 text-center font-mono text-xs text-accent-gold/70">
              {stats.totalHours.toLocaleString()}+ hours of recorded transmissions —{" "}
              <span className="text-text-muted">and growing every week</span>
            </p>
          )}
        </div>

        {/* ═══ PRICE CARD ═══════════════════════════════════════════════════ */}
        {!isActive && (
          <>
            <div className="mx-auto mb-14 max-w-md">
              <div className="relative overflow-hidden rounded-2xl border border-accent-gold/50 bg-gradient-to-b from-[#1a0033] via-surface to-surface p-8 text-center shadow-2xl shadow-accent-gold/15">
                {/* Corner glow */}
                <div className="pointer-events-none absolute -top-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-accent-gold/20 blur-3xl" />

                {/* Founding member badge */}
                <div className="relative mb-4 inline-flex items-center gap-1.5 rounded-full border border-accent-gold/40 bg-accent-gold/10 px-4 py-1.5">
                  <span className="text-sm">⚡</span>
                  <span className="font-mono text-[11px] font-bold text-accent-gold">
                    Founding Member Rate — Locked Forever
                  </span>
                </div>

                <div className="relative">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-accent-gold/40 bg-accent-gold/10 text-3xl shadow-lg shadow-accent-gold/20">
                    📜
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    CultCodex Premium
                  </h2>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span
                      className="font-display text-6xl font-bold text-accent-gold"
                      style={{ textShadow: "0 0 30px rgba(212,175,55,0.5)" }}
                    >
                      $10
                    </span>
                    <span className="font-mono text-base text-text-muted">/month</span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-text-muted/60">
                    Less than a coffee. More than a thousand hours of content.
                  </p>
                  <div className="mt-6">
                    <SubscriptionCTA variant="inline" />
                  </div>
                  {!user && (
                    <p className="mt-3 font-mono text-[10px] text-accent-cyan/60">
                      <Link href="/auth/signin" className="underline hover:text-accent-cyan">
                        Sign in
                      </Link>{" "}
                      first, then subscribe
                    </p>
                  )}
                  <p className="mt-4 font-mono text-[10px] text-text-muted/50">
                    Cancel anytime · No contracts · Manage in your account
                  </p>
                </div>
              </div>
            </div>

            {/* ═══ WHAT YOU GET ═════════════════════════════════════════════ */}
            <div className="mb-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-gold/30 to-transparent" />
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-gold/50">
                Everything in your archive
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-gold/30 to-transparent" />
            </div>

            {/* Three-pillar grid */}
            <div className="mb-14 grid gap-5 md:grid-cols-3">

              {/* Pillar 1 — Transcripts */}
              <div className="group rounded-2xl border border-accent-gold/25 bg-gradient-to-b from-accent-gold/8 to-surface p-6 transition-all hover:border-accent-gold/50 hover:shadow-xl hover:shadow-accent-gold/10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-accent-gold/30 bg-accent-gold/10 text-2xl shadow-md shadow-accent-gold/10">
                  🎙️
                </div>
                <h3 className="font-display text-lg font-bold text-accent-gold">
                  Full Transcripts
                </h3>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-text-muted">
                  {stats.episodes.toLocaleString()} episodes, fully searchable and timestamped.
                  Click any line to seek straight to that moment.
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    "Search every word ever spoken",
                    "Click-to-seek timestamps",
                    "Speaker-labeled dialogue",
                    "Copy any segment instantly",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 font-mono text-[11px] text-text-muted">
                      <span className="mt-0.5 text-accent-gold">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pillar 2 — Psychenomicon */}
              <div className="group rounded-2xl border border-accent-cyan/25 bg-gradient-to-b from-accent-cyan/8 to-surface p-6 transition-all hover:border-accent-cyan/50 hover:shadow-xl hover:shadow-accent-cyan/10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-accent-cyan/30 bg-accent-cyan/10 text-2xl shadow-md shadow-accent-cyan/10">
                  📖
                </div>
                <h3 className="font-display text-lg font-bold text-accent-cyan">
                  The Psychenomicon
                </h3>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-text-muted">
                  The forbidden grimoire of the Psycheverse. A living chronicle
                  of every soul, saga, and spectacle across {stats.loreEntries.toLocaleString()}+ lore entries.
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    "The Book of Souls — every guest profiled",
                    "The Book of Sagas — arcs & feuds",
                    "The Book of Rites — rituals & bits",
                    "The Book of Omens — prophecies",
                    "The Book of Relics — legendary moments",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 font-mono text-[11px] text-text-muted">
                      <span className="mt-0.5 text-accent-cyan">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pillar 3 — Identity */}
              <div className="group rounded-2xl border border-purple-500/25 bg-gradient-to-b from-purple-500/8 to-surface p-6 transition-all hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-2xl shadow-md shadow-purple-500/10">
                  👁️
                </div>
                <h3 className="font-display text-lg font-bold text-purple-400">
                  Cult Identity
                </h3>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-text-muted">
                  Your official place in the Psycheverse. Choose a flair title,
                  join the public Member Roll, and leave your mark on the archive.
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    "Custom flair title (Architect, Hierophant…)",
                    "Listed on public Member Roll",
                    "Member-since badge",
                    "Founding Member status (early birds)",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 font-mono text-[11px] text-text-muted">
                      <span className="mt-0.5 text-purple-400">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ═══ FREE vs PREMIUM TABLE ════════════════════════════════════ */}
            <div className="mb-14">
              <div className="mb-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-text-muted/50">
                  Free vs Premium
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>

              <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-elevated">
                      <th className="px-5 py-3.5 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">Feature</th>
                      <th className="px-5 py-3.5 text-center font-mono text-[11px] uppercase tracking-wider text-text-muted">Free</th>
                      <th className="px-5 py-3.5 text-center font-mono text-[11px] uppercase tracking-wider text-accent-gold">
                        Premium
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {[
                      ["Browse episodes & summaries", true, true],
                      ["Guest profiles & bios", true, true],
                      ["Quotes, topics & lore browsing", true, true],
                      ["Search the lexicon", true, true],
                      ["Full episode transcripts", false, true],
                      ["Keyword search across transcripts", false, true],
                      ["Click-to-seek timestamps", false, true],
                      ["The Psychenomicon (full grimoire)", false, true],
                      ["Custom cult flair title", false, true],
                      ["Public Member Roll listing", false, true],
                    ].map(([feature, free, premium]) => (
                      <tr key={feature as string} className="bg-surface transition-colors hover:bg-elevated/60">
                        <td className="px-5 py-3 font-mono text-[11px] text-text-primary">{feature as string}</td>
                        <td className="px-5 py-3 text-center font-mono text-base">
                          {free ? (
                            <span className="text-green-500">✓</span>
                          ) : (
                            <span className="text-text-muted/25">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center font-mono text-base">
                          {premium ? (
                            <span
                              className="text-accent-gold"
                              style={{ filter: "drop-shadow(0 0 4px rgba(212,175,55,0.5))" }}
                            >
                              ✓
                            </span>
                          ) : (
                            <span className="text-text-muted/25">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ═══ TESTIMONIALS ═════════════════════════════════════════════ */}
            <div className="mb-14 grid gap-4 sm:grid-cols-3">
              {[
                {
                  quote: "I didn't know what I was missing until I searched a guest's name and found every single thing they ever said on the show.",
                  handle: "Hierophant in the Dark",
                },
                {
                  quote: "The Psychenomicon reads like a mythology textbook for a universe that shouldn't exist but absolutely does.",
                  handle: "Scrollkeeper #7",
                },
                {
                  quote: "Best $10 I've spent. The archive goes deeper than I imagined. I'm three years in and I haven't reached the bottom.",
                  handle: "Void Walker",
                },
              ].map(({ quote, handle }) => (
                <div
                  key={handle}
                  className="rounded-xl border border-accent-gold/15 bg-gradient-to-b from-accent-gold/5 to-surface p-5"
                >
                  <p className="font-mono text-[11px] italic leading-relaxed text-text-muted">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-accent-gold/60">
                    — {handle}
                  </p>
                </div>
              ))}
            </div>

            {/* ═══ FINAL CTA ════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-2xl border border-accent-gold/40 bg-gradient-to-b from-[#1a0033] via-[#0d001a] to-[#0d001a] p-10 text-center shadow-2xl shadow-accent-gold/10">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-16 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-accent-gold/10 blur-3xl" />
              </div>
              <div className="relative">
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-cyan/70">
                  ✦ &nbsp; One key. Everything. &nbsp; ✦
                </p>
                <h3
                  className="mt-3 font-display text-3xl font-bold text-accent-gold sm:text-4xl"
                  style={{ textShadow: "0 0 30px rgba(212,175,55,0.4)" }}
                >
                  Enter the Archive
                </h3>
                <p className="mx-auto mt-3 max-w-sm font-mono text-xs text-text-muted">
                  {stats.episodes.toLocaleString()} episodes.{" "}
                  {stats.segments.toLocaleString()} transcript lines.{" "}
                  {stats.loreEntries.toLocaleString()} lore entries.
                  <br />
                  <span className="text-accent-gold">
                    {memberCount} members already inside.
                  </span>
                </p>
                <div className="mt-6">
                  <SubscriptionCTA variant="inline" />
                </div>
                {!user && (
                  <p className="mt-3 font-mono text-[10px] text-accent-cyan/60">
                    <Link href="/auth/signin" className="underline hover:text-accent-cyan">
                      Sign in
                    </Link>{" "}
                    first, then subscribe
                  </p>
                )}
                <p className="mt-4 font-mono text-[10px] text-text-muted/40">
                  Cancel anytime · Founding member pricing locked forever
                </p>
              </div>
            </div>

            {/* ═══ FAQ ══════════════════════════════════════════════════════ */}
            <div className="mt-12 space-y-3">
              <h3 className="mb-5 text-center font-display text-sm font-bold uppercase tracking-widest text-text-muted/60">
                Questions
              </h3>
              {[
                {
                  q: "What happens the moment I subscribe?",
                  a: "Instant access. Every transcript and the full Psychenomicon unlock immediately. Your member profile activates. No waiting period, no delays.",
                },
                {
                  q: "What does 'Founding Member rate' mean?",
                  a: "You lock in $10/month forever. If the price ever increases for new subscribers, you keep paying $10 as long as your subscription stays active.",
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Yes. Cancel from your account settings or the Stripe billing portal. You keep full access until the end of your paid billing period.",
                },
                {
                  q: "Is the archive still growing?",
                  a: `Always. New episodes are added regularly. The archive currently holds ${stats.episodes.toLocaleString()} episodes with ${stats.totalHours.toLocaleString()}+ hours of content — and that number climbs every week.`,
                },
                {
                  q: "What payment methods do you accept?",
                  a: "All major credit and debit cards via Stripe. Your payment info is handled entirely by Stripe — we never see your card details.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent-gold/20">
                  <h4 className="font-mono text-xs font-bold text-text-primary">{q}</h4>
                  <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-text-muted">{a}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
