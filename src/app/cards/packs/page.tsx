"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CreditBundlesStrip } from "@/components/cards/credit-bundles-strip";
import { PackArt } from "@/components/cards/codex/pack-art";
import { PackRitual } from "@/components/cards/codex/pack-ritual";
import { PALETTES } from "@/components/cards/codex/codex-art";
import { requestTrialCheck } from "@/components/cards/codex/unlock-events";
import { currentSeason } from "@/lib/cards/codex/catalog";
import type { Palette } from "@/lib/cards/codex/types";

interface Pack {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  flavourText: string | null;
  cost: number;
  cardCount: number;
  artTheme: string | null;
  weightStatic: number;
  weightSignal: number;
  weightTransmission: number;
  weightAnomaly: number;
  weightOracle: number;
  weightLegendary: number;
  weightMythic: number;
  weightForbidden: number;
  guaranteeRarity?: string | null;
  _count: { packCards: number };
}

interface WalletData {
  signalCredits: number;
  lastDailyClaimAt: string | null;
  dailyStreak?: number;
  longestStreak?: number;
  initiationClaimed?: boolean;
}

function themeOf(pack: Pack): Palette {
  return pack.artTheme && pack.artTheme in PALETTES ? (pack.artTheme as Palette) : "gold";
}

const SEASON = currentSeason();

export default function PackStorePage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [activePack, setActivePack] = useState<Pack | null>(null);
  const [claimState, setClaimState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  // Three states, not two. "No packs available" must only ever mean the API
  // returned an empty list — previously it also showed during the initial fetch
  // and after a failed one (the catch swallowed the error), so a visitor whose
  // first request hit a cold database saw an empty store that actually has
  // eight packs. One automatic retry covers that cold-start case.
  const [storeState, setStoreState] = useState<"loading" | "ready" | "error">("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStoreState("loading");

    const load = async (): Promise<void> => {
      const [packsRes, statsRes] = await Promise.all([
        fetch("/api/cards/packs"),
        fetch("/api/cards/stats"),
      ]);
      if (!packsRes.ok) throw new Error(`packs ${packsRes.status}`);
      const packsData: unknown = await packsRes.json();
      // Wallet is decorative here; a failed stats call must not blank the store.
      const statsData: WalletData | null = statsRes.ok ? await statsRes.json() : null;
      if (cancelled) return;
      setPacks(Array.isArray(packsData) ? (packsData as Pack[]) : []);
      setWallet(statsData);
      setStoreState("ready");
    };

    load()
      .catch(() => load()) // one retry — a cold DB typically answers the second time
      .catch(() => { if (!cancelled) setStoreState("error"); });

    return () => { cancelled = true; };
  }, [loadAttempt]);

  async function claimDaily() {
    if (claimState === "loading") return;
    setClaimState("loading");
    const res = await fetch("/api/cards/daily", { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      setClaimState("done");
      setClaimMsg(
        json.streakBonus > 0
          ? `+${json.granted} credits · 🔥 ${json.streak}-day streak`
          : `+${json.granted} signal credits`
      );
      const nowIso = new Date().toISOString();
      setWallet((w) => ({
        signalCredits: (w?.signalCredits ?? 0) + json.granted,
        lastDailyClaimAt: nowIso,
        dailyStreak: json.streak,
        longestStreak: json.longestStreak,
      }));
    } else {
      setClaimState("error");
      setClaimMsg(json.error ?? "Already claimed today");
      setTimeout(() => setClaimState("idle"), 3000);
    }
  }

  function canAfford(cost: number) {
    return (wallet?.signalCredits ?? 0) >= cost;
  }

  function dailyAvailable() {
    if (!wallet?.lastDailyClaimAt) return true;
    const last = new Date(wallet.lastDailyClaimAt);
    // eslint-disable-next-line react-hooks/purity
    return Date.now() - last.getTime() >= 24 * 3_600_000;
  }

  return (
    <div style={{ padding: "32px 28px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          color: "var(--neon)",
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          textShadow: "var(--glow-neon)",
          marginBottom: 8,
        }}>
          {`// SEASON ${SEASON.numeral} · ${SEASON.name.toUpperCase()}`}
        </p>
        <h1 style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 22,
          color: "var(--term-fg)",
          letterSpacing: "-0.01em",
          margin: 0,
        }}>
          Pack Store
        </h1>
        <p style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          color: "var(--term-fg-dim)",
          marginTop: 6,
          letterSpacing: "0.04em",
        }}>
          Spend Signal Credits on Season {SEASON.numeral} packs. Trial and secret cards never drop from packs, so check the Codex for those.
        </p>
      </div>

      {/* Wallet + daily */}
      <div style={{
        display: "flex",
        alignItems: "stretch",
        gap: 12,
        marginBottom: 32,
        flexWrap: "wrap",
      }}>
        <div style={{
          border: "1px solid var(--term-line)",
          borderRadius: 6,
          padding: "12px 20px",
          backgroundColor: "var(--term-bg-1)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          minWidth: 160,
        }}>
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: "var(--term-fg-faint)", letterSpacing: "0.12em" }}>
            SIGNAL CREDITS
          </span>
          <span style={{
            fontFamily: "var(--font-crt, var(--font-mono)), monospace",
            fontSize: 28,
            color: "var(--neon-4)",
            textShadow: "var(--glow-amber)",
            lineHeight: 1,
          }}>
            {wallet?.signalCredits.toLocaleString("en-US") ?? "--"}
          </span>
        </div>

        {(wallet?.dailyStreak ?? 0) > 0 && (
          <div style={{
            border: "1px solid var(--term-line)",
            borderRadius: 6,
            padding: "12px 20px",
            backgroundColor: "var(--term-bg-1)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: 110,
          }}>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: "var(--term-fg-faint)", letterSpacing: "0.12em" }}>
              STREAK
            </span>
            <span style={{
              fontFamily: "var(--font-crt, var(--font-mono)), monospace",
              fontSize: 28,
              color: dailyAvailable() ? "var(--neon-4)" : "var(--neon-3)",
              textShadow: dailyAvailable() ? "var(--glow-amber)" : "0 0 8px var(--neon-3)",
              lineHeight: 1,
            }}>
              🔥{wallet?.dailyStreak}
            </span>
            {dailyAvailable() && (
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 8, color: "var(--term-fg-faint)" }}>
                claim to keep it
              </span>
            )}
          </div>
        )}

        <button
          onClick={claimDaily}
          disabled={!dailyAvailable() || claimState === "loading" || claimState === "done"}
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: dailyAvailable() && claimState === "idle" ? "var(--neon)" : "var(--term-fg-faint)",
            background: "transparent",
            border: `1px solid ${dailyAvailable() && claimState === "idle" ? "var(--neon)" : "var(--term-line)"}`,
            borderRadius: 6,
            padding: "12px 20px",
            cursor: dailyAvailable() && claimState === "idle" ? "pointer" : "default",
            textShadow: dailyAvailable() && claimState === "idle" ? "var(--glow-neon)" : "none",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: 9, color: "var(--term-fg-faint)" }}>DAILY REWARD</span>
          <span>
            {claimState === "loading" ? "CLAIMING..." :
             claimState === "done"    ? claimMsg ?? "CLAIMED ✓" :
             claimState === "error"   ? claimMsg ?? "ERROR" :
             dailyAvailable()         ? "+25 CREDITS" : "CLAIMED TODAY"}
          </span>
        </button>

        <Link href="/cards" style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--term-fg-dim)",
          border: "1px solid var(--term-line)",
          borderRadius: 6,
          padding: "12px 20px",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
        }}>
          ← THE CODEX
        </Link>
      </div>

      {/* Free Initiation Pack — shown until it's opened (guests included). */}
      {wallet && !wallet.initiationClaimed && (
        <Link href="/cards" style={{
          display: "block",
          marginBottom: 24,
          padding: "14px 18px",
          border: "1px solid #f6c453",
          borderRadius: 10,
          background: "linear-gradient(120deg, #221806, #0c0903)",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: "#fff7e2",
          textDecoration: "none",
        }}>
          <span style={{ color: "#f6c453", letterSpacing: "0.16em", fontSize: 10 }}>FREE ✶ </span>
          Your Initiation Pack is waiting in the Codex: 5 cards, a Season-exclusive Legendary foil, and 100 credits. Open it first →
        </Link>
      )}

      {/* Buy credits — the paid route in; earning stays free below */}
      <CreditBundlesStrip />

      {/* How to earn credits */}
      <details style={{ marginBottom: 28 }}>
        <summary style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          color: "var(--term-fg-dim)",
          letterSpacing: "0.1em",
          cursor: "pointer",
          userSelect: "none",
        }}>
          {"// HOW TO EARN SIGNAL CREDITS"}
        </summary>
        <div style={{
          marginTop: 10,
          padding: "12px 16px",
          border: "1px solid var(--term-line)",
          borderRadius: 6,
          backgroundColor: "var(--term-bg-1)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}>
          {[
            { action: "Daily login", reward: "+25", label: "every 24h" },
            { action: "Read an episode", reward: "+5", label: "up to 3×/day" },
            { action: "Explore a lore entry", reward: "+8", label: "up to 2×/day" },
          ].map(({ action, reward, label }) => (
            <div key={action} style={{ fontFamily: "var(--font-mono), monospace" }}>
              <div style={{ fontSize: 11, color: "var(--neon-4)", fontWeight: 700 }}>{reward}</div>
              <div style={{ fontSize: 10, color: "var(--term-fg)" }}>{action}</div>
              <div style={{ fontSize: 9, color: "var(--term-fg-faint)" }}>{label}</div>
            </div>
          ))}
        </div>
      </details>

      {/* Pack grid */}
      {storeState !== "ready" || packs.length === 0 ? (
        <div
          role={storeState === "error" ? "alert" : "status"}
          aria-live="polite"
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: "var(--term-fg-faint)",
            textAlign: "center",
            padding: 48,
            border: "1px solid var(--term-line)",
            borderRadius: 6,
          }}
        >
          {storeState === "loading" ? (
            "// Opening the vault…"
          ) : storeState === "error" ? (
            <>
              {"// The vault didn't answer. "}
              <button
                type="button"
                onClick={() => setLoadAttempt((n) => n + 1)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  font: "inherit",
                  color: "var(--neon)",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Retry
              </button>
            </>
          ) : (
            "// No packs available. Check back later."
          )}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 400px), 1fr))",
          gap: 16,
        }}>
          {packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              canAfford={canAfford(pack.cost)}
              onOpen={() => setActivePack(pack)}
            />
          ))}
        </div>
      )}

      {/* Pack opening overlay */}
      {activePack && (
        <PackRitual
          title={activePack.name}
          theme={themeOf(activePack)}
          count={activePack.cardCount}
          endpoint="/api/cards/open-pack"
          body={{ packSlug: activePack.slug }}
          onClose={(opened) => {
            setActivePack(null);
            if (!opened) return;
            requestTrialCheck();
            // Refresh wallet after the pack closes.
            fetch("/api/cards/stats").then((r) => r.json()).then(setWallet).catch(() => {});
          }}
        />
      )}
    </div>
  );
}

const RARITY_ROWS: { key: keyof Pack; label: string; color: string }[] = [
  { key: "weightForbidden",    label: "FORBIDDEN",    color: "#ff2e2e" },
  { key: "weightMythic",       label: "MYTHIC",       color: "#b27bff" },
  { key: "weightLegendary",    label: "LEGENDARY",    color: "#f6c453" },
  { key: "weightOracle",       label: "ORACLE",       color: "#34d6ff" },
  { key: "weightAnomaly",      label: "ANOMALY",      color: "#ff4d8d" },
  { key: "weightTransmission", label: "TRANSMISSION", color: "#3ee895" },
  { key: "weightSignal",       label: "SIGNAL",       color: "#ffab36" },
  { key: "weightStatic",       label: "STATIC",       color: "#c7d0c8" },
];

function PackCard({ pack, canAfford, onOpen }: { pack: Pack; canAfford: boolean; onOpen: () => void }) {
  const theme = themeOf(pack);
  const accent = PALETTES[theme].g;

  return (
    <div style={{
      border: `1px solid ${accent}`,
      borderRadius: 12,
      overflow: "hidden",
      background: `radial-gradient(ellipse at 50% 0%, ${PALETTES[theme].bg1}, #0a0908 70%)`,
      display: "grid",
      gridTemplateColumns: "140px 1fr",
      gap: 18,
      padding: 18,
      alignItems: "center",
    }}>
      <PackArt name={pack.name} theme={theme} seasonNumeral={SEASON.numeral} count={pack.cardCount} />

      <div style={{ fontFamily: "var(--font-mono), monospace", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-display), sans-serif", fontSize: 20, fontWeight: 700, color: "#fff7e2" }}>
          {pack.name}
        </div>
        {pack.description && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: 0 }}>{pack.description}</p>
        )}

        <details>
          <summary style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em", cursor: "pointer" }}>ODDS PER CARD</summary>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 12px", marginTop: 6, fontSize: 10 }}>
            {RARITY_ROWS.filter((r) => Number(pack[r.key]) > 0).map((r) => (
              <div key={r.label} style={{ display: "contents" }}>
                <span style={{ color: r.color }}>{r.label}</span>
                <span style={{ color: "rgba(255,255,255,0.6)", textAlign: "right" }}>{Number(pack[r.key])}%</span>
              </div>
            ))}
          </div>
        </details>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
          <div>
            <span style={{ fontFamily: "var(--font-crt, var(--font-mono)), monospace", fontSize: 24, color: "#ffe39a" }}>{pack.cost}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginLeft: 4 }}>credits</span>
          </div>
          <button type="button" className="cx-btn cx-btn-primary" onClick={onOpen} disabled={!canAfford}>
            {canAfford ? "Open" : "Need credits"}
          </button>
        </div>
      </div>
    </div>
  );
}
