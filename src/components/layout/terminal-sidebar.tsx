"use client";

import { useEffect, useMemo, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type AccentKey = "neon" | "neon-4";

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly glyph: string;
  readonly key?: string;
  readonly badge?: string;
  readonly accent?: AccentKey;
}

interface NavGroup {
  readonly title: string;
  readonly items: readonly NavItem[];
}

const NAV_GROUPS: readonly NavGroup[] = [
  {
    title: "MAIN",
    items: [
      { href: "/", label: "OVERVIEW", glyph: "▢", key: "1" },
      { href: "/episodes", label: "ARCHIVE", glyph: "▦", key: "2", badge: "2594" },
      { href: "/oracle", label: "ORACLE", glyph: "◉", key: "3" },
      { href: "/topics", label: "SIGNALS", glyph: "◈", key: "4", badge: "3776" },
      { href: "/people", label: "VOICES", glyph: "◐", key: "5", badge: "669" },
      { href: "/graph", label: "NETWORK MAP", glyph: "✦", key: "6" },
      { href: "/psychenomicon", label: "PSYCHENOMICON", glyph: "▲", key: "7" },
      { href: "/collections", label: "COLLECTIONS", glyph: "▣", key: "8" },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { href: "/lexicon", label: "LEXICON", glyph: "≣" },
      { href: "/corrections", label: "CORRECTIONS", glyph: "✕" },
    ],
  },
  {
    title: "ACCESS",
    items: [
      { href: "/premium", label: "INITIATE+", glyph: "✦", accent: "neon-4" },
      { href: "/start-here", label: "START HERE", glyph: "↳" },
    ],
  },
];

/**
 * Determine whether a nav item is "active" for the current pathname.
 *
 * - "/" matches only when the pathname is exactly "/" so it never wins for
 *   deeper routes.
 * - All other hrefs match exact or `${href}/...` prefix.
 */
function isActive(href: string, pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function accentColor(accent: AccentKey | undefined): string {
  if (accent === "neon-4") {
    return "var(--neon-4)";
  }
  return "var(--term-fg-dim)";
}

export function TerminalSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Build a stable key→href map for the keyboard shortcuts.
  const keyMap = useMemo<ReadonlyMap<string, string>>(() => {
    const map = new Map<string, string>();
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (item.key) {
          map.set(item.key, item.href);
        }
      }
    }
    return map;
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      // Ignore when the user is typing in an input/textarea/contentEditable
      // or when modifier keys are held (let browser/system shortcuts win).
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      const href = keyMap.get(event.key);
      if (href) {
        event.preventDefault();
        router.push(href);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
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
        fontFamily:
          "var(--font-mono), 'JetBrains Mono', 'IBM Plex Mono', monospace",
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
              // {group.title}
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {group.items.map((item) => {
                const active = isActive(item.href, pathname);
                const baseColor = accentColor(item.accent);
                const itemStyle: CSSProperties = {
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "5px 14px 5px 12px",
                  borderLeft: "2px solid transparent",
                  color: active ? "var(--neon)" : baseColor,
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  textDecoration: "none",
                  transition:
                    "color 120ms linear, background 120ms linear, border-color 120ms linear",
                };
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={active ? "term-nav-active" : undefined}
                      style={itemStyle}
                      data-key={item.key}
                      aria-current={active ? "page" : undefined}
                    >
                      <span
                        aria-hidden="true"
                        style={{ width: 14, display: "inline-block" }}
                      >
                        {item.glyph}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.badge ? (
                        <span
                          style={{
                            fontSize: 9,
                            color: "var(--term-fg-faint)",
                            border: "1px solid var(--term-line-2)",
                            borderRadius: 2,
                            padding: "1px 4px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                      {item.key ? (
                        <span
                          aria-hidden="true"
                          style={{
                            fontSize: 9,
                            color: "var(--term-fg-faint)",
                            border: "1px solid var(--term-line-2)",
                            borderRadius: 2,
                            padding: "1px 4px",
                            minWidth: 14,
                            textAlign: "center",
                          }}
                        >
                          {item.key}
                        </span>
                      ) : null}
                    </Link>
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span>ARCHIVE</span>
          <span style={{ color: "var(--neon)" }}>47%</span>
        </div>
        <div
          style={{
            height: 4,
            backgroundColor: "var(--term-line)",
            borderRadius: 1,
            overflow: "hidden",
          }}
          role="progressbar"
          aria-label="Archive integrity"
          aria-valuenow={47}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            style={{
              width: "47%",
              height: "100%",
              backgroundColor: "var(--neon)",
              boxShadow: "var(--glow-neon)",
            }}
          />
        </div>
        <div style={{ marginTop: 6 }}>INTEGRITY: NOMINAL</div>
      </div>
    </aside>
  );
}
