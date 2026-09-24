"use client";

import { ManageSubscription } from "@/components/subscription/manage-subscription";
import { usePremiumStatus } from "@/components/subscription/premium-status-provider";

export function PremiumManagePanel() {
  const { loading, activeTier, isAdmin, status, periodEnd } = usePremiumStatus();

  if (loading || !(activeTier || isAdmin)) return null;

  return (
    <div className="mx-auto max-w-sm">
      <ManageSubscription status={isAdmin ? null : status} periodEnd={periodEnd} isAdmin={isAdmin} />
    </div>
  );
}
