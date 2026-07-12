import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TIERS, type TierSlug } from "@/lib/subscription-tiers";
import { TierCheckoutButton } from "@/components/subscription/tier-checkout-button";
import { ManageSubscription } from "@/components/subscription/manage-subscription";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Join the Archive — Choose Your Role",
  description: "Initiate+ ($10/mo) unlocks the intelligence layer. Oracle ($25/mo) puts you inside it.",
  path: "/premium",
});

// Ritual verb per tier — the dossier's rule: the CTA is never "Buy."
const VERB: Record<TierSlug, string> = {
  access: "Take the vow of",
  system: "Ascend to",
};

export default async function PremiumPage() {
  const user = await getCurrentUser();

  let activeTier: TierSlug | null = null;
  let status: string | null = null;
  let periodEnd: Date | null = null;
  let isAdmin = false;

  if (user) {
    const dbUser = await prisma.codexUser.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        currentPeriodEnd: true,
        isLifetimeMember: true,
      },
    }).catch(() => null);

    if (dbUser) {
      isAdmin = dbUser.role === "admin";
      status = dbUser.subscriptionStatus;
      periodEnd = dbUser.currentPeriodEnd;
      const active =
        dbUser.isLifetimeMember ||
        (dbUser.subscriptionStatus === "active" &&
          !!dbUser.currentPeriodEnd &&
          dbUser.currentPeriodEnd > new Date());
      if (active && (dbUser.subscriptionTier === "access" || dbUser.subscriptionTier === "system")) {
        activeTier = dbUser.subscriptionTier;
      }
    }
  }

  return (
    <main id="main-content" className="mx-auto max-w-5xl px-4 py-16 space-y-14">
      {/* ── Threshold header ── */}
      <div className="text-center space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-accent-gold/60">
          ✦ the threshold of initiation ✦
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
          Two doors, past the archive.
        </h1>
        <p className="mx-auto max-w-lg font-serif text-sm italic leading-relaxed text-text-muted">
          People don&rsquo;t upgrade for features here — they upgrade to change their role.
          Pick the one that matches what you came here to become.
        </p>
      </div>

      {(activeTier || isAdmin) && (
        <div className="mx-auto max-w-sm">
          <ManageSubscription
            status={isAdmin ? null : status}
            periodEnd={periodEnd ? periodEnd.toISOString() : null}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* ── Tier cards ── */}
      <div className="grid gap-6 sm:grid-cols-2">
        {TIERS.map((tier) => {
          const isCurrent = activeTier === tier.slug;
          const accentText = tier.accent === "violet" ? "text-accent-violet" : "text-accent-gold";
          const accentBorder = tier.accent === "violet" ? "border-accent-violet/25" : "border-accent-gold/25";
          const accentBg = tier.accent === "violet" ? "from-accent-violet/5" : "from-accent-gold/5";

          return (
            <div
              key={tier.slug}
              className={`relative rounded-2xl border ${accentBorder} bg-gradient-to-b ${accentBg} to-surface p-7 space-y-5 flex flex-col`}
            >
              {tier.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border ${accentBorder} bg-void px-3 py-1 font-mono text-[9px] uppercase tracking-widest ${accentText}`}
                >
                  {tier.badge}
                </span>
              )}

              <div className="space-y-2 text-center">
                <p className={`font-mono text-[10px] uppercase tracking-[0.4em] ${accentText}/70`}>
                  {tier.role}
                </p>
                <h2 className="font-display text-2xl font-bold text-text-primary">{tier.name}</h2>
                <p className="font-serif text-sm italic text-text-muted">{tier.tagline}</p>
              </div>

              <p className={`text-center font-mono text-[11px] leading-relaxed ${accentText}/80`}>
                &ldquo;{tier.psychologyHook}&rdquo;
              </p>

              <div className="flex-1 space-y-2">
                {tier.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <span className={`mt-0.5 shrink-0 ${accentText}/50`}>◈</span>
                    <p className="font-mono text-[11px] leading-snug text-text-muted">{f}</p>
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <div
                  className={`rounded-lg border ${accentBorder} bg-void/40 px-4 py-3 text-center font-mono text-xs font-bold ${accentText}`}
                >
                  ✦ Your current threshold ✦
                </div>
              ) : (
                <TierCheckoutButton
                  tier={tier.slug}
                  role={tier.role}
                  priceMonthly={tier.priceMonthly}
                  priceAnnual={tier.priceAnnual}
                  accent={tier.accent}
                  requireSignIn={!user}
                  verb={VERB[tier.slug]}
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center font-serif text-xs italic text-text-muted/50">
        Pricing is not the wall. Framing is — cancel any time, instant access, no contracts.
      </p>

      <p className="text-center font-mono text-[10px] text-text-muted/40">
        Not ready yet?{" "}
        <Link href="/start-here" className="text-accent-gold/60 hover:text-accent-gold transition-colors">
          Start here
        </Link>{" "}
        or{" "}
        <Link href="/oracle" className="text-accent-violet/60 hover:text-accent-violet transition-colors">
          ask the Oracle 3 free questions
        </Link>
        .
      </p>
    </main>
  );
}
