"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TradingCard, type TradingCardData } from "@/components/cards/trading-card";
import { RARITY_LABEL, RARITY_ORDER, CARD_TYPE_LABEL } from "@/lib/cards/rarity";
import type { Rarity, CardType } from "@/generated/prisma/client";

interface OwnedWithCard {
  id: string;
  isFoil: boolean;
  isNew: boolean;
  quantity: number;
  obtainedAt: string | Date;
  card: TradingCardData;
}

interface CollectionStats {
  ownedCount: number;
  totalCards: number;
  completionPct: number;
  signalCredits: number;
  lastDailyClaimAt: string | Date | null;
}

interface CollectionViewProps {
  collection: OwnedWithCard[];
  stats: CollectionStats;
}

type SortKey = "rarity" | "type" | "newest" | "name";
type FilterRarity = "ALL" | Rarity;
type FilterType = "ALL" | CardType;

const RARITIES: FilterRarity[] = ["ALL", "ORACLE", "ANOMALY", "TRANSMISSION", "SIGNAL", "STATIC"];
const TYPES: FilterType[] = ["ALL", "VOICE", "TRANSMISSION", "LORE", "SIGNAL", "ORACLE", "CIPHER"];

export function CollectionView({ collection, stats }: CollectionViewProps) {
  const [sort, setSort] = useState<SortKey>("rarity");
  const [filterRarity, setFilterRarity] = useState<FilterRarity>("ALL");
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");

  const filtered = collection
    .filter((oc) => {
      if (filterRarity !== "ALL" && oc.card.rarity !== filterRarity) return false;
      if (filterType !== "ALL" && oc.card.cardType !== filterType) return false;
      if (search && !oc.card.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case "rarity":  return RARITY_ORDER[b.card.rarity] - RARITY_ORDER[a.card.rarity];
        case "type":    return a.card.cardType.localeCompare(b.card.cardType);
        case "newest":  return new Date(b.obtainedAt).getTime() - new Date(a.obtainedAt).getTime();
        case "name":    return a.card.title.localeCompare(b.card.title);
        default:        return 0;
      }
    });

  const dailyAvailable = useMemo(
    () => !stats.lastDailyClaimAt ||
      // eslint-disable-next-line react-hooks/purity
      Date.now() - new Date(stats.lastDailyClaimAt as string).getTime() >= 24 * 3_600_000,
    [stats.lastDailyClaimAt]
  );

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <p style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            color: "var(--neon)",
            letterSpacing: "0.4em",
            textShadow: "var(--glow-neon)",
            marginBottom: 6,
          }}>
            {"// MY_COLLECTION"}
          </p>
          <h1 style={{ fontFamily: "var(--font-mono), monospace", fontSize: 22, color: "var(--term-fg)", margin: 0 }}>
            Codex Cards
          </h1>
        </div>

        {/* Wallet + nav */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: "var(--neon-4)",
            textShadow: "var(--glow-amber)",
            border: "1px solid var(--term-line)",
            borderRadius: 4,
            padding: "6px 12px",
          }}>
            ◈ {stats.signalCredits.toLocaleString()} credits
          </div>
          {dailyAvailable && (
            <Link href="/cards/packs" style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              color: "var(--neon)",
              border: "1px solid var(--neon)",
              borderRadius: 4,
              padding: "6px 12px",
              textDecoration: "none",
              textShadow: "var(--glow-neon)",
              animation: "termBlink 2s step-end 4",
            }}>
              ▸ DAILY READY
            </Link>
          )}
          <Link href="/cards/decks" style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            color: "var(--term-fg-dim)",
            border: "1px solid var(--term-line)",
            borderRadius: 4,
            padding: "6px 12px",
            textDecoration: "none",
          }}>
            ARRAYS ◈
          </Link>
          <Link href="/cards/packs" style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            color: "var(--term-fg-dim)",
            border: "1px solid var(--term-line)",
            borderRadius: 4,
            padding: "6px 12px",
            textDecoration: "none",
          }}>
            PACK STORE →
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex",
        gap: 24,
        marginBottom: 24,
        padding: "12px 16px",
        border: "1px solid var(--term-line)",
        borderRadius: 6,
        backgroundColor: "var(--term-bg-1)",
        flexWrap: "wrap",
      }}>
        {[
          { label: "COLLECTED",  value: stats.ownedCount.toString() },
          { label: "TOTAL",      value: stats.totalCards.toString() },
          { label: "COMPLETION", value: `${stats.completionPct}%` },
          { label: "FOILS",      value: collection.filter((o) => o.isFoil).length.toString() },
          { label: "LEGENDARIES",value: collection.filter((o) => o.card.rarity === "ORACLE").length.toString() },
        ].map(({ label, value }) => (
          <div key={label} style={{ fontFamily: "var(--font-mono), monospace" }}>
            <div style={{ fontSize: 8, color: "var(--term-fg-faint)", letterSpacing: "0.12em", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 18, color: "var(--term-fg)", lineHeight: 1 }}>{value}</div>
          </div>
        ))}

        {/* Completion bar */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 120,
            height: 6,
            backgroundColor: "var(--term-line)",
            borderRadius: 3,
            overflow: "hidden",
          }}>
            <div style={{
              width: `${stats.completionPct}%`,
              height: "100%",
              backgroundColor: "var(--neon)",
              boxShadow: "var(--glow-neon)",
              transition: "width 800ms ease",
            }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="// search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: "var(--term-fg)",
            backgroundColor: "var(--term-bg-1)",
            border: "1px solid var(--term-line)",
            borderRadius: 4,
            padding: "6px 12px",
            outline: "none",
            width: 200,
          }}
        />

        <FilterChips
          label="RARITY"
          options={RARITIES}
          selected={filterRarity}
          onChange={(v) => setFilterRarity(v as FilterRarity)}
          labelFn={(v) => v === "ALL" ? "ALL" : RARITY_LABEL[v as Rarity]}
        />

        <FilterChips
          label="TYPE"
          options={TYPES}
          selected={filterType}
          onChange={(v) => setFilterType(v as FilterType)}
          labelFn={(v) => v === "ALL" ? "ALL" : CARD_TYPE_LABEL[v as CardType]}
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            color: "var(--term-fg-dim)",
            backgroundColor: "var(--term-bg-1)",
            border: "1px solid var(--term-line)",
            borderRadius: 4,
            padding: "5px 8px",
            marginLeft: "auto",
          }}
        >
          <option value="rarity">Sort: Rarity</option>
          <option value="type">Sort: Type</option>
          <option value="newest">Sort: Newest</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* Count */}
      <div style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 9,
        color: "var(--term-fg-faint)",
        letterSpacing: "0.08em",
        marginBottom: 16,
      }}>
        {filtered.length} card{filtered.length !== 1 ? "s" : ""}
      </div>

      {/* Grid */}
      {collection.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          color: "var(--term-fg-faint)",
          textAlign: "center",
          padding: 48,
        }}>
          No cards match your filters.
        </div>
      ) : (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "flex-start",
        }}>
          {filtered.map((oc) => (
            <div key={oc.id} style={{ position: "relative" }}>
              <TradingCard
                card={{ ...oc.card, isFoil: oc.isFoil, isNew: oc.isNew }}
                size="md"
                noTilt={false}
              />
              {oc.quantity > 1 && (
                <div style={{
                  position: "absolute",
                  bottom: 6,
                  left: 6,
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9,
                  color: "var(--term-fg-faint)",
                  background: "rgba(0,0,0,0.75)",
                  border: "1px solid var(--term-line)",
                  borderRadius: 2,
                  padding: "1px 5px",
                }}>
                  ×{oc.quantity}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChips<T extends string>({
  options,
  selected,
  onChange,
  labelFn,
}: {
  label: string;
  options: T[];
  selected: T;
  onChange: (v: T) => void;
  labelFn: (v: T) => string;
}) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            letterSpacing: "0.08em",
            color: selected === opt ? "var(--neon)" : "var(--term-fg-faint)",
            background: selected === opt ? "rgba(0,255,156,0.08)" : "transparent",
            border: `1px solid ${selected === opt ? "var(--neon)" : "var(--term-line-2)"}`,
            borderRadius: 3,
            padding: "3px 7px",
            cursor: "pointer",
            textShadow: selected === opt ? "var(--glow-neon)" : "none",
            transition: "all 100ms ease",
          }}
        >
          {labelFn(opt)}
        </button>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      textAlign: "center",
      padding: "64px 32px",
      border: "1px dashed var(--term-line)",
      borderRadius: 8,
    }}>
      <div style={{ fontSize: 40, color: "var(--neon)", textShadow: "var(--glow-neon)", marginBottom: 16 }}>◉</div>
      <div style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 13,
        color: "var(--term-fg)",
        marginBottom: 8,
      }}>
        No cards collected yet
      </div>
      <p style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 10,
        color: "var(--term-fg-dim)",
        marginBottom: 24,
        lineHeight: 1.7,
      }}>
        Claim your daily reward, then open packs to start building your collection.
      </p>
      <Link href="/cards/packs" style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 11,
        letterSpacing: "0.12em",
        color: "var(--neon)",
        border: "1px solid var(--neon)",
        borderRadius: 4,
        padding: "8px 20px",
        textDecoration: "none",
        textShadow: "var(--glow-neon)",
      }}>
        OPEN PACK STORE →
      </Link>
    </div>
  );
}
