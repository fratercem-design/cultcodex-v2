"use client";

import Link from "next/link";

export default function OraclePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

      {/* Minimal top bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        borderBottom: "1px solid var(--term-line)",
        backgroundColor: "var(--term-bg)",
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/tarot" style={{
            fontSize: 10,
            color: "var(--term-fg-faint)",
            textDecoration: "none",
            letterSpacing: "0.1em",
          }}>
            ← TAROT
          </Link>
          <span style={{
            fontSize: 10,
            color: "var(--term-fg-faint)",
            letterSpacing: "0.06em",
            opacity: 0.4,
          }}>
            /
          </span>
          <span style={{
            fontSize: 10,
            color: "var(--neon-3)",
            letterSpacing: "0.2em",
            textShadow: "var(--glow-magenta, 0 0 6px currentColor)",
          }}>
            ARCANUM ORACLE
          </span>
        </div>
        <span style={{
          fontSize: 9,
          color: "var(--term-fg-faint)",
          letterSpacing: "0.12em",
          opacity: 0.5,
        }}>
          CULTCODEX // v2.0
        </span>
      </div>

      {/* Oracle iframe — full remaining height */}
      <iframe
        src="https://tarot-oracle-production.up.railway.app"
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          display: "block",
        }}
        title="Cult of Psyche Arcanum Oracle"
        allow="fullscreen"
      />
    </div>
  );
}
