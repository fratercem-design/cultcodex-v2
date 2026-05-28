"use client";

import { usePathname } from "next/navigation";

/**
 * Derive a short, human-friendly path label from the current pathname
 * for the terminal-style topbar (e.g. "/episodes/abc" -> "episodes").
 *
 * Rules:
 *   - "/" or empty -> "overview"
 *   - "/segment/..."" -> first segment lowercased
 *   - Falls back to "overview" for anything unexpected
 */
function deriveLabel(pathname: string | null): string {
  if (!pathname || pathname === "/" || pathname === "") {
    return "overview";
  }
  const first = pathname.split("/").filter(Boolean)[0];
  if (!first) {
    return "overview";
  }
  return first.toLowerCase();
}

export function TerminalPathSeg() {
  const pathname = usePathname();
  const label = deriveLabel(pathname);

  return (
    <span
      className="font-mono text-[11px] tracking-wide"
      style={{ color: "var(--term-fg-dim)" }}
    >
      <span style={{ color: "var(--term-fg-faint)" }}>~/codex/</span>
      <span style={{ color: "var(--term-fg)" }}>{label}</span>
      <span
        className="term-blink"
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: "0.5ch",
          marginLeft: "1px",
          color: "var(--neon)",
        }}
      >
        _
      </span>
    </span>
  );
}
