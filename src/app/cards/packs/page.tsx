"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PackOpener } from "@/components/cards/pack-opener";

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
  _count: { packCards: number };
}

interface WalletData {
  signalCredits: number;
  lastDailyClaimAt: string | null;
}

const ACCENT_VAR: Record<string, string> = {
  // legacy keys
  neon:     "var(--neon)",
  amber:    "var(--neon-4)",
  magenta:  "var(--neon-3)",
  crimson:  "var(--neon-5)",
  cyan:     "var(--neon-2)",
  // artTheme keys from seed
  terminal: "var(--neon)",
  occult:   "var(--neon-3)",
  chaos:    "var(--neon-5)",
  sacred:   "var(--neon-4)",
};

export default function PackStorePage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [activePack, setActivePack] = useState<Pack | null>(null);
  const [claimState, setClaimState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/cards/packs").then((r) => r.json()),
      fetch("/api/cards/stats").then((r) => r.json()),
    ]).then(([packsData, statsData]) => {
      setPacks(Array.isArray(packsData) ? packsData : []);
      setWallet(statsData);
    }).catch(() => {});
  }, []);

  async function claimDaily() {
    if (claimState === "loading") return;
    setClaimState("loading");
    const res = await fetch("/api/cards/daily", { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      setClaimState("done");
      setClaimMsg(`+${json.granted} signal credits`);
      setWallet((w) => w ? { ...w, signalCredits: w.signalCredits + json.granted } : w);
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
          {"// SIGNAL_PACKS"}
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
          Spend signal credits to open packs and build your Codex collection.
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
            {wallet?.signalCredits.toLocaleString() ?? "--"}
          </span>
        </div>

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
          ← MY COLLECTION
        </Link>
      </div>

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
      {packs.length === 0 ? (
        <div style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          color: "var(--term-fg-faint)",
          textAlign: "center",
          padding: 48,
          border: "1px solid var(--term-line)",
          borderRadius: 6,
        }}>
          {"// No packs available. Check back later."}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
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

      {/* Pack opener overlay */}
      {activePack && (
        <PackOpener
          packSlug={activePack.slug}
          packTitle={activePack.name}
          packAccentColor={ACCENT_VAR[activePack.artTheme ?? "terminal"] ?? "var(--neon)"}
          onClose={() => {
            setActivePack(null);
            {"// Refresh wallet"}
            fetch("/api/cards/stats").then((r) => r.json()).then(setWallet).catch(() => {});
          }}
        />
      )}
    </div>
  );
}

function PackCard({ pack, canAfford, onOpen }: { pack: Pack; canAfford: boolean; onOpen: () => void }) {
  const accent = ACCENT_VAR[pack.artTheme ?? "terminal"] ?? "var(--neon)";

  const rarityPreview = [
    pack.weightForbidden > 0 && { label: "FORBIDDEN",   pct: pack.weightForbidden,    color: "#FF1744" },
    pack.weightMythic > 0    && { label: "MYTHIC",       pct: pack.weightMythic,       color: "#E040FB" },
    pack.weightLegendary > 0 && { label: "LEGENDARY",   pct: pack.weightLegendary,    color: "#FFD700" },
    pack.weightOracle > 0    && { label: "ORACLE",       pct: pack.weightOracle,       color: "var(--neon-5)" },
    pack.weightAnomaly > 0   && { label: "ANOMALY",      pct: pack.weightAnomaly,      color: "var(--neon-3)" },
    pack.weightTransmission > 0 && { label: "RARE",      pct: pack.weightTransmission, color: "var(--neon-4)" },
    pack.weightSignal > 0    && { label: "SIGNAL",       pct: pack.weightSignal,       color: "var(--neon)"   },
    pack.weightStatic > 0    && { label: "STATIC",       pct: pack.weightStatic,       color: "var(--term-fg-dim)" },
  ].filter(Boolean) as { label: string; pct: number; color: string }[];

  return (
    <div style={{
      border: `1px solid ${accent}`,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: "var(--term-bg-1)",
      display: "flex",
      flexDirection: "column",
      boxShadow: canAfford ? `0 0 0 rgba(0,0,0,0)` : undefined,
      opacity: canAfford ? 1 : 0.6,
    }}>
      {/* Pack header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: `1px solid var(--term-line)`,
        background: `linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%)`,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* BG glyph */}
        <div style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 56,
          color: accent,
          opacity: 0.06,
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}>◉</div>

        <div style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 13,
          fontWeight: 700,
          color: accent,
          textShadow: `0 0 8px ${accent}`,
          letterSpacing: "0.04em",
          marginBottom: 4,
        }}>
          {pack.name}
        </div>
        {pack.artTheme && (
          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: "var(--term-fg-dim)", letterSpacing: "0.08em" }}>
            {"// "}{pack.artTheme.toUpperCase()}{" SERIES"}
          </div>
        )}
      </div>

      <div style={{ padding: "12px 16px", flex: 1 }}>
        {pack.description && (
          <p style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            color: "var(--term-fg-dim)",
            lineHeight: 1.6,
            margin: "0 0 12px",
          }}>
            {pack.description}
          </p>
        )}

        {/* Rarity breakdown */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 8, color: "var(--term-fg-faint)", marginBottom: 6, letterSpacing: "0.1em" }}>
            RARITY DISTRIBUTION
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {rarityPreview.map(({ label, pct, color }) => (
              <span key={label} style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 8,
                color,
                border: `1px solid ${color}`,
                borderRadius: 2,
                padding: "1px 5px",
                opacity: 0.8,
              }}>
                {label} {pct}%
              </span>
            ))}
          </div>
        </div>

        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: "var(--term-fg-faint)", letterSpacing: "0.06em" }}>
          {pack.cardCount} cards per pack
        </div>
      </div>

      {/* Footer: cost + CTA */}
      <div style={{
        padding: "10px 16px",
        borderTop: "1px solid var(--term-line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}>
        <div>
          <span style={{
            fontFamily: "var(--font-crt, var(--font-mono)), monospace",
            fontSize: 20,
            color: "var(--neon-4)",
            textShadow: "var(--glow-amber)",
          }}>
            {pack.cost}
          </span>
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: "var(--term-fg-faint)", marginLeft: 4 }}>
            credits
          </span>
        </div>
        <button
          onClick={onOpen}
          disabled={!canAfford}
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: canAfford ? accent : "var(--term-fg-faint)",
            background: "transparent",
            border: `1px solid ${canAfford ? accent : "var(--term-line)"}`,
            borderRadius: 4,
            padding: "6px 14px",
            cursor: canAfford ? "pointer" : "not-allowed",
            textShadow: canAfford ? `0 0 6px ${accent}` : "none",
          }}
        >
          {canAfford ? "OPEN ▸" : "NEED CREDITS"}
        </button>
      </div>
    </div>
  );
}
