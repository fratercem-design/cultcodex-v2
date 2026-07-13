"use client";

import { useState, useCallback, useEffect, type CSSProperties } from "react";

type Mode = "hybrid" | "archive" | "arcana";
type SpreadSlug = "single" | "three";

interface ReadingCard {
  id: string;
  position: number;
  positionName: string | null;
  orientation: "upright" | "reversed";
  titleSnapshot: string | null;
  uprightMeaning: string | null;
  reversedMeaning: string | null;
  advice: string | null;
  oraclePrompt: string | null;
  element: string | null;
  archetype: string | null;
  keywords: string[];
}
interface Reading {
  id: string;
  question: string | null;
  seed: string;
  cards: ReadingCard[];
}

const MODES: { key: Mode; label: string; blurb: string }[] = [
  { key: "hybrid", label: "HYBRID", blurb: "Tarot + archive — the full oracle" },
  { key: "archive", label: "ARCHIVE", blurb: "The CultCodex deck only" },
  { key: "arcana", label: "ARCANA", blurb: "The 80-card Tarot only" },
];
const SPREADS: { key: SpreadSlug; label: string; count: string; cost: number }[] = [
  { key: "single", label: "SINGLE SIGNAL", count: "1 card", cost: 1 },
  { key: "three", label: "TRANSMISSION", count: "3 cards", cost: 3 },
];

const panel: CSSProperties = {
  background: "var(--term-panel)",
  border: "1px solid var(--term-line)",
  borderRadius: 4,
};

export function ReadingApp({ signedIn }: { signedIn: boolean }) {
  const [mode, setMode] = useState<Mode>("hybrid");
  const [spread, setSpread] = useState<SpreadSlug>("single");
  const [question, setQuestion] = useState("");
  const [reading, setReading] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signal, setSignal] = useState<number | null>(null);
  const [grant, setGrant] = useState<number | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    fetch("/api/cards/signal")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => { if (s && typeof s.signal === "number") { setSignal(s.signal); setGrant(s.grant); } })
      .catch(() => {});
  }, [signedIn]);

  const draw = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setReading(null);
    try {
      const res = await fetch("/api/cards/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, spread, question: question.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "The signal broke. Try again.");
      setReading(json.reading as Reading);
      if (typeof json.signalRemaining === "number") setSignal(json.signalRemaining);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The signal broke. Try again.");
    } finally {
      setLoading(false);
    }
  }, [mode, spread, question, loading]);

  const selectedCost = SPREADS.find((s) => s.key === spread)?.cost ?? 1;
  const insufficient = signedIn && signal !== null && signal < selectedCost;

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 20px 96px", color: "var(--term-fg)" }}>
      <header style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.35em", color: "var(--neon)", textShadow: "var(--glow-neon)" }}>
          ◉ THE ORACLE
        </div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, margin: "10px 0 6px", fontWeight: 500 }}>
          Draw a Reading
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--term-fg-dim)", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
          The card does not predict. It reveals. Your collection is the deck; the signal beneath the noise is drawn from it.
        </p>
      </header>

      {signedIn && signal !== null && (
        <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--neon)", marginBottom: 22, letterSpacing: "0.15em", textShadow: "var(--glow-neon)" }}>
          ◈ SIGNAL {signal}{grant !== null ? ` / ${grant}` : ""}
          <span style={{ color: "var(--term-fg-mute)", textShadow: "none", marginLeft: 8 }}>· resets at UTC midnight</span>
        </div>
      )}

      {/* Mode selector */}
      <section style={{ marginBottom: 18 }}>
        <div style={label}>MODE</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {MODES.map((m) => (
            <button key={m.key} onClick={() => setMode(m.key)} style={choice(mode === m.key)}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.15em" }}>{m.label}</span>
              <span style={{ fontSize: 10.5, color: "var(--term-fg-dim)", marginTop: 3 }}>{m.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Spread selector */}
      <section style={{ marginBottom: 18 }}>
        <div style={label}>SPREAD</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {SPREADS.map((s) => (
            <button key={s.key} onClick={() => setSpread(s.key)} style={choice(spread === s.key)}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.15em" }}>{s.label}</span>
              <span style={{ fontSize: 10.5, color: "var(--term-fg-dim)", marginTop: 3 }}>{s.count} · {s.cost} ◈</span>
            </button>
          ))}
        </div>
      </section>

      {/* Question */}
      <section style={{ marginBottom: 20 }}>
        <div style={label}>YOUR QUESTION <span style={{ color: "var(--term-fg-mute)" }}>(optional)</span></div>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What signal am I missing?"
          maxLength={200}
          style={{
            ...panel, width: "100%", padding: "12px 14px", color: "var(--term-fg)",
            fontFamily: "var(--font-serif)", fontSize: 15, outline: "none",
          }}
        />
      </section>

      <button onClick={draw} disabled={loading || !signedIn || insufficient} style={drawBtn(loading || !signedIn || insufficient)}>
        {loading ? "CONSULTING THE ARCHIVE…" : !signedIn ? "SIGN IN TO DRAW" : insufficient ? `NOT ENOUGH SIGNAL — NEED ${selectedCost} ◈` : `◈ DRAW · ${selectedCost} SIGNAL`}
      </button>
      {!signedIn && (
        <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--term-fg-dim)", marginTop: 12 }}>
          <a href="/auth/signin" style={{ color: "var(--neon-2)" }}>Enter the archive</a> to draw from your collection.
        </p>
      )}
      {error && (
        <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--neon-5)", marginTop: 14 }}>{error}</p>
      )}

      {/* Result */}
      {reading && (
        <section style={{ marginTop: 40 }}>
          {reading.question && (
            <p style={{ textAlign: "center", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 17, color: "var(--term-fg)", marginBottom: 24 }}>
              “{reading.question}”
            </p>
          )}
          <div style={{ display: "grid", gap: 16 }}>
            {reading.cards.map((c) => {
              const reversed = c.orientation === "reversed";
              const meaning = reversed ? c.reversedMeaning : c.uprightMeaning;
              const accent = reversed ? "var(--neon-5)" : "var(--neon)";
              return (
                <article key={c.id} style={{ ...panel, borderLeft: `2px solid ${accent}`, padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      {c.positionName && (
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.25em", color: "var(--term-fg-mute)" }}>
                          {c.positionName.toUpperCase()}
                        </div>
                      )}
                      <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, margin: "2px 0 0", fontWeight: 500 }}>
                        {c.titleSnapshot}
                      </h3>
                    </div>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.2em",
                      color: accent, border: `1px solid ${accent}`, borderRadius: 3, padding: "3px 8px",
                    }}>
                      {reversed ? "⤒ REVERSED" : "▲ UPRIGHT"}
                    </span>
                  </div>

                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--term-fg-dim)", marginTop: 6, letterSpacing: "0.08em" }}>
                    {[c.archetype, c.element].filter(Boolean).join(" · ")}
                  </div>

                  {meaning && (
                    <p style={{ fontFamily: "var(--font-serif)", fontSize: 16, lineHeight: 1.65, color: "var(--term-fg)", marginTop: 12 }}>
                      {meaning}
                    </p>
                  )}
                  {c.advice && (
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--neon-4)", marginTop: 10, lineHeight: 1.5 }}>
                      → {c.advice}
                    </p>
                  )}
                  {c.oraclePrompt && (
                    <p style={{
                      fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15, color: "var(--accent-violet)",
                      marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--term-line)",
                    }}>
                      {c.oraclePrompt}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
          <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--term-fg-mute)", marginTop: 22 }}>
            Reading saved to your grimoire · seed {reading.seed.slice(-8)}
          </p>
        </section>
      )}
    </main>
  );
}

const label: CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.25em",
  color: "var(--term-fg-dim)", marginBottom: 8,
};
function choice(active: boolean): CSSProperties {
  return {
    ...panel,
    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
    padding: "12px 8px", cursor: "pointer", color: active ? "var(--neon)" : "var(--term-fg)",
    borderColor: active ? "var(--neon)" : "var(--term-line)",
    boxShadow: active ? "var(--glow-neon)" : "none",
    transition: "all 0.15s ease",
  };
}
function drawBtn(disabled: boolean): CSSProperties {
  return {
    width: "100%", padding: "15px", cursor: disabled ? "default" : "pointer",
    background: disabled ? "var(--term-panel)" : "var(--neon)",
    color: disabled ? "var(--term-fg-dim)" : "#04060a",
    border: "1px solid var(--neon)", borderRadius: 4,
    fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: "0.2em", fontWeight: 600,
    boxShadow: disabled ? "none" : "var(--glow-neon)",
    opacity: disabled ? 0.6 : 1, transition: "all 0.15s ease",
  };
}
