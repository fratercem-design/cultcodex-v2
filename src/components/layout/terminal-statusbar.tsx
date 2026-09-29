"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * Terminal-style status bar (24px). Client component.
 *
 * Layout (left → right):
 *   [● SIGNAL_OK]  [CONN: TLS/1.3]  [FEED: 2,594]     [○ ORACLE_LIVE] [BUILD: vX] [UTC HH:MM:SS]
 *
 * SIGNAL is the service (this page rendered); FEED is whether the archive
 * could be read. They fail independently — a healthy server reading an
 * unreachable or empty database must not report ORACLE_LIVE (2026-09-25
 * audit). The Oracle answers from the archive, so it follows the feed.
 *
 * The UTC clock updates once per second from a useEffect interval. The
 * initial render returns an empty time string so the server-rendered output
 * matches the first client render (avoids hydration mismatch).
 */


function formatUtc(date: Date): string {
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

const cellStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "0 10px",
  borderRight: "1px solid var(--term-line)",
  height: "100%",
  whiteSpace: "nowrap",
};

const cellStyleNoBorder: CSSProperties = {
  ...cellStyle,
  borderRight: "none",
};

const cellStyleLeftBorder: CSSProperties = {
  ...cellStyle,
  borderRight: "none",
  borderLeft: "1px solid var(--term-line)",
};

interface TerminalStatusBarProps {
  /** Episodes in the archive; null when the archive can't be read. */
  feedCount: number | null;
}

export function TerminalStatusBar({ feedCount }: TerminalStatusBarProps) {
  const feedOk = feedCount !== null;
  const [utc, setUtc] = useState<string>("");

  useEffect(() => {
    function tick(): void {
      setUtc(formatUtc(new Date()));
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  return (
    <footer
      className="terminal-statusbar"
      style={{
        height: 24,
        borderTop: "1px solid var(--term-line)",
        backgroundColor: "var(--term-bg-1)",
        color: "var(--term-fg-dim)",
        fontFamily:
          "var(--font-mono), 'JetBrains Mono', 'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "space-between",
      }}
      aria-label="System status"
    >
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <span style={cellStyle}>
          <span
            className="term-pulse"
            aria-hidden="true"
            style={{ color: "var(--neon)", textShadow: "var(--glow-neon)" }}
          >
            ●
          </span>
          <span style={{ color: "var(--neon)" }}>SIGNAL_OK</span>
        </span>
        <span style={cellStyle}>CONN: TLS/1.3</span>
        <span style={cellStyle}>
          {feedOk ? (
            <>FEED: {feedCount.toLocaleString("en-US")}</>
          ) : (
            <span style={{ color: "var(--neon-4)" }}>FEED: UNAVAILABLE</span>
          )}
        </span>
      </div>

      <div className="statusbar-right" style={{ alignItems: "stretch" }}>
        <span style={cellStyleLeftBorder}>
          <span
            aria-hidden="true"
            style={{
              color: feedOk ? "var(--neon-3)" : "var(--neon-4)",
              textShadow: feedOk ? "var(--glow-magenta)" : "none",
            }}
          >
            ○
          </span>
          <span style={{ color: feedOk ? "var(--neon-3)" : "var(--neon-4)" }}>
            {feedOk ? "ORACLE_LIVE" : "ORACLE_OFFLINE"}
          </span>
        </span>
        <span style={cellStyleNoBorder} suppressHydrationWarning>
          <span style={{ color: "var(--term-fg-faint)" }}>UTC</span>
          <span style={{ color: "var(--term-fg)" }}>{utc || "--:--:--"}</span>
        </span>
      </div>
    </footer>
  );
}
