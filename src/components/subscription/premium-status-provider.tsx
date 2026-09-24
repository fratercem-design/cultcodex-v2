"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TierSlug } from "@/lib/subscription-tiers";

type MembershipStatus = {
  signedIn: boolean;
  activeTier: TierSlug | null;
  status: string | null;
  periodEnd: string | null;
  isAdmin: boolean;
};

const DEFAULT_STATUS: MembershipStatus = {
  signedIn: false,
  activeTier: null,
  status: null,
  periodEnd: null,
  isAdmin: false,
};

type PremiumStatusContextValue = MembershipStatus & { loading: boolean };

const PremiumStatusContext = createContext<PremiumStatusContextValue>({
  ...DEFAULT_STATUS,
  loading: true,
});

/**
 * Resolves per-user membership state client-side via /api/premium/membership-status
 * so /premium itself can render statically (ISR) and be CDN-cached. Children default
 * to the common-visitor view (signed out, no active tier) until the fetch resolves.
 */
export function PremiumStatusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PremiumStatusContextValue>({ ...DEFAULT_STATUS, loading: true });

  useEffect(() => {
    let alive = true;
    fetch("/api/premium/membership-status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: MembershipStatus | null) => alive && setState({ ...(d ?? DEFAULT_STATUS), loading: false }))
      .catch(() => alive && setState({ ...DEFAULT_STATUS, loading: false }));
    return () => {
      alive = false;
    };
  }, []);

  return <PremiumStatusContext.Provider value={state}>{children}</PremiumStatusContext.Provider>;
}

export function usePremiumStatus() {
  return useContext(PremiumStatusContext);
}
