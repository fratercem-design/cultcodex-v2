"use client";

import { TierCheckoutButton } from "@/components/subscription/tier-checkout-button";
import { usePremiumStatus } from "@/components/subscription/premium-status-provider";
import type { TierSlug } from "@/lib/subscription-tiers";

interface PremiumTierActionProps {
  tier: TierSlug;
  role: string;
  priceMonthly: number;
  priceAnnual: number;
  accent?: "gold" | "violet";
  verb: string;
}

export function PremiumTierAction({ tier, role, priceMonthly, priceAnnual, accent = "gold", verb }: PremiumTierActionProps) {
  const { loading, activeTier, signedIn } = usePremiumStatus();
  const isCurrent = !loading && activeTier === tier;

  if (isCurrent) {
    const accentText = accent === "violet" ? "text-accent-violet" : "text-accent-gold";
    const accentBorder = accent === "violet" ? "border-accent-violet/25" : "border-accent-gold/25";
    return (
      <div className={`rounded-lg border ${accentBorder} bg-void/40 px-4 py-3 text-center font-mono text-xs font-bold ${accentText}`}>
        ✦ Your current threshold ✦
      </div>
    );
  }

  return (
    <TierCheckoutButton
      tier={tier}
      role={role}
      priceMonthly={priceMonthly}
      priceAnnual={priceAnnual}
      accent={accent}
      requireSignIn={!loading && !signedIn}
      verb={verb}
    />
  );
}
