import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { getArchiveStats } from "@/lib/queries/stats";
import { SubscriptionCTA } from "@/components/subscription/subscription-cta";
import { ManageSubscription } from "@/components/subscription/manage-subscription";
import { SectionCard } from "@/components/ui/section-card";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Premium Access — CultCodex",
  description:
    "Unlock searchable transcripts for every Cult of Psyche episode and full access to The Psychenomicon — the forbidden grimoire of the Psycheverse.",
};

export default async function SubscribePage() {
  const user = await getCurrentUser();
  const subStatus = user ? await getSubscriptionStatus(user.id) : null;
  const stats = await getArchiveStats();

  const isActive = subStatus?.isAdmin || subStatus?.status === "active";

  return (
    <>
      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-accent-gold/10 bg-gradient-to-b from-[#1a0033] via-void to-void">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-gold/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent-cyan/10 via-transparent to-transparent" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 pb-12 pt-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan/70">
            Cult of Psyche Archive
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-accent-gold sm:text-5xl">
            Premium Access
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-mono text-sm leading-relaxed text-text-muted">
            Every word spoken. Every soul catalogued. Every secret documented.
            <br />
            <span className="text-text-primary">
              The complete Psycheverse — searchable, timestamped, and at your
              fingertips.
            </span>
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Already subscribed */}
        {isActive && subStatus && (
          <div className="mb-10">
            <ManageSubscription
              status={subStatus.status}
              periodEnd={subStatus.periodEnd}
              isAdmin={subStatus.isAdmin}
            />
            <p className="mt-4 text-center font-mono text-xs text-accent-gold">
              You have full premium access.{" "}
              <Link
                href="/episodes"
                className="underline hover:text-accent-gold/80"
              >
                Browse episodes
              </Link>{" "}
              or{" "}
              <Link
                href="/lore/psychenomicon"
                className="underline hover:text-accent-gold/80"
              >
                enter the Psychenomicon
              </Link>
            </p>
          </div>
        )}

        {/* Not subscribed */}
        {!isActive && (
          <>
            {/* Price Card */}
            <div className="mx-auto max-w-md">
              <div className="rounded-xl border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 via-surface to-surface p-8 text-center shadow-lg shadow-accent-gold/5">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-accent-gold/30 bg-accent-gold/10">
                  <span className="text-3xl">&#x1F4DC;</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-accent-gold">
                  CultCodex Premium
                </h2>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="font-display text-5xl font-bold text-text-primary">
                    $10
                  </span>
                  <span className="font-mono text-sm text-text-muted">
                    /month
                  </span>
                </div>
                <p className="mt-2 font-mono text-[10px] text-text-muted/60">
                  Cancel anytime. No contracts. Manage in your account settings.
                </p>
                <div className="mt-6">
                  <SubscriptionCTA variant="inline" />
                </div>
                {!user && (
                  <p className="mt-3 font-mono text-[10px] text-accent-cyan/70">
                    <Link
                      href="/auth/signin"
                      className="underline hover:text-accent-cyan"
                    >
                      Sign in with Google
                    </Link>{" "}
                    to subscribe
                  </p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="my-12 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-gold/20 to-transparent" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent-gold/40">
                What you unlock
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-gold/20 to-transparent" />
            </div>

            {/* Two Pillars */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Pillar 1: Transcripts */}
              <div className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent-gold/30">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-accent-gold/20 bg-accent-gold/5">
                  <span className="text-lg">&#x1F399;</span>
                </div>
                <h3 className="font-display text-lg font-bold text-accent-gold">
                  Full Transcripts
                </h3>
                <p className="mt-2 font-mono text-xs leading-relaxed text-text-muted">
                  Every word from {stats.episodes.toLocaleString()} episodes,
                  fully searchable and timestamped. Click any line to jump
                  straight to the moment in the video.
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Keyword search across every episode",
                    "Click-to-seek timestamps synced to video",
                    "Speaker-labeled dialogue view",
                    "Copy any segment with one click",
                    "Full-text search across all segments",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 font-mono text-[11px] text-text-muted"
                    >
                      <span className="mt-0.5 text-accent-gold">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pillar 2: Psychenomicon */}
              <div className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent-cyan/30">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-accent-cyan/20 bg-accent-cyan/5">
                  <span className="text-lg">&#x1F4D6;</span>
                </div>
                <h3 className="font-display text-lg font-bold text-accent-cyan">
                  The Psychenomicon
                </h3>
                <p className="mt-2 font-mono text-xs leading-relaxed text-text-muted">
                  The forbidden grimoire of the Psycheverse. A living chronicle
                  of every soul, saga, and spectacle from over{" "}
                  {stats.episodes.toLocaleString()} live transmissions.
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "The Book of Souls — every guest profiled",
                    "The Book of Sagas — story arcs and feuds",
                    "The Book of Rites — rituals and recurring bits",
                    "The Book of Omens — prophecies and predictions",
                    "The Book of Relics — legendary moments",
                    "The Book of Whispers — deleted/lost lore",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 font-mono text-[11px] text-text-muted"
                    >
                      <span className="mt-0.5 text-accent-cyan">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Archive Stats Bar */}
            <div className="mt-12 rounded-xl border border-border bg-elevated p-6">
              <h3 className="mb-4 text-center font-display text-sm font-bold uppercase tracking-widest text-text-muted">
                The Archive Contains
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {[
                  {
                    n: stats.episodes.toLocaleString(),
                    label: "Episodes",
                    color: "text-accent-gold",
                  },
                  {
                    n: stats.segments.toLocaleString(),
                    label: "Transcript Lines",
                    color: "text-accent-cyan",
                  },
                  {
                    n: stats.quotes.toLocaleString(),
                    label: "Quotes",
                    color: "text-accent-gold",
                  },
                  {
                    n: stats.people.toLocaleString(),
                    label: "People",
                    color: "text-accent-cyan",
                  },
                  {
                    n: stats.loreEntries.toLocaleString(),
                    label: "Lore Entries",
                    color: "text-accent-gold",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className={`font-display text-2xl font-bold ${stat.color}`}>
                      {stat.n}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
              {stats.totalHours > 0 && (
                <p className="mt-4 text-center font-mono text-[10px] text-text-muted/60">
                  {stats.totalHours.toLocaleString()}+ hours of recorded
                  transmissions — and growing every week
                </p>
              )}
            </div>

            {/* Testimonial / Flavor */}
            <div className="mt-12 rounded-xl border border-accent-gold/10 bg-gradient-to-r from-accent-gold/5 via-transparent to-accent-cyan/5 p-8 text-center">
              <blockquote className="mx-auto max-w-lg">
                <p className="font-display text-base italic leading-relaxed text-text-primary">
                  {
                    '"The Codex doesn\'t just archive the show. It reads its soul."'
                  }
                </p>
                <footer className="mt-3 font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  — The Psycheverse Scrollkeepers
                </footer>
              </blockquote>
            </div>

            {/* Free vs Premium Comparison */}
            <div className="mt-12">
              <h3 className="mb-6 text-center font-display text-sm font-bold uppercase tracking-widest text-text-muted">
                Free vs Premium
              </h3>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-elevated">
                      <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                        Feature
                      </th>
                      <th className="px-4 py-3 text-center font-mono text-[11px] uppercase tracking-wider text-text-muted">
                        Free
                      </th>
                      <th className="px-4 py-3 text-center font-mono text-[11px] uppercase tracking-wider text-accent-gold">
                        Premium
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      ["Browse episodes & summaries", true, true],
                      ["View guest profiles & bios", true, true],
                      ["Read quotes & topics", true, true],
                      ["Explore lore entries", true, true],
                      ["Search the lexicon", true, true],
                      ["Full episode transcripts", false, true],
                      ["Keyword search across transcripts", false, true],
                      ["Click-to-seek timestamps", false, true],
                      ["The Psychenomicon (full grimoire)", false, true],
                      ["Speaker-labeled dialogue", false, true],
                    ].map(([feature, free, premium]) => (
                      <tr
                        key={feature as string}
                        className="bg-surface transition-colors hover:bg-elevated/50"
                      >
                        <td className="px-4 py-2.5 font-mono text-[11px] text-text-primary">
                          {feature as string}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-sm">
                          {free ? (
                            <span className="text-green-500">&#10003;</span>
                          ) : (
                            <span className="text-text-muted/30">&#x2014;</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-sm">
                          {premium ? (
                            <span className="text-accent-gold">&#10003;</span>
                          ) : (
                            <span className="text-text-muted/30">&#x2014;</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Final CTA */}
            <div className="mt-12 text-center">
              <div className="mx-auto max-w-md rounded-xl border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-transparent p-8">
                <h3 className="font-display text-xl font-bold text-accent-gold">
                  Enter the Archive
                </h3>
                <p className="mt-2 font-mono text-xs text-text-muted">
                  {stats.episodes.toLocaleString()} episodes.{" "}
                  {stats.segments.toLocaleString()} transcript lines.{" "}
                  {stats.loreEntries.toLocaleString()} lore entries. One key.
                </p>
                <div className="mt-5">
                  <SubscriptionCTA variant="inline" />
                </div>
                {!user && (
                  <p className="mt-3 font-mono text-[10px] text-accent-cyan/70">
                    <Link
                      href="/auth/signin"
                      className="underline hover:text-accent-cyan"
                    >
                      Sign in
                    </Link>{" "}
                    first, then subscribe
                  </p>
                )}
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-12 space-y-4">
              <h3 className="text-center font-display text-sm font-bold uppercase tracking-widest text-text-muted">
                Questions
              </h3>
              {[
                {
                  q: "What happens after I subscribe?",
                  a: "Instant access. Every transcript and the full Psychenomicon unlock immediately. No waiting period.",
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Yes. Cancel from your account settings or the Stripe portal. You keep access until the end of your billing period.",
                },
                {
                  q: "What payment methods do you accept?",
                  a: "All major credit and debit cards via Stripe. Your payment info is handled securely by Stripe — we never see your card details.",
                },
                {
                  q: "Is the archive still growing?",
                  a: `Yes. New episodes are added regularly. The archive currently contains ${stats.episodes.toLocaleString()} episodes and counting.`,
                },
              ].map(({ q, a }) => (
                <div
                  key={q}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  <h4 className="font-mono text-xs font-bold text-text-primary">
                    {q}
                  </h4>
                  <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-text-muted">
                    {a}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
