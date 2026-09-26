"use client";

import { useEffect } from "react";
import { track, type StreamAlchemistEvent } from "@/lib/stream-alchemist/analytics";
import type { Plan } from "@/lib/stream-alchemist/pricing";

export function TrackOnMount({ event }: { event: StreamAlchemistEvent }) {
  useEffect(() => {
    track(event);
  }, [event]);
  return null;
}

export function CheckoutLink({
  plan,
  location,
  className,
  children,
}: {
  plan: Plan;
  location: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={plan.href}
      className={className}
      onClick={() => track("sa_checkout_clicked", { plan: plan.id, location, live: plan.live })}
    >
      {children ?? plan.cta}
    </a>
  );
}
