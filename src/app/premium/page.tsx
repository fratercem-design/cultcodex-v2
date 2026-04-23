/**
 * /premium — Two-tier subscription pricing page.
 *
 * The canonical subscribe surface going forward (supersedes /subscribe).
 *   - Codex Access ($9/mo) — transcripts, Psychenomicon, member identity
 *   - Full System  ($29/mo) — all of Access plus /codex + insights
 *
 * Tier definitions come from src/lib/subscription-tiers.ts. Stripe
 * checkout is kicked off client-side by TierCheckoutButton.
 */
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { getArchiveStats } from "@/lib/queries/stats";
import { prisma } from "@/lib/db";
import { TIERS } from "@/lib/subscription-tiers";
import { TierCheckoutButton } from "@/components/subscription/tier-checkout-button";
import { ManageSubscription } from "@/components/subscription/manage-subscription";
import { SoftGate } from "@/components/subscription/soft-gate";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Premium — Two Ways to Enter",
  description:
    "Codex Access ($9/mo) unlocks transcripts, Psychenomicon, and member identity. Full System ($29/mo) adds your personal /codex, insight engine, and salon access.",
  path: "/premium",
});

async function getMemberCount() {
  return prisma.codexUser.count({
    where: {
      OR: [{ role: "admin" }, { subscriptionStatus: "active" }],
    },
  });
}

export default async function PremiumPage() {
  const user = await getCurrentUser();
  const [subStatus, stats, memberCount] = await Promise.all([
    user ? getSubscriptionStatus(user.id) : Promise.resolve(null),
    getArchiveStats(),
    getMemberCount(),
  ]);

  const isActive = subStatus?.isAdmin || subStatus?.status === "active";
  const notSignedIn = !user;

  return (
    <>
      <PageHero
        title="PREMIUM"
        subtitle="Two ways to enter. Pick your depth."
        backgroundImage="/hero-bg.jpg"
      />

      <main
        id="main-content"
        className="mx-auto max-w-6xl px-4 py-12 space-y-14"
      >
        {/* Mythic framing */}
        <section className="text-center max-w-2xl mx-auto space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-cyan">
            /// tiered_access
          </p>
          <p className="font-display text-lg text-text-primary leading-relaxed">
            The archive is free to browse. Two tiers open what&rsquo;s underneath.
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            <span className="text-text-primary font-bold">
              {stats.episodes.toLocaleString()}
            </span>{" "}
            transmissions &middot;{" "}
            <span className="text-text-primary font-bold">
              {stats.segments.toLocaleString()}
            </span>{" "}
            transcript lines &middot;{" "}
            <span className="text-accent-gold">{memberCount}</span> members already
            inside.
          </p>
        </section>

        {/* Already subscribed banner */}
        {isActive && subStatus && (
          <section className="max-w-3xl mx-auto">
            <ManageSubscription
              status={subStatus.status}
              periodEnd={subStatus.periodEnd}
              isAdmin={subStatus.isAdmin}
            />
            <p className="mt-4 text-center font-mono text-xs text-accent-gold">
              You have active premium access.{" "}
              <Link href="/episodes" className="underline hover:text-accent-gold/80">
                Browse episodes
              </Link>{" "}
              &middot;{" "}
              <Link href="/members" className="underline hover:text-accent-gold/80">
                Member Roll
              </Link>
            </p>
          </section>
        )}

        {/* Tier cards */}
        <section className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {TIERS.map((t) => {
            const isGold = t.accent === "gold";
            const borderCls = isGold
              ? "border-accent-gold/40"
              : "border-accent-violet/40";
            const glowCls = isGold
              ? "shadow-accent-gold/10"
              : "shadow-accent-violet/10";
            const accentTextCls = isGold
              ? "text-accent-gold"
              : "text-accent-violet";
            const bgGradCls = isGold
              ? "from-accent-gold/5 to-surface"
              : "from-accent-violet/5 to-surface";

            return (
              <div
                key={t.slug}
                className={`relative flex flex-col rounded-2xl border ${borderCls} bg-gradient-to-b ${bgGradCls} p-8 shadow-xl ${glowCls}`}
              >
                {t.badge && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border ${borderCls} bg-surface px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${accentTextCls}`}
                  >
                    {t.badge}
                  </div>
                )}

                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
                  {t.slug === "access" ? "Tier I" : "Tier II"}
                </p>
                <h2
                  className={`mt-1 font-display text-2xl font-bold ${accentTextCls}`}
                >
                  {t.name}
                </h2>
                <p className="mt-1 text-sm text-text-muted leading-relaxed">
                  {t.tagline}
                </p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span
                    className={`font-display text-5xl font-bold ${accentTextCls}`}
                  >
                    ${t.priceMonthly}
                  </span>
                  <span className="font-mono text-sm text-text-muted">
                    /month
                  </span>
                </div>

                <ul className="mt-6 space-y-2.5 flex-1">
                  {t.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-text-primary"
                    >
                      <span className={`mt-1 ${accentTextCls}`} aria-hidden>
                        ✦
                      </span>
                      <span className="text-text-muted leading-relaxed">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {!isActive && (
                  <div className="mt-7">
                    <TierCheckoutButton
                      tier={t.slug}
                      label={
                        notSignedIn
                          ? `Sign in to subscribe — $${t.priceMonthly}/mo`
                          : `Subscribe — $${t.priceMonthly}/mo`
                      }
                      accent={t.accent}
                      requireSignIn={notSignedIn}
                    />
                    <p className="mt-3 text-center font-mono text-[10px] text-text-muted/60">
                      Cancel anytime · Manage from your account
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Comparison matrix */}
        <section className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-text-muted/50">
              What opens at each tier
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-elevated">
                  <th className="px-5 py-3.5 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                    Feature
                  </th>
                  <th className="px-5 py-3.5 text-center font-mono text-[11px] uppercase tracking-wider text-text-muted">
                    Free
                  </th>
                  <th className="px-5 py-3.5 text-center font-mono text-[11px] uppercase tracking-wider text-accent-gold">
                    Codex Access
                  </th>
                  <th className="px-5 py-3.5 text-center font-mono text-[11px] uppercase tracking-wider text-accent-violet">
                    Full System
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {COMPARISON_ROWS.map(([feature, free, access, system]) => (
                  <tr
                    key={feature}
                    className="bg-surface transition-colors hover:bg-elevated/60"
                  >
                    <td className="px-5 py-3 text-xs text-text-primary">
                      {feature}
                    </td>
                    <Cell on={free} color="muted" />
                    <Cell on={access} color="gold" />
                    <Cell on={system} color="violet" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <MysticalDivider />

        {/* Full System preview — uses SoftGate to show what gating looks like */}
        <section className="space-y-4 max-w-3xl mx-auto">
          <div className="text-center space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet">
              /// example · full_system_surface
            </p>
            <h3 className="font-display text-lg font-bold text-text-primary">
              What a Full System view looks like
            </h3>
            <p className="text-sm text-text-muted">
              This is a live example of the Full-System-only{" "}
              <span className="text-text-primary">Insight Engine</span>. Scroll
              it — it fades into the unlock panel below.
            </p>
          </div>

          <SoftGate
            isUnlocked={false}
            tier="system"
            feature="Insight engine"
            previewHeight={260}
          >
            <div className="rounded-lg border border-border bg-surface p-6 space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-widest text-accent-violet">
                pattern · consciousness loop
              </p>
              <p className="text-sm text-text-primary leading-relaxed">
                Across the 34 transmissions tagged{" "}
                <span className="text-accent-gold">consciousness</span>, the
                cult keeps returning to a four-beat structure: challenge
                &rarr; inversion &rarr; silence &rarr; reframe. The third
                beat shows up on minute 24 &plusmn;4 in 82% of episodes.
              </p>
              <p className="text-sm text-text-primary leading-relaxed">
                Episodes where the silence beat gets cut short (under 7s)
                correlate with flamewars in the live chat &mdash; suggesting
                Psyche uses the pause as a real-time tension check.
              </p>
              <p className="text-sm text-text-primary leading-relaxed">
                Your /codex flags 6 of these episodes as &ldquo;re-listen
                candidates&rdquo; based on where you stopped, re-scrubbed, or
                bookmarked. Three appear in{" "}
                <span className="text-accent-cyan">Signal Pack I</span>.
              </p>
              <p className="text-sm text-text-primary leading-relaxed">
                Cross-reference: the same four-beat pattern shows up in 11 AI
                &amp; The Future transmissions, but compressed &mdash; the silence
                beat drops below 3s. Consciousness episodes breathe. AI
                episodes hold their breath.
              </p>
            </div>
          </SoftGate>
        </section>

        <MysticalDivider />

        {/* FAQ */}
        <section className="space-y-3 max-w-3xl mx-auto">
          <h3 className="mb-4 text-center font-display text-sm font-bold uppercase tracking-widest text-text-muted/60">
            Questions
          </h3>
          {FAQ.map(({ q, a }) => (
            <div
              key={q}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <h4 className="font-mono text-xs font-bold text-text-primary">
                {q}
              </h4>
              <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-text-muted">
                {a}
              </p>
            </div>
          ))}
        </section>

        {/* Back to free */}
        <section className="text-center">
          <Link
            href="/start-here"
            className="font-mono text-xs uppercase tracking-widest text-text-muted hover:text-accent-gold transition-colors"
          >
            ← Browse the free archive
          </Link>
        </section>
      </main>
    </>
  );
}

/** Comparison matrix — [feature, free, access, system]. */
const COMPARISON_ROWS: [string, boolean, boolean, boolean][] = [
  ["Browse episodes, guests, lore", true, true, true],
  ["Signal packs + collections", true, true, true],
  ["Lexicon + quote search (public)", true, true, true],
  ["Full episode transcripts", false, true, true],
  ["Click-to-seek timestamps", false, true, true],
  ["The Psychenomicon (full grimoire)", false, true, true],
  ["Custom flair + public Member Roll", false, true, true],
  ["Personal /codex (saved signals, notes)", false, false, true],
  ["Auto-capture listening patterns", false, false, true],
  ["Insight engine (cross-episode patterns)", false, false, true],
  ["Salon access (when opened)", false, false, true],
  ["Priority live-stream notifications", false, false, true],
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Can I upgrade from Codex Access to Full System later?",
    a: "Yes. From your account settings, switch tiers any time. Stripe handles the proration automatically.",
  },
  {
    q: "What happens to my data if I downgrade or cancel?",
    a: "Nothing is deleted. Free browsing stays active forever. If you cancel Full System, your /codex notes stay saved — they just become read-only until you resubscribe.",
  },
  {
    q: "Is /codex (the personal layer) live yet?",
    a: "Not yet — it ships in Phase 5. Full System subscribers get early access and help shape it. Codex Access subscribers can upgrade when it opens.",
  },
  {
    q: "Where does my money go?",
    a: "Hosting, transcription, infrastructure, and keeping the archive alive. No ads. No data resale. No VC math.",
  },
  {
    q: "Do I need to sign in before subscribing?",
    a: "Yes. Sign in with Google first so we can attach your subscription to your account. The button above will route you through sign-in if you aren’t signed in yet.",
  },
];

function Cell({
  on,
  color,
}: {
  on: boolean;
  color: "muted" | "gold" | "violet";
}) {
  if (!on) {
    return (
      <td className="px-5 py-3 text-center font-mono text-base">
        <span className="text-text-muted/25">—</span>
      </td>
    );
  }
  const classes =
    color === "gold"
      ? "text-accent-gold"
      : color === "violet"
      ? "text-accent-violet"
      : "text-green-500";
  return (
    <td className="px-5 py-3 text-center font-mono text-base">
      <span className={classes}>✓</span>
    </td>
  );
}
