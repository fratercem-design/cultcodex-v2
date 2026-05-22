"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Rarity } from "@/generated/prisma/client";
import { RARITY_STYLE } from "@/lib/cards/rarity";

interface CardSummary {
  id: string;
  rarity: Rarity;
  cardType: string;
  title: string;
}

interface DeckWithCards {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: string | Date;
  deckCards: { card: CardSummary }[];
}

interface DecksListProps {
  decks: DeckWithCards[];
}

function rarityBreakdown(deckCards: { card: CardSummary }[]) {
  const counts: Partial<Record<Rarity, number>> = {};
  for (const dc of deckCards) {
    counts[dc.card.rarity] = (counts[dc.card.rarity] ?? 0) + 1;
  }
  return counts;
}

export function DecksList({ decks: initialDecks }: DecksListProps) {
  const router = useRouter();
  const [decks, setDecks] = useState(initialDecks);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError(null);
    const res = await fetch("/api/cards/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const json = await res.json();
    setCreating(false);
    if (res.ok) {
      setNewName("");
      router.push(`/cards/decks/${json.id}`);
    } else {
      setCreateError(json.error ?? "Failed to create");
    }
  }

  async function handleDelete(deckId: string) {
    setDeleting(deckId);
    const res = await fetch(`/api/cards/decks/${deckId}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) setDecks((prev) => prev.filter((d) => d.id !== deckId));
  }

  return (
    <div style={{ padding: "32px 28px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          color: "var(--neon)",
          letterSpacing: "0.4em",
          textShadow: "var(--glow-neon)",
          marginBottom: 6,
        }}>
          // SIGNAL_ARRAYS
        </p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "var(--font-mono), monospace", fontSize: 22, color: "var(--term-fg)", margin: 0 }}>
            My Arrays
          </h1>
          <Link href="/cards" style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            color: "var(--term-fg-dim)",
            border: "1px solid var(--term-line)",
            borderRadius: 4,
            padding: "6px 12px",
            textDecoration: "none",
          }}>
            ← COLLECTION
          </Link>
        </div>
      </div>

      {/* Create new array */}
      <div style={{
        border: "1px solid var(--term-line)",
        borderRadius: 6,
        padding: "16px 20px",
        backgroundColor: "var(--term-bg-1)",
        marginBottom: 28,
      }}>
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: "var(--term-fg-faint)", letterSpacing: "0.12em", marginBottom: 10 }}>
          NEW ARRAY
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <input
            type="text"
            placeholder="// array name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            maxLength={40}
            style={{
              flex: 1,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              color: "var(--term-fg)",
              backgroundColor: "var(--term-bg)",
              border: "1px solid var(--term-line)",
              borderRadius: 4,
              padding: "8px 12px",
              outline: "none",
            }}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: newName.trim() ? "var(--neon)" : "var(--term-fg-faint)",
              background: "transparent",
              border: `1px solid ${newName.trim() ? "var(--neon)" : "var(--term-line)"}`,
              borderRadius: 4,
              padding: "8px 16px",
              cursor: newName.trim() ? "pointer" : "default",
              textShadow: newName.trim() ? "var(--glow-neon)" : "none",
              whiteSpace: "nowrap",
            }}
          >
            {creating ? "CREATING..." : "CREATE ▸"}
          </button>
        </div>
        {createError && (
          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, color: "var(--neon-5)", marginTop: 8 }}>
            {createError}
          </div>
        )}
      </div>

      {/* Deck list */}
      {decks.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "56px 32px",
          border: "1px dashed var(--term-line)",
          borderRadius: 8,
          fontFamily: "var(--font-mono), monospace",
        }}>
          <div style={{ fontSize: 32, color: "var(--neon)", marginBottom: 12, textShadow: "var(--glow-neon)" }}>◈</div>
          <div style={{ fontSize: 12, color: "var(--term-fg)", marginBottom: 8 }}>No arrays yet</div>
          <div style={{ fontSize: 10, color: "var(--term-fg-dim)" }}>
            Create an array above to start building your first signal configuration.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} onDelete={handleDelete} deleting={deleting === deck.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function DeckCard({
  deck,
  onDelete,
  deleting,
}: {
  deck: DeckWithCards;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const cardCount = deck.deckCards.length;
  const breakdown = rarityBreakdown(deck.deckCards);

  const topRarities: Rarity[] = ["FORBIDDEN", "MYTHIC", "LEGENDARY", "ORACLE", "ANOMALY", "TRANSMISSION", "SIGNAL", "STATIC"];

  return (
    <div style={{
      border: "1px solid var(--term-line)",
      borderRadius: 8,
      backgroundColor: "var(--term-bg-1)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      <Link href={`/cards/decks/${deck.id}`} style={{
        textDecoration: "none",
        padding: "14px 16px 12px",
        borderBottom: "1px solid var(--term-line)",
        display: "block",
      }}>
        <div style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--term-fg)",
          letterSpacing: "0.04em",
          marginBottom: 4,
        }}>
          {deck.name}
        </div>
        {deck.description && (
          <div style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            color: "var(--term-fg-dim)",
            lineHeight: 1.5,
          }}>
            {deck.description}
          </div>
        )}
      </Link>

      <div style={{ padding: "10px 16px", flex: 1 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          {topRarities
            .filter((r) => breakdown[r])
            .map((r) => {
              const style = RARITY_STYLE[r];
              return (
                <span key={r} style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 8,
                  color: style.color,
                  border: `1px solid ${style.color}`,
                  borderRadius: 2,
                  padding: "1px 5px",
                  opacity: 0.85,
                }}>
                  {r} ×{breakdown[r]}
                </span>
              );
            })}
          {cardCount === 0 && (
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: "var(--term-fg-faint)" }}>
              Empty
            </span>
          )}
        </div>
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: "var(--term-fg-faint)" }}>
          {cardCount}/{20} cards
        </div>
      </div>

      <div style={{
        padding: "8px 16px",
        borderTop: "1px solid var(--term-line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}>
        <Link href={`/cards/decks/${deck.id}`} style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          letterSpacing: "0.1em",
          color: "var(--neon)",
          textDecoration: "none",
          textShadow: "var(--glow-neon)",
        }}>
          EDIT ▸
        </Link>
        <button
          onClick={() => onDelete(deck.id)}
          disabled={deleting}
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            color: "var(--term-fg-faint)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "2px 6px",
            opacity: deleting ? 0.5 : 1,
          }}
        >
          {deleting ? "..." : "DELETE"}
        </button>
      </div>
    </div>
  );
}
