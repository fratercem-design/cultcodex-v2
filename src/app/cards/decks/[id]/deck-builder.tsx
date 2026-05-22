"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { TradingCard, type TradingCardData } from "@/components/cards/trading-card";
import { RARITY_LABEL, RARITY_ORDER, RARITY_STYLE, CARD_TYPE_LABEL } from "@/lib/cards/rarity";
import type { Rarity, CardType } from "@/generated/prisma/client";

interface OwnedWithCard {
  id: string;
  isFoil: boolean;
  card: TradingCardData;
}

interface DeckCardEntry {
  id: string;
  card: TradingCardData;
}

interface DeckData {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  deckCards: DeckCardEntry[];
}

interface DeckBuilderProps {
  deck: DeckData;
  collection: OwnedWithCard[];
}

const MAX_DECK_SIZE = 20;

type SortKey = "rarity" | "type" | "name";
type FilterRarity = "ALL" | Rarity;
type FilterType = "ALL" | CardType;
const RARITIES: FilterRarity[] = ["ALL", "ORACLE", "ANOMALY", "TRANSMISSION", "SIGNAL", "STATIC"];
const TYPES: FilterType[] = ["ALL", "VOICE", "TRANSMISSION", "LORE", "SIGNAL", "ORACLE", "CIPHER", "ENTITY", "RELIC"];

function rarityColor(r: Rarity) { return RARITY_STYLE[r]?.color ?? "var(--term-fg-dim)"; }

export function DeckBuilder({ deck: initialDeck, collection }: DeckBuilderProps) {
  const [deck, setDeck] = useState(initialDeck);
  const [name, setName] = useState(initialDeck.name);
  const [description, setDescription] = useState(initialDeck.description ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [sort, setSort] = useState<SortKey>("rarity");
  const [filterRarity, setFilterRarity] = useState<FilterRarity>("ALL");
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deckCardIds = new Set(deck.deckCards.map((dc) => dc.card.id));
  const deckSize = deck.deckCards.length;

  const save = useCallback(async (updates: {
    name?: string;
    description?: string;
    cardIds?: string[];
  }) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      const res = await fetch(`/api/cards/decks/${deck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (res.ok) {
        setDeck(json);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1800);
      } else {
        setSaveState("error");
        setSaveMsg(json.error ?? "Save failed");
        setTimeout(() => { setSaveState("idle"); setSaveMsg(null); }, 3000);
      }
    }, 600);
  }, [deck.id]);

  function addCard(cardId: string) {
    if (deckCardIds.has(cardId) || deckSize >= MAX_DECK_SIZE) return;
    const newIds = [...deckCardIds, cardId];
    setDeck((prev) => {
      const cardEntry = collection.find((oc) => oc.card.id === cardId);
      if (!cardEntry) return prev;
      return {
        ...prev,
        deckCards: [...prev.deckCards, { id: "", card: cardEntry.card }],
      };
    });
    save({ cardIds: newIds });
  }

  function removeCard(cardId: string) {
    const newIds = [...deckCardIds].filter((id) => id !== cardId);
    setDeck((prev) => ({
      ...prev,
      deckCards: prev.deckCards.filter((dc) => dc.card.id !== cardId),
    }));
    save({ cardIds: newIds });
  }

  function handleNameBlur() {
    if (name.trim() && name.trim() !== deck.name) save({ name });
  }

  function handleDescBlur() {
    if (description !== (deck.description ?? "")) save({ description });
  }

  // Deduplicate collection by cardId (show each card once)
  const uniqueOwned = collection.reduce<Map<string, OwnedWithCard>>((acc, oc) => {
    if (!acc.has(oc.card.id)) acc.set(oc.card.id, oc);
    return acc;
  }, new Map());

  const filteredCollection = [...uniqueOwned.values()]
    .filter((oc) => {
      if (filterRarity !== "ALL" && oc.card.rarity !== filterRarity) return false;
      if (filterType !== "ALL" && oc.card.cardType !== filterType) return false;
      if (search && !oc.card.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case "rarity": return RARITY_ORDER[b.card.rarity] - RARITY_ORDER[a.card.rarity];
        case "type":   return a.card.cardType.localeCompare(b.card.cardType);
        case "name":   return a.card.title.localeCompare(b.card.title);
        default:       return 0;
      }
    });

  const deckCards = [...deck.deckCards].sort(
    (a, b) => RARITY_ORDER[b.card.rarity] - RARITY_ORDER[a.card.rarity]
  );

  // Rarity breakdown for the deck
  const deckRarityCount: Partial<Record<Rarity, number>> = {};
  for (const dc of deck.deckCards) {
    deckRarityCount[dc.card.rarity] = (deckRarityCount[dc.card.rarity] ?? 0) + 1;
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 1300, margin: "0 auto" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            color: "var(--neon)",
            letterSpacing: "0.4em",
            textShadow: "var(--glow-neon)",
            marginBottom: 4,
          }}>
            // SIGNAL_ARRAY
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            maxLength={40}
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--term-fg)",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid var(--term-line)",
              outline: "none",
              width: "100%",
              paddingBottom: 4,
            }}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            placeholder="// description (optional)"
            maxLength={120}
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              color: "var(--term-fg-dim)",
              background: "transparent",
              border: "none",
              outline: "none",
              width: "100%",
              marginTop: 6,
            }}
          />
        </div>

        {/* Save status + nav */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <span style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            color: saveState === "saved" ? "var(--neon)" : saveState === "error" ? "var(--neon-5)" : "var(--term-fg-faint)",
            textShadow: saveState === "saved" ? "var(--glow-neon)" : "none",
            minWidth: 80,
            textAlign: "right",
          }}>
            {saveState === "saving" ? "saving..." :
             saveState === "saved"  ? "✓ saved" :
             saveState === "error"  ? (saveMsg ?? "error") : ""}
          </span>
          <Link href="/cards/decks" style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            color: "var(--term-fg-dim)",
            border: "1px solid var(--term-line)",
            borderRadius: 4,
            padding: "6px 12px",
            textDecoration: "none",
          }}>
            ← ARRAYS
          </Link>
        </div>
      </div>

      {/* Deck stats bar */}
      <div style={{
        display: "flex",
        gap: 16,
        marginBottom: 20,
        padding: "10px 14px",
        border: "1px solid var(--term-line)",
        borderRadius: 6,
        backgroundColor: "var(--term-bg-1)",
        flexWrap: "wrap",
        alignItems: "center",
      }}>
        <div style={{ fontFamily: "var(--font-mono), monospace" }}>
          <div style={{ fontSize: 7, color: "var(--term-fg-faint)", letterSpacing: "0.12em", marginBottom: 1 }}>CARDS</div>
          <div style={{ fontSize: 18, color: "var(--term-fg)", lineHeight: 1 }}>{deckSize}/{MAX_DECK_SIZE}</div>
        </div>

        {/* Progress bar */}
        <div style={{ width: 80, height: 4, backgroundColor: "var(--term-line)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            width: `${(deckSize / MAX_DECK_SIZE) * 100}%`,
            height: "100%",
            backgroundColor: deckSize === MAX_DECK_SIZE ? "var(--neon-4)" : "var(--neon)",
            transition: "width 300ms ease",
          }} />
        </div>

        {/* Rarity pills */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(["FORBIDDEN", "MYTHIC", "LEGENDARY", "ORACLE", "ANOMALY", "TRANSMISSION", "SIGNAL", "STATIC"] as Rarity[])
            .filter((r) => deckRarityCount[r])
            .map((r) => (
              <span key={r} style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 8,
                color: rarityColor(r),
                border: `1px solid ${rarityColor(r)}`,
                borderRadius: 2,
                padding: "1px 5px",
              }}>
                {RARITY_LABEL[r]} ×{deckRarityCount[r]}
              </span>
            ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* Left: collection */}
        <div>
          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: "var(--term-fg-faint)", letterSpacing: "0.1em", marginBottom: 12 }}>
            // YOUR COLLECTION — click to add
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              placeholder="// search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                color: "var(--term-fg)",
                backgroundColor: "var(--term-bg-1)",
                border: "1px solid var(--term-line)",
                borderRadius: 4,
                padding: "5px 10px",
                outline: "none",
                width: 160,
              }}
            />
            <ChipFilter options={RARITIES} selected={filterRarity} onChange={(v) => setFilterRarity(v as FilterRarity)} labelFn={(v) => v === "ALL" ? "ALL" : RARITY_LABEL[v as Rarity]} />
            <ChipFilter options={TYPES} selected={filterType} onChange={(v) => setFilterType(v as FilterType)} labelFn={(v) => v === "ALL" ? "ALL" : CARD_TYPE_LABEL[v as CardType]} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 9,
                color: "var(--term-fg-dim)",
                backgroundColor: "var(--term-bg-1)",
                border: "1px solid var(--term-line)",
                borderRadius: 4,
                padding: "4px 8px",
                marginLeft: "auto",
              }}
            >
              <option value="rarity">Rarity</option>
              <option value="type">Type</option>
              <option value="name">Name</option>
            </select>
          </div>

          {collection.length === 0 ? (
            <div style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              color: "var(--term-fg-faint)",
              textAlign: "center",
              padding: 40,
              border: "1px dashed var(--term-line)",
              borderRadius: 6,
            }}>
              No cards in your collection yet.{" "}
              <Link href="/cards/packs" style={{ color: "var(--neon)" }}>Open some packs →</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {filteredCollection.map((oc) => {
                const inDeck = deckCardIds.has(oc.card.id);
                const full = !inDeck && deckSize >= MAX_DECK_SIZE;
                return (
                  <div key={oc.card.id} style={{ position: "relative", opacity: full ? 0.45 : 1, transition: "opacity 150ms" }}>
                    <TradingCard
                      card={{ ...oc.card, isFoil: oc.isFoil }}
                      size="sm"
                      noTilt
                      onClick={inDeck || full ? undefined : () => addCard(oc.card.id)}
                    />
                    {inDeck && (
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 8,
                        background: "rgba(0,255,156,0.12)",
                        border: "1.5px solid var(--neon)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}>
                        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: "var(--neon)", textShadow: "var(--glow-neon)", background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: 3 }}>
                          IN ARRAY
                        </span>
                      </div>
                    )}
                    {!inDeck && !full && (
                      <div style={{
                        position: "absolute",
                        bottom: 4,
                        right: 4,
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 10,
                        color: "var(--neon)",
                        background: "rgba(0,0,0,0.75)",
                        border: "1px solid var(--neon)",
                        borderRadius: 3,
                        padding: "1px 6px",
                        cursor: "pointer",
                        lineHeight: 1.6,
                      }}>+</div>
                    )}
                  </div>
                );
              })}
              {filteredCollection.length === 0 && (
                <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, color: "var(--term-fg-faint)", padding: 24 }}>
                  No cards match filters.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: deck contents */}
        <div style={{
          border: "1px solid var(--term-line)",
          borderRadius: 8,
          backgroundColor: "var(--term-bg-1)",
          padding: "14px 16px",
          position: "sticky",
          top: 20,
        }}>
          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: "var(--term-fg-faint)", letterSpacing: "0.1em", marginBottom: 12 }}>
            // ARRAY CONTENTS
          </div>

          {deckCards.length === 0 ? (
            <div style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              color: "var(--term-fg-faint)",
              textAlign: "center",
              padding: "28px 12px",
              border: "1px dashed var(--term-line)",
              borderRadius: 6,
            }}>
              Click cards in your collection to add them here.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {deckCards.map((dc) => (
                <DeckCardRow key={dc.card.id} card={dc.card} onRemove={() => removeCard(dc.card.id)} />
              ))}
            </div>
          )}

          {deckSize >= MAX_DECK_SIZE && (
            <div style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9,
              color: "var(--neon-4)",
              textShadow: "var(--glow-amber)",
              textAlign: "center",
              marginTop: 10,
            }}>
              ▲ ARRAY FULL ({MAX_DECK_SIZE}/{MAX_DECK_SIZE})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeckCardRow({ card, onRemove }: { card: TradingCardData; onRemove: () => void }) {
  const style = RARITY_STYLE[card.rarity];
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "5px 8px",
      borderRadius: 4,
      border: "1px solid var(--term-line)",
      backgroundColor: "var(--term-bg)",
    }}>
      <span style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 9,
        color: style.color,
        width: 14,
        flexShrink: 0,
        textAlign: "center",
      }}>
        ●
      </span>
      <span style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 10,
        color: "var(--term-fg)",
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {card.title}
      </span>
      <span style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 8,
        color: "var(--term-fg-faint)",
        flexShrink: 0,
      }}>
        {RARITY_LABEL[card.rarity].slice(0, 4)}
      </span>
      <button
        onClick={onRemove}
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          color: "var(--neon-5)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "0 2px",
          flexShrink: 0,
          lineHeight: 1,
        }}
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}

function ChipFilter<T extends string>({
  options,
  selected,
  onChange,
  labelFn,
}: {
  options: T[];
  selected: T;
  onChange: (v: T) => void;
  labelFn: (v: T) => string;
}) {
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 8,
            letterSpacing: "0.06em",
            color: selected === opt ? "var(--neon)" : "var(--term-fg-faint)",
            background: selected === opt ? "rgba(0,255,156,0.08)" : "transparent",
            border: `1px solid ${selected === opt ? "var(--neon)" : "var(--term-line-2)"}`,
            borderRadius: 3,
            padding: "2px 6px",
            cursor: "pointer",
            textShadow: selected === opt ? "var(--glow-neon)" : "none",
          }}
        >
          {labelFn(opt)}
        </button>
      ))}
    </div>
  );
}
