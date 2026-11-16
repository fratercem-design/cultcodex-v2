"use client";

import { useState, useCallback, useEffect } from "react";
import { CARD_BACKS } from "@/lib/cards/special-editions";
import { CodexCard, type CodexCardData } from "@/components/cards/codex/codex-card";
import "./reading.css";

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
  face: CodexCardData | null;
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
const SPREAD_POSITIONS: Record<SpreadSlug, string[]> = {
  single: ["The Signal"],
  three: ["The Static", "The Break", "The Emergence"],
};
const SPREADS: { key: SpreadSlug; label: string; count: string; cards: number; cost: number }[] = [
  { key: "single", label: "SINGLE SIGNAL", count: "1 card", cards: 1, cost: 1 },
  { key: "three", label: "TRANSMISSION", count: "3 cards", cards: 3, cost: 3 },
];


export function ReadingApp({ signedIn }: { signedIn: boolean }) {
  const [mode, setMode] = useState<Mode>("hybrid");
  const [spread, setSpread] = useState<SpreadSlug>("single");
  const [question, setQuestion] = useState("");
  const [reading, setReading] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signal, setSignal] = useState<number | null>(null);
  const [grant, setGrant] = useState<number | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [xp, setXp] = useState<{ into: number; need: number } | null>(null);

  const refreshSignal = useCallback(() => {
    fetch("/api/cards/signal")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (s && typeof s.signal === "number") {
          setSignal(s.signal); setGrant(s.grant); setLevel(s.level);
          setXp({ into: s.xpInto, need: s.xpNeed });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => { if (signedIn) refreshSignal(); }, [signedIn, refreshSignal]);

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
      refreshSignal(); // refresh level/XP (a draw awards XP)
    } catch (e) {
      setError(e instanceof Error ? e.message : "The signal broke. Try again.");
    } finally {
      setLoading(false);
    }
  }, [mode, spread, question, loading, refreshSignal]);

  const selected = SPREADS.find((s) => s.key === spread) ?? SPREADS[0];
  const selectedCost = selected.cost;
  const insufficient = signedIn && signal !== null && signal < selectedCost;

  const positions = reading ? reading.cards.map((c) => c.positionName) : SPREAD_POSITIONS[spread];
  const disabled = loading || !signedIn || insufficient;

  return (
    <main className="rd-page">
      <header className="rd-hero">
        <div className="rd-eyebrow">◉ THE ORACLE</div>
        <h1 className="rd-title">Draw a Reading</h1>
        <p className="rd-lede">
          The card does not predict. It reveals. Ask a question, choose a spread, and turn the cards over.
        </p>
        {signedIn && signal !== null && (
          <div className="rd-meter">
            <span>
              {level !== null && <b className="rd-meter-level">LVL {level}</b>}
              <b className="rd-meter-signal">◈ SIGNAL {signal}{grant !== null ? ` / ${grant}` : ""}</b>
            </span>
            {xp && (
              <span className="rd-meter-bar" aria-label={`${xp.into} of ${xp.need} XP`}>
                <span style={{ width: `${Math.min(100, Math.round((xp.into / Math.max(1, xp.need)) * 100))}%` }} />
              </span>
            )}
            <small>{xp ? `${xp.into}/${xp.need} XP · ` : ""}Signal resets at UTC midnight</small>
          </div>
        )}
      </header>

      {/* The table: face down until the draw lands, then each card turns over */}
      <section className="rd-table" aria-label="The spread">
        {reading?.question && <p className="rd-asked">“{reading.question}”</p>}
        <div className="rd-spread" data-drawing={loading ? "true" : undefined} aria-hidden={reading ? undefined : "true"}>
          {(reading ? reading.cards : Array.from({ length: selected.cards }, () => null)).map((c, i) => (
            <figure key={c?.id ?? i} className="rd-slot">
              {c ? (
                <TurnedCard card={c} index={i} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={CARD_BACKS.tarot} alt="" className="rd-back" style={{ animationDelay: `${i * 180}ms` }} draggable={false} />
              )}
              {positions[i] && <figcaption className="rd-pos">{positions[i]}</figcaption>}
            </figure>
          ))}
        </div>
      </section>

      {/* Controls */}
      <section className="rd-controls" aria-label="Reading options">
        <div className="rd-field">
          <span className="rd-label">MODE</span>
          <div className="rd-choices rd-choices-3">
            {MODES.map((m) => (
              <button key={m.key} type="button" onClick={() => setMode(m.key)} className="rd-choice" aria-pressed={mode === m.key}>
                <span className="rd-choice-name">{m.label}</span>
                <span className="rd-choice-sub">{m.blurb}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="rd-field">
          <span className="rd-label">SPREAD</span>
          <div className="rd-choices rd-choices-2">
            {SPREADS.map((s) => (
              <button key={s.key} type="button" onClick={() => setSpread(s.key)} className="rd-choice" aria-pressed={spread === s.key}>
                <span className="rd-choice-name">{s.label}</span>
                <span className="rd-choice-sub">{s.count} · {s.cost} ◈</span>
              </button>
            ))}
          </div>
        </div>
        <label className="rd-field">
          <span className="rd-label">YOUR QUESTION <span className="rd-optional">(optional)</span></span>
          <input
            className="rd-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What signal am I missing?"
            maxLength={200}
          />
        </label>
        <button type="button" onClick={draw} disabled={disabled} className="rd-draw">
          {loading ? "CONSULTING THE ARCHIVE…" : !signedIn ? "SIGN IN TO DRAW" : insufficient ? `NOT ENOUGH SIGNAL — NEED ${selectedCost} ◈` : `◈ DRAW · ${selectedCost} SIGNAL`}
        </button>
        {!signedIn && (
          <p className="rd-note"><a href="/auth/signin">Enter the archive</a> to draw from your collection.</p>
        )}
        {error && <p className="rd-error" role="alert">{error}</p>}
      </section>

      {/* Meanings */}
      {reading && (
        <section className="rd-results" aria-label="Your reading">
          <div className="rd-result-grid" data-count={reading.cards.length}>
            {reading.cards.map((c) => {
              const reversed = c.orientation === "reversed";
              const meaning = reversed ? c.reversedMeaning : c.uprightMeaning;
              return (
                <article key={c.id} className="rd-result" data-reversed={reversed ? "true" : undefined}>
                  {c.positionName && <div className="rd-result-pos">{c.positionName.toUpperCase()}</div>}
                  <div className="rd-result-head">
                    <h3>{c.titleSnapshot}</h3>
                    <span className="rd-orient">{reversed ? "⤒ REVERSED" : "▲ UPRIGHT"}</span>
                  </div>
                  {(c.archetype || c.element) && (
                    <div className="rd-result-meta">{[c.archetype, c.element].filter(Boolean).join(" · ")}</div>
                  )}
                  {meaning && <p className="rd-result-meaning">{meaning}</p>}
                  {c.advice && <p className="rd-result-advice">→ {c.advice}</p>}
                  {c.oraclePrompt && <p className="rd-result-prompt">{c.oraclePrompt}</p>}
                </article>
              );
            })}
          </div>
          <p className="rd-saved">
            Saved to your <a href="/cards/grimoire">Grimoire</a> · seed {reading.seed.slice(-8)}
          </p>
        </section>
      )}

      <nav className="rd-links" aria-label="More from the cards">
        <a href="/cards/grimoire"><b>The Grimoire</b><span>Every reading you have drawn</span></a>
        <a href="/cards/packs"><b>Pack Store</b><span>Grow the deck you draw from</span></a>
        <a href="/cards"><b>The Codex</b><span>Your collection</span></a>
      </nav>
    </main>
  );
}

/** One drawn card: lands face down, then turns over. Reversed cards land upside down. */
function TurnedCard({ card, index }: { card: ReadingCard; index: number }) {
  const [turned, setTurned] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTurned(true), 250 + index * 450);
    return () => clearTimeout(t);
  }, [index]);
  const face = card.face;
  const name = face?.title ?? card.titleSnapshot ?? "Card";
  return (
    <div
      className={`rd-flip${turned ? " is-turned" : ""}`}
      data-reversed={card.orientation === "reversed" ? "true" : undefined}
      role="img"
      aria-label={`${name}${card.orientation === "reversed" ? ", reversed" : ""}`}
    >
      <div className="rd-flip-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={CARD_BACKS.tarot} alt="" className="rd-face rd-face-back" draggable={false} />
        <div className="rd-face rd-face-front">
          {face?.artUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={face.artUrl} alt="" className="rd-art" draggable={false} />
          ) : face ? (
            <div className="rd-codex"><CodexCard card={face} interactive={false} /></div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

