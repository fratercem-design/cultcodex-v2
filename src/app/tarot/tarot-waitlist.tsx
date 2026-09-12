"use client";

import { useState } from "react";
import Link from "next/link";

const CARD_PREVIEWS = [
  { name: "The Oracle", type: "MAJOR ARCANA", desc: "Distilled pattern recognition. Sees before being seen.", glyph: "◉" },
  { name: "The Manipulator", type: "SHADOW COURT", desc: "Charm as weapon. Every move calculated.", glyph: "▽" },
  { name: "The Empath", type: "VOICE SUIT", desc: "Absorbs what others cannot hold.", glyph: "◐" },
  { name: "Transmission I", type: "MINOR ARCANA", desc: "First contact. The signal that changes everything.", glyph: "◈" },
  { name: "The Cipher", type: "MAJOR ARCANA", desc: "Hidden architecture beneath the words.", glyph: "✦" },
  { name: "Dark Night", type: "THRESHOLD", desc: "Ego dissolution as initiation.", glyph: "▲" },
];

export function TarotWaitlist({ episodeCount }: { episodeCount: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || state === "loading" || state === "done") return;
    setState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "tarot-waitlist" }),
      });
      if (res.ok) {
        setState("done");
        setMsg("Transmission received. You'll hear when the deck is ready.");
      } else {
        setState("error");
        setMsg("Something broke. Try again.");
        setTimeout(() => setState("idle"), 3000);
      }
    } catch {
      setState("error");
      setMsg("Network error. Try again.");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--term-bg)",
        fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
        padding: "48px 24px 80px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 10, color: "var(--term-fg-faint)", letterSpacing: "0.12em", marginBottom: 40 }}>
          <Link href="/" style={{ color: "var(--term-fg-faint)", textDecoration: "none" }}>CODEX</Link>
          {" / "}
          <span style={{ color: "var(--neon-3)" }}>TAROT DECK</span>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            fontSize: 10,
            color: "var(--neon-3)",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            textShadow: "var(--glow-magenta, 0 0 8px currentColor)",
            marginBottom: 12,
          }}>
            {"// CULT OF PSYCHE TAROT SYSTEM v2.0"}
          </p>
          <h1 style={{
            fontSize: 32,
            lineHeight: 1.2,
            color: "var(--term-fg)",
            letterSpacing: "-0.02em",
            margin: "0 0 20px",
          }}>
            The Cult of Psyche<br />
            <span style={{ color: "var(--neon-3)", textShadow: "var(--glow-magenta, 0 0 12px currentColor)" }}>
              Tarot Deck
            </span>
          </h1>
          <p style={{
            fontSize: 13,
            color: "var(--term-fg-dim)",
            lineHeight: 1.7,
            maxWidth: 560,
            margin: 0,
          }}>
            80 cards. Every major archetype, psychological pattern, and recurring
            force from {episodeCount} transmissions — distilled into a physical
            oracle. The archive made tangible.
          </p>
        </div>

        {/* Digital Oracle CTA */}
        <Link href="/tarot/oracle" style={{ textDecoration: "none", display: "block", marginBottom: 48 }}>
          <div style={{
            border: "1px solid var(--neon-3)",
            borderRadius: 8,
            padding: "24px 28px",
            backgroundColor: "var(--term-bg-1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,43,214,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--term-bg-1)")}
          >
            <div>
              <div style={{
                fontSize: 10,
                color: "var(--neon-3)",
                letterSpacing: "0.3em",
                marginBottom: 6,
                textShadow: "var(--glow-magenta, 0 0 6px currentColor)",
              }}>
                {"// DIGITAL ORACLE — LIVE NOW"}
              </div>
              <div style={{ fontSize: 16, color: "var(--term-fg)", fontWeight: 600, letterSpacing: "0.02em", marginBottom: 6 }}>
                Pull a reading from the archive
              </div>
              <div style={{ fontSize: 11, color: "var(--term-fg-dim)", lineHeight: 1.6, maxWidth: 420 }}>
                80 cards online. Single signal, three-card triad, or full five-position protocol.
                Every transmission drawn from the Cult of Psyche codex.
              </div>
            </div>
            <div style={{
              fontSize: 24,
              color: "var(--neon-3)",
              opacity: 0.7,
              flexShrink: 0,
              textShadow: "var(--glow-magenta, 0 0 12px currentColor)",
            }}>
              ◆ →
            </div>
          </div>
        </Link>

        {/* Two kinds of oracle — make the distinction explicit so neither gets lost */}
        <p style={{ fontSize: 11, color: "var(--term-fg-faint)", lineHeight: 1.6, margin: "0 0 48px", letterSpacing: "0.03em" }}>
          {"// "}Want answers in words, not cards?{" "}
          <Link href="/oracle" style={{ color: "var(--neon-3)", textDecoration: "none" }}>
            Ask the AI Oracle →
          </Link>{" "}
          — it searches every transcript and cites the exact episode. The Tarot above reads the same
          archive through its symbols.
        </p>

        {/* Stats strip */}
        <div style={{
          display: "flex",
          gap: 0,
          marginBottom: 48,
          border: "1px solid var(--term-line)",
          borderRadius: 6,
          overflow: "hidden",
        }}>
          {[
            { value: "80", label: "Cards" },
            { value: "22", label: "Major Arcana" },
            { value: "4", label: "Suits" },
            { value: "14", label: "Court Cards" },
          ].map(({ value, label }, i, arr) => (
            <div
              key={label}
              style={{
                flex: 1,
                padding: "16px 12px",
                textAlign: "center",
                borderRight: i < arr.length - 1 ? "1px solid var(--term-line)" : undefined,
                backgroundColor: "var(--term-bg-1)",
              }}
            >
              <div style={{ fontSize: 22, color: "var(--neon-3)", textShadow: "var(--glow-magenta, 0 0 8px currentColor)", lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontSize: 9, color: "var(--term-fg-faint)", letterSpacing: "0.1em", marginTop: 4 }}>
                {label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {/* Card preview grid */}
        <div style={{ marginBottom: 52 }}>
          <div style={{ fontSize: 10, color: "var(--term-fg-faint)", letterSpacing: "0.14em", marginBottom: 16 }}>
            {"// PREVIEW — SELECTED CARDS"}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
          }}>
            {CARD_PREVIEWS.map((card) => (
              <div
                key={card.name}
                style={{
                  border: "1px solid var(--term-line)",
                  borderRadius: 6,
                  padding: "16px 14px",
                  backgroundColor: "var(--term-bg-1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ fontSize: 28, color: "var(--neon-3)", opacity: 0.4, lineHeight: 1 }}>{card.glyph}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--term-fg)", letterSpacing: "0.02em" }}>{card.name}</div>
                <div style={{ fontSize: 8, color: "var(--neon-3)", letterSpacing: "0.14em" }}>{card.type}</div>
                <div style={{ fontSize: 10, color: "var(--term-fg-faint)", lineHeight: 1.5, marginTop: 2 }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* About the deck */}
        <div style={{
          borderLeft: "2px solid var(--neon-3)",
          paddingLeft: 20,
          marginBottom: 52,
          opacity: 0.85,
        }}>
          <p style={{ fontSize: 12, color: "var(--term-fg-dim)", lineHeight: 1.8, margin: 0 }}>
            Every card drawn directly from the Cult of Psyche archive — the
            psychological archetypes, shadow patterns, relational dynamics, and
            mythic forces that surface across thousands of conversations. Each
            card carries original art and a written transmission from the Codex.
            Physical + digital editions planned.
          </p>
        </div>

        {/* Waitlist form */}
        <div style={{
          border: "1px solid var(--neon-3)",
          borderRadius: 8,
          padding: "28px 28px 24px",
          backgroundColor: "var(--term-bg-1)",
        }}>
          <div style={{ fontSize: 10, color: "var(--neon-3)", letterSpacing: "0.3em", marginBottom: 8 }}>
            {"// JOIN THE WAITLIST"}
          </div>
          <p style={{ fontSize: 13, color: "var(--term-fg)", margin: "0 0 20px", lineHeight: 1.6 }}>
            First to know. First access. Founding supporter pricing.
          </p>

          {state === "done" ? (
            <div style={{
              padding: "14px 16px",
              border: "1px solid var(--neon-3)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--neon-3)",
              textShadow: "var(--glow-magenta, 0 0 8px currentColor)",
              letterSpacing: "0.06em",
            }}>
              ✓ {msg}
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  flex: 1,
                  minWidth: 220,
                  padding: "10px 14px",
                  backgroundColor: "var(--term-bg)",
                  border: "1px solid var(--term-line-2)",
                  borderRadius: 4,
                  color: "var(--term-fg)",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 12,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={state === "loading"}
                style={{
                  padding: "10px 22px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--neon-3)",
                  borderRadius: 4,
                  color: state === "error" ? "var(--neon-5)" : "var(--neon-3)",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: state === "loading" ? "wait" : "pointer",
                  textShadow: "var(--glow-magenta, 0 0 6px currentColor)",
                  whiteSpace: "nowrap",
                }}
              >
                {state === "loading" ? "SENDING..." :
                 state === "error"   ? (msg ?? "ERROR") :
                 "NOTIFY ME ▸"}
              </button>
            </form>
          )}

          <p style={{ fontSize: 9, color: "var(--term-fg-faint)", marginTop: 12, letterSpacing: "0.04em" }}>
            No spam. One email when the deck is ready.
          </p>
        </div>

        {/* Footer links */}
        <div style={{ marginTop: 40, display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Link href="/tarot/oracle" style={{ fontSize: 10, color: "var(--neon-3)", textDecoration: "none", letterSpacing: "0.08em" }}>
            ◆ TAROT READING
          </Link>
          <Link href="/oracle" style={{ fontSize: 10, color: "var(--term-fg-faint)", textDecoration: "none", letterSpacing: "0.08em" }}>
            ✦ AI ORACLE
          </Link>
          <Link href="/cards" style={{ fontSize: 10, color: "var(--term-fg-faint)", textDecoration: "none", letterSpacing: "0.08em" }}>
            ← DIGITAL CARDS
          </Link>
          <Link href="/episodes" style={{ fontSize: 10, color: "var(--term-fg-faint)", textDecoration: "none", letterSpacing: "0.08em" }}>
            ARCHIVE →
          </Link>
        </div>

      </div>
    </div>
  );
}
