"use client";

import { useEffect, useMemo, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ArchiveCounts } from "@/lib/queries/stats";
import type { LiveChannels } from "@/lib/queries/live-status";

type AccentKey = "neon" | "neon-4";
type CountKey = keyof Pick<ArchiveCounts, "episodes" | "topics" | "people">;
type LiveKey = keyof LiveChannels;

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly glyph: string;
  readonly key?: string;
  readonly countKey?: CountKey;
  readonly accent?: AccentKey;
  readonly liveKey?: LiveKey;
  readonly external?: boolean;
}

interface NavGroup {
  readonly title: string;
  readonly items: readonly NavItem[];
}

const NAV_GROUPS: readonly NavGroup[] = [
  {
    title: "LIVE",
    items: [
      { href: "/cult-live",                                    label: "CULT OF PSYCHE",   glyph: "◎", liveKey: "cultOfPsyche"   },
      { href: "https://www.youtube.com/@AlexandraMayers",     label: "ALEXANDRA MAYERS", glyph: "◎", liveKey: "alexandraMayers", external: true },
    ],
  },
  {
    title: "MAIN",
    items: [
      { href: "/",              label: "OVERVIEW",      glyph: "▢", key: "1" },
      { href: "/episodes",      label: "ARCHIVE",       glyph: "▦", key: "2", countKey: "episodes" },
      { href: "/oracle",        label: "ORACLE",        glyph: "◉", key: "3" },
      { href: "/topics",        label: "SIGNALS",       glyph: "◈", key: "4", countKey: "topics" },
      { href: "/people",        label: "VOICES",        glyph: "◐", key: "5", countKey: "people" },
      { href: "/graph",         label: "NETWORK MAP",   glyph: "✦", key: "6" },
      { href: "/psychenomicon", label: "PSYCHENOMICON", glyph: "▲", key: "7" },
      { href: "/collections",   label: "COLLECTIONS",   glyph: "▣", key: "8" },
    ],
  },
  {
    title: "COLLECT",
    items: [
      { href: "/cards",       label: "CARD COLLECTION", glyph: "◈", key: "9" },
      { href: "/cards/packs", label: "PACK STORE",      glyph: "▣" },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { href: "/lexicon",             label: "LEXICON",      glyph: "≣" },
      { href: "/corrections",         label: "CORRECTIONS",  glyph: "✕" },
      { href: "/about/methodology",   label: "METHODOLOGY",  glyph: "◇" },
    ],
  },
  {
    title: "ACCESS",
    items: [
      { href: "/premium",     label: "INITIATE+",   glyph: "✦", accent: "neon-4" },
      { href: "/salon",       label: "THE SALON",   glyph: "◈" },
      { href: "/this-week",   label: "THIS WEEK",   glyph: "◑" },
      { href: "/start-here",  label: "START HERE",  glyph: "↳" },
      { href: "/tarot",       label: "TAROT DECK",  glyph: "✦", accent: "neon-4" },
    ],
  },
];

function isActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function accentColor(accent: AccentKey | undefined): string {
  return accent === "neon-4" ? "var(--neon-4)" : "var(--term-fg-dim)";
}

const badgeStyle: CSSProperties = {
  fontSize: 9,
  color: "var(--term-fg-faint)",
  border: "1px solid var(--term-line-2)",
  borderRadius: 2,
  padding: "1px 4px",
  letterSpacing: "0.04em",
};

const keyStyle: CSSProperties = {
  fontSize: 9,
  color: "var(--term-fg-faint)",
  border: "1px solid var(--term-line-2)",
  borderRadius: 2,
  padding: "1px 4px",
  minWidth: 14,
  textAlign: "center",
};

const liveBadgeStyle: CSSProperties = {
  fontSize: 8,
  fontWeight: "bold",
  letterSpacing: "0.1em",
  color: "rgba(239,68,68,0.85)",
  border: "1px solid rgba(239,68,68,0.35)",
  borderRadius: 2,
  padding: "1px 4px",
};

interface TerminalSidebarProps {
  counts: ArchiveCounts;
  liveChannels?: LiveChannels;
}

export function TerminalSidebar({ counts, liveChannels }: TerminalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const integrityPct = counts.episodes > 0
    ? Math.round((counts.transcribedEpisodes / counts.episodes) * 100)
    : 0;

  const keyMap = useMemo<ReadonlyMap<string, string>>(() => {
    const map = new Map<string, string>();
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (item.key) map.set(item.key, item.href);
      }
    }
    return map;
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      }
      const href = keyMap.get(event.key);
      if (href) {
        event.preventDefault();
        router.push(href);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyMap, router]);

  return (
    <aside
      className="terminal-sidebar"
      style={{
        width: 220,
        borderRight: "1px solid var(--term-line)",
        backgroundColor: "var(--term-bg-1)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-mono), 'JetBrains Mono', 'IBM Plex Mono', monospace",
      }}
      aria-label="Primary"
    >
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.title} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "var(--term-fg-faint)",
                padding: "0 14px",
                marginBottom: 6,
              }}
            >
              {"// "}
              {group.title}
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {group.items.map((item) => {
                const active = !item.external && isActive(item.href, pathname);
                const isLive = item.liveKey ? (liveChannels?.[item.liveKey] ?? false) : false;

                const itemColor = active
                  ? "var(--neon)"
                  : isLive
                  ? "rgba(239,68,68,0.9)"
                  : accentColor(item.accent);

                const itemStyle: CSSProperties = {
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "5px 14px 5px 12px",
                  borderLeft: "2px solid transparent",
                  color: itemColor,
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  textDecoration: "none",
                  transition: "color 120ms linear, background 120ms linear, border-color 120ms linear",
                };

                const badgeText = item.countKey
                  ? counts[item.countKey].toLocaleString()
                  : null;

                const inner = (
                  <>
                    <span aria-hidden="true" style={{ width: 14, display: "inline-block" }}>
                      {isLive ? (
                        <span className="term-pulse" style={{ color: "rgba(239,68,68,0.9)" }}>●</span>
                      ) : (
                        item.glyph
                      )}
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {isLive && <span style={liveBadgeStyle}>LIVE</span>}
                    {!isLive && badgeText && <span style={badgeStyle}>{badgeText}</span>}
                    {!isLive && item.key && <span aria-hidden="true" style={keyStyle}>{item.key}</span>}
                  </>
                );

                return (
                  <li key={item.href}>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={itemStyle}
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className={active ? "term-nav-active" : undefined}
                        style={itemStyle}
                        data-key={item.key}
                        aria-current={active ? "page" : undefined}
                      >
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: archive integrity meter */}
      <div
        style={{
          borderTop: "1px solid var(--term-line)",
          padding: "10px 14px",
          fontSize: 10,
          color: "var(--term-fg-faint)",
          letterSpacing: "0.08em",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span>TRANSCRIBED</span>
          <span style={{ color: "var(--neon)" }}>{integrityPct}%</span>
        </div>
        <div
          style={{
            height: 4,
            backgroundColor: "var(--term-line)",
            borderRadius: 1,
            overflow: "hidden",
          }}
          role="progressbar"
          aria-label="Transcript coverage"
          aria-valuenow={integrityPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            style={{
              width: `${integrityPct}%`,
              height: "100%",
              backgroundColor: "var(--neon)",
              boxShadow: "var(--glow-neon)",
              transition: "width 600ms ease",
            }}
          />
        </div>
        <div style={{ marginTop: 6 }}>
          {counts.transcribedEpisodes.toLocaleString()} / {counts.episodes.toLocaleString()} eps
        </div>
      </div>
    </aside>
  );
}
