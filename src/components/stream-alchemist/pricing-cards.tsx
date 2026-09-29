import Link from "next/link";
import { Check } from "lucide-react";
import { DONE_FOR_YOU, PLANS, type Plan } from "@/lib/stream-alchemist/pricing";
import { CheckoutLink } from "./tracking";

const PRIMARY_BTN =
  "inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 font-display text-sm font-semibold text-on-brand transition hover:brightness-110";
const SECONDARY_BTN =
  "inline-flex w-full items-center justify-center rounded-lg border border-line-strong px-4 py-2.5 font-display text-sm font-semibold text-ink transition hover:border-ink-3 hover:bg-elevated";

function PlanCard({ plan, location, featured }: { plan: Plan; location: string; featured?: boolean }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        featured ? "border-member/40 bg-gradient-to-b from-member/[0.07] to-surface" : "border-line bg-surface"
      }`}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-6 rounded-full border border-member/40 bg-void px-3 py-0.5 font-mono text-[11px] uppercase tracking-widest text-member">
          {plan.badge}
        </span>
      )}
      <h3 className="font-display text-lg font-semibold text-ink">{plan.name}</h3>
      <p className="mt-1 text-sm text-ink-3">{plan.blurb}</p>
      <p className="mt-5 font-display text-4xl font-bold text-ink">
        {plan.price}
        {plan.cadence && <span className="ml-1 text-base font-normal text-ink-3">{plan.cadence}</span>}
      </p>
      <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-2">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-evidence" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        {plan.id === "free" ? (
          <Link href={plan.href} className={SECONDARY_BTN}>
            {plan.cta}
          </Link>
        ) : (
          <CheckoutLink plan={plan} location={location} className={featured ? PRIMARY_BTN : SECONDARY_BTN} />
        )}
        {!plan.live && (
          <p className="mt-2 text-center text-[12px] text-ink-3">Checkout opens soon. This emails us to hold your spot.</p>
        )}
      </div>
    </div>
  );
}

export function PricingCards({ location, includeFree = true }: { location: string; includeFree?: boolean }) {
  const plans = includeFree ? PLANS : PLANS.filter((p) => p.id !== "free");
  return (
    <div className={`grid gap-6 ${includeFree ? "md:grid-cols-3" : "sm:grid-cols-2"}`}>
      {plans.map((p) => (
        <PlanCard key={p.id} plan={p} location={location} featured={p.id === "lifetime"} />
      ))}
    </div>
  );
}

export function DoneForYouBand({ location }: { location: string }) {
  const plan = DONE_FOR_YOU;
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-oracle/30 bg-gradient-to-r from-oracle/[0.1] via-surface to-surface p-6 sm:flex-row sm:items-center sm:p-8">
      <div className="flex-1 space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-oracle">Rather not edit at all?</p>
        <h3 className="font-display text-2xl font-bold text-ink">
          {plan.name} · {plan.price} <span className="text-base font-normal text-ink-3">{plan.cadence}</span>
        </h3>
        <p className="text-sm text-ink-2">{plan.blurb}</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-[13px] text-ink-3">
          {plan.features.map((f) => (
            <li key={f}>
              <span className="text-oracle" aria-hidden>✦ </span>
              {f}
            </li>
          ))}
        </ul>
      </div>
      <CheckoutLink
        plan={plan}
        location={location}
        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-oracle/50 px-5 py-2.5 font-display text-sm font-semibold text-oracle transition hover:bg-oracle/10"
      />
    </div>
  );
}
