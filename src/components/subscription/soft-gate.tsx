/**
 * SoftGate — Reusable subscription-gate wrapper.
 *
 * Shows the first N children (or a "preview" slot) to everyone, then
 * blurs/fades the rest behind a CTA that routes to /premium?tier=<slug>.
 * Unlike a hard 403, the user always sees *something* — enough to know
 * what they'd be unlocking.
 *
 * Usage:
 *   <SoftGate isUnlocked={hasTier} tier="access" feature="Full transcripts">
 *     <TranscriptBody segments={segments} />
 *   </SoftGate>
 *
 * The caller decides `isUnlocked` server-side (e.g. via tierUnlocks()).
 * When unlocked, children render as-is with no wrapper overhead.
 */
import Link from "next/link";
import type { TierSlug } from "@/lib/subscription-tiers";
import { getTier } from "@/lib/subscription-tiers";

interface SoftGateProps {
  /** Is the current viewer permitted to see the full content? */
  isUnlocked: boolean;
  /** Which tier unlocks this surface. Used in the CTA copy. */
  tier: TierSlug;
  /** Human label of what's being gated, e.g. "Full transcripts". */
  feature: string;
  /** What shows behind the gate (blurred/faded preview). */
  children: React.ReactNode;
  /** Optional teaser that always renders above the gate, even when locked. */
  preview?: React.ReactNode;
  /** How much of the children to show before fading out (CSS mask). */
  previewHeight?: number;
}

export function SoftGate({
  isUnlocked,
  tier,
  feature,
  children,
  preview,
  previewHeight = 220,
}: SoftGateProps) {
  // Unlocked: just render the content. Zero overhead.
  if (isUnlocked) return <>{children}</>;

  const t = getTier(tier);
  const accentTextCls =
    t.accent === "violet" ? "text-accent-violet" : "text-accent-gold";
  const accentBorderCls =
    t.accent === "violet" ? "border-accent-violet/40" : "border-accent-gold/40";
  const accentBgCls =
    t.accent === "violet"
      ? "bg-accent-violet/10 hover:bg-accent-violet/20"
      : "bg-accent-gold/10 hover:bg-accent-gold/20";

  return (
    <div className="relative">
      {preview && <div className="mb-4">{preview}</div>}

      {/* Blurred preview of the gated children */}
      <div
        className="relative overflow-hidden rounded-t-lg"
        style={{
          maxHeight: `${previewHeight}px`,
          maskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
        }}
        aria-hidden="true"
      >
        <div className="pointer-events-none select-none blur-sm opacity-50 saturate-50">
          {children}
        </div>
        {/* Lock icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${accentBorderCls} bg-surface/80 shadow-lg backdrop-blur-sm`}>
            <span className={`text-lg ${accentTextCls}`} aria-hidden>🔒</span>
          </div>
        </div>
      </div>

      {/* Unlock panel */}
      <div className={`relative -mt-2 rounded-b-lg border ${accentBorderCls} bg-gradient-to-b from-surface to-elevated p-6 text-center space-y-3 shadow-xl`}>
        <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${accentTextCls}`}>
          /// {t.role}_only
        </p>
        <h3 className={`font-display text-lg font-bold ${accentTextCls}`}>
          {t.role}s see this. Observers don&rsquo;t.
        </h3>
        <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
          <span className="text-text-primary font-medium">{feature}</span> unlocks on {t.name} — ${t.priceMonthly}/mo.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-1">
          <Link
            href={`/premium#${t.slug}`}
            className={`inline-flex items-center gap-2 rounded-lg border ${accentBorderCls} ${accentBgCls} px-5 py-2 font-mono text-xs font-bold ${accentTextCls} transition-all hover:shadow-lg`}
          >
            Become {t.role} — ${t.priceMonthly}/mo <span aria-hidden>→</span>
          </Link>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2 font-mono text-xs text-text-muted hover:text-text-primary hover:border-text-muted/40 transition-colors"
          >
            See all tiers
          </Link>
        </div>
      </div>
    </div>
  );
}
