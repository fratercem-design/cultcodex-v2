"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { announceUnsealed, type UnsealedCard } from "./unlock-events";

/**
 * A barely-visible glyph that grants a secret card. `knocks` > 1 means it has
 * to be clicked that many times in a row, each within 2.5s of the last.
 * Deliberately dependency-light: it sits in the site footer on every page.
 */
export function SecretSigil({
  code,
  glyph = "✶",
  knocks = 1,
  className,
  label = "A faint mark",
  subtle = true,
}: {
  code: string;
  glyph?: string;
  knocks?: number;
  className?: string;
  label?: string;
  /** false = render at full strength (e.g. the Codex season seal). */
  subtle?: boolean;
}) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [lastAt, setLastAt] = useState(0);
  const [hover, setHover] = useState(false);

  async function knock() {
    const now = Date.now();
    const next = now - lastAt < 2500 ? count + 1 : 1;
    setLastAt(now);
    if (next < knocks) { setCount(next); return; }
    setCount(0);
    const res = await fetch("/api/cards/secret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => null);
    if (res?.status === 401) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const json = res?.ok ? ((await res.json()) as { card: UnsealedCard | null }) : null;
    if (json?.card) announceUnsealed([json.card]);
  }

  return (
    <button
      type="button"
      className={className}
      onClick={knock}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={label}
      style={{
        background: "none", border: 0, padding: 0, margin: 0, font: "inherit", color: "inherit", cursor: "default",
        opacity: subtle ? (hover ? 0.6 : 0.18) : 1, transition: "opacity 0.6s, transform 0.2s",
        transform: count > 0 ? `scale(${1 - count * 0.03})` : undefined,
      }}
    >
      {glyph}
    </button>
  );
}
