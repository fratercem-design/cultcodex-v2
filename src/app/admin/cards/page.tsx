"use client";

import { useState } from "react";

export default function AdminCardsPage() {
  const [secret, setSecret] = useState("");
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function runSeed() {
    if (!secret) return;
    setState("running");
    setLog([]);
    setError(null);

    try {
      const res = await fetch("/api/admin/seed-cards", {
        method: "POST",
        headers: { "x-enrich-secret": secret },
      });
      const json = await res.json();
      if (!res.ok) {
        setState("error");
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setState("done");
      setLog(json.log ?? []);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Network error");
    }
  }

  return (
    <div style={{ padding: "32px 28px", maxWidth: 800, fontFamily: "var(--font-mono), monospace" }}>
      <p style={{ fontSize: 10, color: "var(--neon)", letterSpacing: "0.4em", textTransform: "uppercase", marginBottom: 8 }}>
        {"// ADMIN"}
      </p>
      <h1 style={{ fontSize: 20, color: "var(--term-fg)", margin: "0 0 6px" }}>Card System Seed</h1>
      <p style={{ fontSize: 11, color: "var(--term-fg-dim)", marginBottom: 28 }}>
        Applies the Phase 2 migration and upserts 4 packs + 30 cards. Safe to run multiple times.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          type="password"
          placeholder="ENRICH_SECRET"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            background: "var(--term-bg-1)",
            border: "1px solid var(--term-line)",
            borderRadius: 4,
            color: "var(--term-fg)",
            padding: "8px 12px",
            flex: 1,
          }}
        />
        <button
          onClick={runSeed}
          disabled={!secret || state === "running"}
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: state === "running" ? "var(--term-fg-faint)" : "var(--neon)",
            background: "transparent",
            border: `1px solid ${state === "running" ? "var(--term-line)" : "var(--neon)"}`,
            borderRadius: 4,
            padding: "8px 20px",
            cursor: state === "running" ? "wait" : "pointer",
          }}
        >
          {state === "running" ? "SEEDING..." : "RUN SEED"}
        </button>
      </div>

      {error && (
        <div style={{
          padding: "10px 14px",
          border: "1px solid var(--neon-5)",
          borderRadius: 4,
          color: "var(--neon-5)",
          fontSize: 11,
          marginBottom: 16,
        }}>
          ✗ {error}
        </div>
      )}

      {state === "done" && (
        <div style={{
          padding: "10px 14px",
          border: "1px solid var(--neon)",
          borderRadius: 4,
          color: "var(--neon)",
          fontSize: 11,
          marginBottom: 16,
        }}>
          ✓ Seed complete
        </div>
      )}

      {log.length > 0 && (
        <div style={{
          background: "var(--term-bg-1)",
          border: "1px solid var(--term-line)",
          borderRadius: 4,
          padding: "14px 16px",
          fontSize: 10,
          color: "var(--term-fg-dim)",
          lineHeight: 1.8,
          maxHeight: 480,
          overflowY: "auto",
        }}>
          {log.map((line, i) => (
            <div
              key={i}
              style={{
                color: line.startsWith("✓") ? "var(--neon)" :
                       line.startsWith("✗") ? "var(--neon-5)" :
                       line.startsWith("──") ? "var(--neon-4)" :
                       "var(--term-fg-dim)",
              }}
            >
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
