/**
 * /premium — Identity ladder: Observer → Initiate+ → Oracle
 *
 * Conversion psychology: people don't upgrade for features.
 * They upgrade to change their role in the system.
 */
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { getArchiveStats } from "@/lib/queries/stats";
import { prisma } from "@/lib/db";
import { TIERS } from "@/lib/subscription-tiers";
import { TierCheckoutButton } from "@/components/subscription/tier-checkout-button";
import { ManageSubscription } from "@/components/subscription/manage-subscription";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Join the Archive — Choose Your Role",
  description:
    "Observer. Initiate. Oracle. Three roles in the system. Initiate+ ($10/mo) unlocks the archive. Oracle ($25/mo) puts you inside it.",
  path: "/premium",
});

async function getMemberCount() {
  return prisma.codexUser.count({
    where: { OR: [{ role: "admin" }, { subscriptionStatus: "active" }] },
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
  const currentTier = subStatus?.tier;
  const notSignedIn = !user;

  return (
    <>
      <PageHero
        title="CHOOSE YOUR ROLE"
        subtitle="Three positions in the system. Pick the depth you're ready for."
        backgroundImage="/hero-bg.jpg"
      />

      <main id="main-content" className="mx-auto max-w-6xl px-4 py-12 space-y-16">

        {/* ── Already subscribed ── */}
        {isActive && subStatus && (
          <section className="max-w-3xl mx-auto">
            <ManageSubscription
              status={subStatus.status}
              periodEnd={subStatus.periodEnd}
              isAdmin={subStatus.isAdmin}
            />
            <p className="mt-4 text-center font-mono text-xs text-accent-gold">
              {currentTier === "system"
                ? "You are Oracle. The system is fully open."
                : "You are Initiate. Upgrade to Oracle for the inner layer."}
              {" · "}
              <Link href="/episodes" className="underline hover:text-accent-gold/80">Browse</Link>
              {" · "}
              <Link href="/members" className="underline hover:text-accent-gold/80">Members</Link>
            </p>
          </section>
        )}

        {/* ── Identity ladder explainer ── */}
        <section className="max-w-4xl mx-auto">
          <p className="mb-8 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/60">
            /// the_ladder_of_identity
          </p>
          <div className="grid gap-px md:grid-cols-3 overflow-hidden rounded-2xl border border-border">
            {[
              {
                role: "Observer",
                price: "Free",
                hook: "I can see something is here… but I don't fully understand it yet.",
                color: "text-text-muted",
                bg: "bg-surface",
                border: "",
                bullets: [
                  "Browse all episodes + summaries",
                  "Guest profiles and bios",
                  "Quotes, topics, lore browsing",
                  "Basic lexicon and search",
                ],
                active: !isActive,
              },
              {
                role: "Initiate",
                price: "$10/mo",
                hook: "Now I can actually understand what I'm watching.",
                color: "text-accent-gold",
                bg: "bg-surface",
                border: "border-t-2 border-t-accent-gold",
                bullets: [
                  "Full transcripts + click-to-seek",
                  "Decode Mode — AI panel breakdowns",
                  "Advanced search by archetype",
                  "Personal Codex (save + annotate)",
                  "Key Moments timeline per episode",
                  "Members-only curated playlists",
                ],
                active: isActive && currentTier === "access",
              },
              {
                role: "Oracle",
                price: "$25/mo",
                hook: "I am inside the system. Not just watching it.",
                color: "text-accent-violet",
                bg: "bg-surface",
                border: "border-t-2 border-t-accent-violet",
                bullets: [
                  "Everything in Initiate+",
                  "Personal codex page on the archive",
                  "Vote on guests + topics",
                  "Red Room Sessions + raw footage",
                  "Relationship Map of the Psycheverse",
                  "Named Oracle role + contributor credit",
                ],
                active: isActive && currentTier === "system",
              },
            ].map((tier) => (
              <div key={tier.role} className={`${tier.bg} ${tier.border} p-7 space-y-4`}>
                <div>
                  <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${tier.color} opacity-70`}>
                    Role
                  </p>
                  <h2 className={`font-display text-2xl font-bold ${tier.color} mt-1`}>
                    {tier.role}
                  </h2>
                  <p className={`font-mono text-sm font-bold mt-1 ${tier.color}`}>{tier.price}</p>
                </div>
                <p className="font-mono text-[11px] italic text-text-muted leading-relaxed">
                  &ldquo;{tier.hook}&rdquo;
                </p>
                <ul className="space-y-2">
                  {tier.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 font-mono text-[11px] text-text-muted">
                      <span className={`mt-0.5 ${tier.color}`}>✦</span>
                      {b}
                    </li>
                  ))}
                </ul>
                {tier.active && (
                  <p className={`font-mono text-[10px] uppercase tracking-widest ${tier.color}`}>
                    ✓ Your current role
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <MysticalDivider />

        {/* ── Tier cards with checkout ── */}
        <section className="space-y-6 max-w-5xl mx-auto">
          <div className="text-center space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/50">
              /// choose_your_depth
            </p>
            <p className="font-display text-lg text-text-primary">
              Both tiers open immediately. Cancel any time.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {TIERS.map((t) => {
              const isGold = t.accent === "gold";
              const borderCls = isGold ? "border-accent-gold/40" : "border-accent-violet/40";
              const glowCls = isGold ? "shadow-accent-gold/10" : "shadow-accent-violet/10";
              const accentText = isGold ? "text-accent-gold" : "text-accent-violet";
              const accentBg = isGold ? "from-accent-gold/5" : "from-accent-violet/5";
              const accentBorder = isGold ? "border-accent-gold/30" : "border-accent-violet/30";

              return (
                <div
                  key={t.slug}
                  id={t.slug}
                  className={`relative flex flex-col rounded-2xl border ${borderCls} bg-gradient-to-b ${accentBg} to-surface p-8 shadow-xl ${glowCls}`}
                >
                  {t.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border ${accentBorder} bg-surface px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${accentText}`}>
                      {t.badge}
                    </div>
                  )}

                  <div className="mb-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
                      {t.slug === "access" ? "Tier I · Initiate" : "Tier II · Oracle"}
                    </p>
                    <h2 className={`mt-1 font-display text-2xl font-bold ${accentText}`}>{t.name}</h2>
                    <p className="mt-1 font-mono text-[11px] italic text-text-muted leading-relaxed">
                      &ldquo;{t.psychologyHook}&rdquo;
                    </p>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className={`font-display text-5xl font-bold ${accentText}`}>${t.priceMonthly}</span>
                    <span className="font-mono text-sm text-text-muted">/month</span>
                  </div>
                  <p className={`mt-1 font-mono text-[10px] ${accentText}/60`}>{t.tagline}</p>

                  <ul className="mt-6 space-y-2.5 flex-1">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <span className={`mt-1 ${accentText}`} aria-hidden>✦</span>
                        <span className="text-text-muted leading-relaxed font-mono text-[11px]">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {!isActive && (
                    <div className="mt-7">
                      <TierCheckoutButton
                        tier={t.slug}
                        label={
                          notSignedIn
                            ? `Sign in to become ${t.role} — $${t.priceMonthly}/mo`
                            : `Become ${t.role} — $${t.priceMonthly}/mo`
                        }
                        accent={t.accent}
                        requireSignIn={notSignedIn}
                      />
                      <p className="mt-3 text-center font-mono text-[10px] text-text-muted/60">
                        Cancel anytime · Instant access · No contracts
                      </p>
                    </div>
                  )}
                  {isActive && currentTier !== t.slug && t.slug === "system" && (
                    <div className="mt-7">
                      <TierCheckoutButton
                        tier={t.slug}
                        label={`Upgrade to Oracle — $${t.priceMonthly}/mo`}
                        accent={t.accent}
                        requireSignIn={false}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Archive weight ── */}
        <section className="max-w-4xl mx-auto rounded-2xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface p-8 text-center space-y-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60">
            /// what you&apos;re entering
          </p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { n: stats.episodes.toLocaleString(), label: "Transmissions", color: "text-accent-gold" },
              { n: stats.segments.toLocaleString(), label: "Transcript Lines", color: "text-accent-cyan" },
              { n: stats.people.toLocaleString(), label: "Profiled Souls", color: "text-accent-gold" },
              { n: stats.loreEntries.toLocaleString(), label: "Lore Entries", color: "text-accent-cyan" },
            ].map((s) => (
              <div key={s.label}>
                <p className={`font-display text-3xl font-bold ${s.color}`}>{s.n}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="font-mono text-xs text-text-muted">
            {stats.totalHours.toLocaleString()}+ hours of recorded transmissions ·{" "}
            <span className="text-accent-gold font-bold">{memberCount} members</span> already initiated
          </p>
        </section>

        <MysticalDivider />

        {/* ── Full comparison matrix ── */}
        <section className="space-y-4 max-w-4xl mx-auto">
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/50">
            /// what opens at each level
          </p>
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-elevated">
                  <th className="px-5 py-3.5 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">Feature</th>
                  <th className="px-5 py-3.5 text-center font-mono text-[11px] uppercase tracking-wider text-text-muted">Observer</th>
                  <th className="px-5 py-3.5 text-center font-mono text-[11px] uppercase tracking-wider text-accent-gold">Initiate+</th>
                  <th className="px-5 py-3.5 text-center font-mono text-[11px] uppercase tracking-wider text-accent-violet">Oracle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {COMPARISON_ROWS.map(([feature, free, access, system]) => (
                  <tr key={feature} className="bg-surface transition-colors hover:bg-elevated/60">
                    <td className="px-5 py-3 font-mono text-[11px] text-text-primary">{feature}</td>
                    <Cell on={free} color="muted" />
                    <Cell on={access} color="gold" />
                    <Cell on={system} color="violet" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Psychological triggers ── */}
        <section className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
          {[
            {
              icon: "🔍",
              title: "The archive has patterns you can't see yet.",
              body: "1,500+ episodes. Recurring guests. Evolving dynamics. The Initiate layer surfaces the structure underneath.",
              color: "border-accent-gold/20",
            },
            {
              icon: "🧠",
              title: "Every guest has a profile. Not just a bio.",
              body: "Behavior patterns. Recurring tactics. Psychological signatures. The Oracle layer builds intelligence files — not just summaries.",
              color: "border-accent-violet/20",
            },
            {
              icon: "👁",
              title: "The system responds to Oracles.",
              body: "Vote on what gets investigated next. Submit deep-dive requests. Your signal shapes what gets analyzed.",
              color: "border-accent-violet/20",
            },
          ].map((c) => (
            <div key={c.title} className={`rounded-xl border ${c.color} bg-surface p-6 space-y-3`}>
              <p className="text-2xl">{c.icon}</p>
              <h3 className="font-display text-sm font-bold text-text-primary leading-snug">{c.title}</h3>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">{c.body}</p>
            </div>
          ))}
        </section>

        {/* ── FAQ ── */}
        <section className="space-y-3 max-w-3xl mx-auto">
          <h3 className="mb-4 text-center font-display text-sm font-bold uppercase tracking-widest text-text-muted/60">Questions</h3>
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent-gold/20">
              <h4 className="font-mono text-xs font-bold text-text-primary">{q}</h4>
              <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-text-muted">{a}</p>
            </div>
          ))}
        </section>

        {/* ── Final CTA ── */}
        {!isActive && (
          <section className="relative overflow-hidden rounded-2xl border border-accent-gold/40 bg-gradient-to-b from-[#1a0033] via-[#0d001a] to-[#0d001a] p-10 text-center shadow-2xl shadow-accent-gold/10 max-w-3xl mx-auto">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-16 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-accent-gold/10 blur-3xl" />
            </div>
            <div className="relative space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-accent-cyan/70">
                ✦ &nbsp; your role is waiting &nbsp; ✦
              </p>
              <h3 className="font-display text-3xl font-bold text-accent-gold sm:text-4xl" style={{ textShadow: "0 0 30px rgba(212,175,55,0.4)" }}>
                Stop Observing.
                <br />
                <span className="text-white">Start Initiating.</span>
              </h3>
              <p className="font-mono text-xs text-text-muted max-w-sm mx-auto">
                Initiate+ opens for $10/month. Oracle opens for $25/month.<br />
                Both include instant access. Cancel any time.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <TierCheckoutButton
                  tier="access"
                  label={notSignedIn ? "Sign in to become Initiate+ — $10/mo" : "Become Initiate+ — $10/mo"}
                  accent="gold"
                  requireSignIn={notSignedIn}
                />
                <TierCheckoutButton
                  tier="system"
                  label={notSignedIn ? "Sign in to become Oracle — $25/mo" : "Become Oracle — $25/mo"}
                  accent="violet"
                  requireSignIn={notSignedIn}
                />
              </div>
              {!user && (
                <p className="font-mono text-[10px] text-accent-cyan/60">
                  <Link href="/auth/signin" className="underline hover:text-accent-cyan">Sign in with Google</Link>{" "}
                  to subscribe
                </p>
              )}
            </div>
          </section>
        )}

        <section className="text-center">
          <Link href="/start-here" className="font-mono text-xs uppercase tracking-widest text-text-muted hover:text-accent-gold transition-colors">
            ← Browse as Observer first
          </Link>
        </section>
      </main>
    </>
  );
}

const COMPARISON_ROWS: [string, boolean, boolean, boolean][] = [
  ["Browse episodes, guests, lore", true, true, true],
  ["Basic search + quotes + topics", true, true, true],
  ["Full episode transcripts", false, true, true],
  ["Click-to-seek timestamps", false, true, true],
  ["Decode Mode (AI panel breakdowns)", false, true, true],
  ["Advanced search by archetype + behavior", false, true, true],
  ["Key Moments timeline per episode", false, true, true],
  ["Personal Codex — save signals, episodes, quotes", false, true, true],
  ["Members-only curated playlists", false, true, true],
  ["Custom Initiate badge", false, true, true],
  ["Personal codex page on the archive", false, false, true],
  ["Vote on guests, topics, experiments", false, false, true],
  ["Submit investigations", false, false, true],
  ["Red Room Sessions + raw segments", false, false, true],
  ["Relationship Map of the Psycheverse", false, false, true],
  ["Guest Intelligence Files", false, false, true],
  ["Named Oracle role + contributor credit", false, false, true],
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What's the difference between Observer, Initiate+, and Oracle?",
    a: "Observer is free — you can see the whole archive but can't go deep. Initiate+ ($10/mo) unlocks transcripts, Decode Mode, personal Codex, and the intelligence layer. Oracle ($25/mo) puts you inside the system — you influence what gets investigated, access raw footage, and hold a named role.",
  },
  {
    q: "Can I upgrade from Initiate+ to Oracle later?",
    a: "Yes. Upgrade any time from your account settings. Stripe handles the proration automatically — you only pay the difference.",
  },
  {
    q: "When does Oracle content (votes, investigations, Red Room) go live?",
    a: "Some features are live now; others roll out over the next phase. Oracle subscribers shape what's built and get first access as each surface opens.",
  },
  {
    q: "What happens if I cancel?",
    a: "Nothing is deleted. You keep Observer access forever. Your saved Codex content stays — it just becomes read-only until you resubscribe.",
  },
  {
    q: "Do I need to sign in before subscribing?",
    a: "Yes — sign in with Google first so we can attach your subscription to your account. The buttons above will route you through sign-in if you're not in.",
  },
];

function Cell({ on, color }: { on: boolean; color: "muted" | "gold" | "violet" }) {
  if (!on) return <td className="px-5 py-3 text-center font-mono text-base"><span className="text-text-muted/25">—</span></td>;
  const cls = color === "gold" ? "text-accent-gold" : color === "violet" ? "text-accent-violet" : "text-green-500";
  return <td className="px-5 py-3 text-center font-mono text-base"><span className={cls}>✓</span></td>;
}
