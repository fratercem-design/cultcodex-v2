"use client";

import { useState, useCallback, type CSSProperties } from "react";

export interface GrimoireCard {
  position: number;
  positionName: string | null;
  orientation: string;
  titleSnapshot: string | null;
  uprightMeaning: string | null;
  reversedMeaning: string | null;
  oraclePrompt: string | null;
  element: string | null;
  archetype: string | null;
}
export interface GrimoireReading {
  id: string;
  createdAt: string;
  question: string | null;
  spreadName: string | null;
  reflection: string | null;
  cards: GrimoireCard[];
}

const panel: CSSProperties = {
  background: "var(--term-panel)",
  border: "1px solid var(--term-line)",
  borderRadius: 4,
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

export function GrimoireApp({ signedIn, readings }: { signedIn: boolean; readings: GrimoireReading[] }) {
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "48px 20px 96px", color: "var(--term-fg)" }}>
      <header style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.35em", color: "var(--accent-violet)" }}>
          ◈ THE GRIMOIRE
        </div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, margin: "10px 0 6px", fontWeight: 500 }}>
          Your Readings
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--term-fg-dim)", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
          Every reading is kept as it was drawn — the meaning cannot change beneath you. Return, and mark what came true.
        </p>
      </header>

      {!signedIn ? (
        <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--term-fg-dim)" }}>
          <a href="/auth/signin" style={{ color: "var(--neon-2)" }}>Enter the archive</a> to open your grimoire.
        </p>
      ) : readings.length === 0 ? (
        <p style={{ textAlign: "center", fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--term-fg-dim)" }}>
          The grimoire is empty. <a href="/cards/reading" style={{ color: "var(--neon)" }}>Draw your first reading →</a>
        </p>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {readings.map((r) => <ReadingEntry key={r.id} reading={r} />)}
        </div>
      )}
    </main>
  );
}

function ReadingEntry({ reading }: { reading: GrimoireReading }) {
  const [reflection, setReflection] = useState(reading.reflection ?? "");
  const [saved, setSaved] = useState<string>(reading.reflection ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = reflection.trim() !== saved.trim();

  const save = useCallback(async () => {
    if (saving || !dirty) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cards/reading/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingId: reading.id, reflection }),
      });
      if (res.ok) setSaved(reflection.trim());
    } finally {
      setSaving(false);
    }
  }, [saving, dirty, reflection, reading.id]);

  return (
    <article style={{ ...panel, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.2em", color: "var(--term-fg-mute)" }}>
          {fmtDate(reading.createdAt)}{reading.spreadName ? ` · ${reading.spreadName.toUpperCase()}` : ""}
        </span>
      </div>
      {reading.question && (
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 16, marginBottom: 12, color: "var(--term-fg)" }}>
          “{reading.question}”
        </p>
      )}

      <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        {reading.cards.map((c) => {
          const reversed = c.orientation === "reversed";
          const meaning = reversed ? c.reversedMeaning : c.uprightMeaning;
          const accent = reversed ? "var(--neon-5)" : "var(--neon)";
          return (
            <div key={c.position} style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 12 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                {c.positionName && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.2em", color: "var(--term-fg-mute)" }}>
                    {c.positionName.toUpperCase()}
                  </span>
                )}
                <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--term-fg)" }}>{c.titleSnapshot}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.15em", color: accent }}>
                  {reversed ? "REVERSED" : "UPRIGHT"}
                </span>
              </div>
              {meaning && (
                <p style={{ fontFamily: "var(--font-serif)", fontSize: 14, lineHeight: 1.55, color: "var(--term-fg-dim)", marginTop: 3 }}>
                  {meaning}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid var(--term-line)", paddingTop: 12 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.2em", color: "var(--accent-violet)", marginBottom: 6 }}>
          DID THIS MANIFEST?
        </div>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Return here later and record what came true…"
          maxLength={2000}
          rows={2}
          style={{
            ...panel, width: "100%", padding: "10px 12px", color: "var(--term-fg)",
            fontFamily: "var(--font-serif)", fontSize: 14, outline: "none", resize: "vertical",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            onClick={save}
            disabled={!dirty || saving}
            style={{
              padding: "6px 16px", cursor: !dirty || saving ? "default" : "pointer",
              background: !dirty || saving ? "var(--term-panel)" : "var(--accent-violet)",
              color: !dirty || saving ? "var(--term-fg-mute)" : "#04060a",
              border: "1px solid var(--accent-violet)", borderRadius: 3,
              fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.15em",
              opacity: !dirty || saving ? 0.6 : 1,
            }}
          >
            {saving ? "SAVING…" : dirty ? "SAVE" : "SAVED"}
          </button>
        </div>
      </div>
    </article>
  );
}
