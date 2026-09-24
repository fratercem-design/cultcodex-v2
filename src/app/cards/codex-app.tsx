"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Rarity } from "@/generated/prisma/client";
import { RARITY_ORDER } from "@/lib/cards/rarity";
import { OBTAIN_LABEL } from "@/lib/cards/codex/catalog";
import type { ObtainMethod, Palette } from "@/lib/cards/codex/types";
import { CodexCard, RARITY_COLOR, type CodexCardData } from "@/components/cards/codex/codex-card";
import { PackArt } from "@/components/cards/codex/pack-art";
import { PackRitual } from "@/components/cards/codex/pack-ritual";
import { SecretSigil } from "@/components/cards/codex/secret-sigil";
import { requestTrialCheck, type UnsealedCard } from "@/components/cards/codex/unlock-events";
import "./codex-page.css";

type Owned = { quantity: number; isFoil: boolean; isNew: boolean };

export interface CodexEntry {
  card: CodexCardData;
  obtain: ObtainMethod;
  clue: string;
  href?: string;
  progress: { current: number; target: number } | null;
  unit?: string;
  owned: Owned | null;
}

type Filter = "all" | "owned" | "sealed" | ObtainMethod;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "owned", label: "Found" },
  { id: "sealed", label: "Sealed" },
  { id: "pack", label: "Packs" },
  { id: "quest", label: "Trials" },
  { id: "secret", label: "Secrets" },
];

const HOW: Record<ObtainMethod, string> = {
  pack: "Drops from this season's packs.",
  quest: "A Trial card. Do the thing in the clue and it's yours, no purchase needed.",
  secret: "Hidden somewhere on CultCodex. Find it and click it.",
  signup: "Only in the free Initiation Pack, one per account.",
};

export function CodexApp({
  season,
  entries,
  legacy,
  signedIn,
  initiationClaimed,
  balance,
  justUnsealed,
}: {
  season: { number: number; numeral: string; name: string; tagline: string; daysLeft: number; palette: Palette };
  entries: CodexEntry[];
  legacy: { card: CodexCardData; owned: Owned }[];
  signedIn: boolean;
  initiationClaimed: boolean;
  balance: number;
  justUnsealed: UnsealedCard[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [focus, setFocus] = useState<CodexEntry | null>(null);
  const [ritual, setRitual] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const counts = useMemo(() => {
    const by = (m: ObtainMethod) => {
      const all = entries.filter((e) => e.obtain === m);
      return { owned: all.filter((e) => e.owned).length, total: all.length };
    };
    return {
      owned: entries.filter((e) => e.owned).length,
      total: entries.length,
      pack: by("pack"), quest: by("quest"), secret: by("secret"), signup: by("signup"),
    };
  }, [entries]);

  const shown = entries.filter((e) =>
    filter === "all" ? true : filter === "owned" ? !!e.owned : filter === "sealed" ? !e.owned : e.obtain === filter,
  );
  const pct = counts.total ? Math.round((counts.owned / counts.total) * 100) : 0;
  const signupCard = entries.find((e) => e.obtain === "signup");

  return (
    <div className="cxp">
      {/* ── Season hero ─────────────────────────────────────────────── */}
      <section className="cxp-hero">
        <div className="cxp-seal">
          <SecretSigil code="seventh-knock" knocks={7} subtle={false} glyph={season.numeral} label={`Season ${season.numeral} seal`} className="cxp-seal-btn" />
        </div>
        <div className="cxp-hero-text">
          <p className="cxp-kicker">THE CODEX · SEASON {season.numeral}{season.daysLeft > 0 ? ` · ENDS IN ${season.daysLeft} DAYS` : ""}</p>
          <h1 className="cxp-title">{season.name}</h1>
          <p className="cxp-tagline">{season.tagline}</p>
          <div className="cxp-progress" aria-label={`${counts.owned} of ${counts.total} cards found`}>
            <div className="cxp-progress-bar" style={{ width: `${pct}%` }} />
          </div>
          <div className="cxp-tally">
            <strong>{counts.owned}</strong>/{counts.total} found
            <span>Packs {counts.pack.owned}/{counts.pack.total}</span>
            <span>Trials {counts.quest.owned}/{counts.quest.total}</span>
            <span>Secrets {counts.secret.owned}/{counts.secret.total}</span>
            <span>Initiation {counts.signup.owned}/{counts.signup.total}</span>
          </div>
          <div className="cxp-actions">
            <Link href="/cards/packs" className="cx-btn cx-btn-primary">Pack Store{signedIn ? ` · ${balance.toLocaleString("en-US")} credits` : ""}</Link>
            <Link href="/cards/decks" className="cx-btn">Decks</Link>
            <Link href="/cards/reading" className="cx-btn">Readings</Link>
          </div>
        </div>
      </section>

      {/* ── Initiation Pack ─────────────────────────────────────────── */}
      {!initiationClaimed && (
        <section className="cxp-initiation">
          <div className="cxp-initiation-pack"><PackArt name="Initiation" theme="gold" seasonNumeral={season.numeral} count={5} /></div>
          <div className="cxp-initiation-text">
            <p className="cxp-kicker">FREE · ONE PER ACCOUNT</p>
            <h2>Your Initiation Pack is waiting</h2>
            <p>
              Five cards, on the house. One of them is <strong>{signupCard?.card.title ?? "a Legendary"}</strong>, a Legendary foil that
              only exists in Season {season.numeral} Initiation Packs. When the season ends, it stops being given out. You also get
              one guaranteed Anomaly or better, and 100 Signal Credits for your first booster.
            </p>
            {signedIn ? (
              <button type="button" className="cx-btn cx-btn-primary" onClick={() => setRitual(true)}>Open it now</button>
            ) : (
              <Link href={`/auth/signin?callbackUrl=${encodeURIComponent("/cards")}`} className="cx-btn cx-btn-primary">Sign in to claim it</Link>
            )}
          </div>
          {signupCard && (
            <div className="cxp-initiation-card">
              <CodexCard card={signupCard.card} isFoil />
            </div>
          )}
        </section>
      )}

      {/* ── Unsealed since last visit ───────────────────────────────── */}
      {justUnsealed.length > 0 && (
        <section className="cxp-unsealed" role="status">
          <p className="cxp-kicker">✶ UNSEALED SINCE YOUR LAST VISIT</p>
          <p>
            {justUnsealed.map((c, i) => (
              <span key={c.id} style={{ color: RARITY_COLOR[c.rarity] }}>{i > 0 ? " · " : ""}{c.title}</span>
            ))}
          </p>
        </section>
      )}

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="cxp-filters" role="tablist" aria-label="Filter cards">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className="cxp-chip" data-active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Grid ────────────────────────────────────────────────────── */}
      <div className="cxp-grid">
        {shown.map((e) => (
          <CodexCard
            key={e.card.slug}
            card={e.card}
            state={e.owned ? "owned" : "sealed"}
            isFoil={e.owned?.isFoil}
            isNew={e.owned?.isNew}
            quantity={e.owned?.quantity}
            clue={e.clue}
            progress={e.progress}
            onClick={() => setFocus(e)}
          />
        ))}
      </div>
      {shown.length === 0 && <p className="cxp-empty">Nothing here yet.</p>}

      {!signedIn && (
        <p className="cxp-guest">
          <Link href={`/auth/signin?callbackUrl=${encodeURIComponent("/cards")}`}>Sign in</Link> to start collecting. Trials count things you&apos;ve already done, so regulars may find a few cards waiting.
        </p>
      )}

      {/* ── Archive (pre-season cards) ─────────────────────────────── */}
      {legacy.length > 0 && (
        <section className="cxp-archive">
          <button type="button" className="cxp-archive-toggle" onClick={() => setShowArchive((s) => !s)} aria-expanded={showArchive}>
            {showArchive ? "▾" : "▸"} The Archive · {legacy.length} cards from before the seasons
          </button>
          {showArchive && (
            <div className="cxp-grid">
              {[...legacy]
                .sort((a, b) => RARITY_ORDER[b.card.rarity as Rarity] - RARITY_ORDER[a.card.rarity as Rarity])
                .map((l) => (
                  <CodexCard key={l.card.slug} card={l.card} isFoil={l.owned.isFoil} quantity={l.owned.quantity} />
                ))}
            </div>
          )}
        </section>
      )}

      {/* ── Focus view ──────────────────────────────────────────────── */}
      {focus && (
        <div className="cxp-focus" role="dialog" aria-modal="true" aria-label={focus.owned ? focus.card.title : "Sealed card"} onClick={() => setFocus(null)}>
          <div className="cxp-focus-inner" onClick={(ev) => ev.stopPropagation()}>
            <div className="cxp-focus-card">
              <CodexCard
                card={focus.card}
                state={focus.owned ? "owned" : "sealed"}
                isFoil={focus.owned?.isFoil}
                clue={focus.clue}
                progress={focus.progress}
              />
            </div>
            <div className="cxp-focus-info">
              <p className="cxp-kicker" style={{ color: RARITY_COLOR[focus.card.rarity] }}>
                {focus.card.rarity} · {OBTAIN_LABEL[focus.obtain]}
              </p>
              <h2>{focus.owned ? focus.card.title : "Sealed"}</h2>
              {focus.owned ? (
                <>
                  <p className="cxp-focus-flavour">{focus.card.flavourText}</p>
                  {focus.card.abilities && focus.card.abilities.length > 0 && (
                    <p className="cxp-focus-abilities">{focus.card.abilities.map((a) => <span key={a}>{a}</span>)}</p>
                  )}
                  <p className="cxp-focus-meta">You hold {focus.owned.quantity}{focus.owned.isFoil ? " · includes a foil" : ""}.</p>
                </>
              ) : (
                <>
                  <p className="cxp-focus-clue">✶ {focus.clue}</p>
                  {focus.progress && (
                    <p className="cxp-focus-meta">Progress: {focus.progress.current} / {focus.progress.target} {focus.unit}</p>
                  )}
                  <p className="cxp-focus-meta">{HOW[focus.obtain]}</p>
                  {focus.href && focus.obtain !== "secret" && (
                    <Link href={focus.href} className="cx-btn cx-btn-primary">{focus.obtain === "pack" ? "Go to the Pack Store" : "Go there"}</Link>
                  )}
                </>
              )}
              <button type="button" className="cx-btn" onClick={() => setFocus(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {ritual && (
        <PackRitual
          title="Initiation"
          theme="gold"
          count={5}
          endpoint="/api/cards/initiation"
          onClose={(opened) => {
            setRitual(false);
            if (opened) { requestTrialCheck(); router.refresh(); }
          }}
        />
      )}
    </div>
  );
}
