"use client";

import { useState } from "react";
import Link from "next/link";
import { TIERS, type TierSlug } from "@/lib/subscription-tiers";
import { TierCheckoutButton } from "./tier-checkout-button";

interface PricingSectionProps {
  isActive: boolean;
  isPaying: boolean;
  currentTier: TierSlug | null | undefined;
  notSignedIn: boolean;
}

export function PricingSection({ isActive, isPaying, currentTier, notSignedIn }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="space-y-6">
      {/* ── Billing toggle ── */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center rounded-full border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className={`rounded-full px-5 py-1.5 font-mono text-[11px] transition-all ${
              !isAnnual
                ? "bg-accent-gold/20 text-accent-gold font-bold border border-accent-gold/40"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            className={`rounded-full px-5 py-1.5 font-mono text-[11px] transition-all ${
              isAnnual
                ? "bg-accent-gold/20 text-accent-gold font-bold border border-accent-gold/40"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Annual
            <span className="ml-1.5 rounded-full bg-accent-gold/15 px-1.5 py-0.5 text-[9px] text-accent-gold">
              save up to $60
            </span>
          </button>
        </div>
        {isAnnual && (
          <p className="font-mono text-[9px] text-text-muted/50 uppercase tracking-widest">
            billed once per year · cancel any time
          </p>
        )}
      </div>

      {/* ── Tier cards ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {TIERS.map((t) => {
          const isGold = t.accent === "gold";
          const borderCls = isGold ? "border-accent-gold/40" : "border-accent-violet/40";
          const glowCls = isGold ? "shadow-accent-gold/10" : "shadow-accent-violet/10";
          const accentText = isGold ? "text-accent-gold" : "text-accent-violet";
          const accentBg = isGold ? "from-accent-gold/5" : "from-accent-violet/5";
          const accentBorder = isGold ? "border-accent-gold/30" : "border-accent-violet/30";

          const displayPrice = isAnnual ? Math.round(t.priceAnnual / 12) : t.priceMonthly;

          const buttonLabel = isAnnual
            ? notSignedIn
              ? `Sign in — $${t.priceAnnual}/yr`
              : `Get ${t.role} — $${t.priceAnnual}/yr`
            : notSignedIn
              ? `Sign in to become ${t.role} — $${t.priceMonthly}/mo`
              : `Become ${t.role} — $${t.priceMonthly}/mo`;

          return (
            <div
              key={t.slug}
              id={t.slug}
              className={`relative flex flex-col rounded-2xl border ${borderCls} bg-gradient-to-b ${accentBg} to-surface p-8 shadow-xl ${glowCls}`}
            >
              {/* Annual savings badge */}
              {isAnnual && (
                <div className={`absolute -top-3 right-4 rounded-full border ${accentBorder} bg-surface px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${accentText}`}>
                  Save ${t.annualSavings}
                </div>
              )}
              {!isAnnual && t.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border ${accentBorder} bg-surface px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${accentText}`}>
                  {t.badge}
                </div>
              )}

              <div className="mb-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
                  {t.slug === "access" ? "Tier I · Initiate" : "Tier II · Architect"}
                </p>
                <h2 className={`mt-1 font-display text-2xl font-bold ${accentText}`}>{t.name}</h2>
                <p className="mt-1 font-mono text-[11px] italic text-text-muted leading-relaxed">
                  &ldquo;{t.psychologyHook}&rdquo;
                </p>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className={`font-display text-5xl font-bold ${accentText}`}>${displayPrice}</span>
                <span className="font-mono text-sm text-text-muted">/month</span>
              </div>
              {isAnnual ? (
                <p className={`mt-1 font-mono text-[10px] ${accentText}/60`}>
                  ${t.priceAnnual}/year — ${t.annualSavings} saved
                </p>
              ) : (
                <p className={`mt-1 font-mono text-[10px] ${accentText}/60`}>
                  or ${t.priceAnnual}/yr — save ${t.annualSavings}
                </p>
              )}
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
                    label={buttonLabel}
                    accent={t.accent}
                    requireSignIn={notSignedIn}
                    isAnnual={isAnnual}
                  />
                  <p className="mt-3 text-center font-mono text-[10px] text-text-muted/60">
                    Cancel anytime · Instant access · No contracts
                  </p>
                </div>
              )}
              {isPaying && currentTier !== t.slug && t.slug === "system" && (
                <div className="mt-7">
                  <TierCheckoutButton
                    tier={t.slug}
                    label={isAnnual ? `Upgrade to Architect — $${t.priceAnnual}/yr` : `Upgrade to Architect — $${t.priceMonthly}/mo`}
                    accent={t.accent}
                    requireSignIn={false}
                    isAnnual={isAnnual}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Final CTA ── */}
      {!isPaying && (
        <div className="relative overflow-hidden rounded-2xl border border-accent-gold/40 bg-gradient-to-b from-[#1a0033] via-[#0d001a] to-[#0d001a] p-10 text-center shadow-2xl shadow-accent-gold/10 max-w-3xl mx-auto mt-8">
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
              {isAnnual
                ? "Initiate+ for $96/year. Architect for $240/year."
                : "Initiate+ for $10/month. Architect for $25/month."}
              <br />
              Both open immediately. Cancel any time. Nothing is ever deleted.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <TierCheckoutButton
                tier="access"
                label={isAnnual
                  ? notSignedIn ? "Sign in — Initiate+ · $96/yr" : "Get Initiate+ — $96/yr"
                  : notSignedIn ? "Sign in to become Initiate+ — $10/mo" : "Become Initiate+ — $10/mo"
                }
                accent="gold"
                requireSignIn={notSignedIn}
                isAnnual={isAnnual}
              />
              <TierCheckoutButton
                tier="system"
                label={isAnnual
                  ? notSignedIn ? "Sign in — Architect · $240/yr" : "Get Architect — $240/yr"
                  : notSignedIn ? "Sign in to become Architect — $25/mo" : "Become Architect — $25/mo"
                }
                accent="violet"
                requireSignIn={notSignedIn}
                isAnnual={isAnnual}
              />
            </div>
            {!notSignedIn || (
              <p className="font-mono text-[10px] text-accent-cyan/60">
                <Link href="/auth/signin" className="underline hover:text-accent-cyan">Sign in with Google</Link>{" "}
                to subscribe
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
