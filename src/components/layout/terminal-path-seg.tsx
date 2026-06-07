"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Interactive terminal-style breadcrumb for the topbar.
 *
 * Renders the current path as clickable cumulative segments, e.g.
 *   ~/codex/episodes/some-episode
 * where "episodes" links to /episodes and the leaf is the current page.
 * Falls back to "overview" at the root.
 */
export function TerminalPathSeg() {
  const pathname = usePathname();
  const segments = (pathname ?? "/").split("/").filter(Boolean);

  const crumbs = segments.length === 0 ? [{ label: "overview", href: "/" }] : segments.map((seg, i) => ({
    label: decodeURIComponent(seg).toLowerCase().replace(/-/g, " ").slice(0, 28),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <span className="font-mono text-[11px] tracking-wide" style={{ color: "var(--term-fg-dim)" }}>
      <Link href="/" style={{ color: "var(--term-fg-faint)" }} className="hover:opacity-80 transition-opacity">
        ~/codex/
      </Link>
      {crumbs.map((c, i) => {
        const isLeaf = i === crumbs.length - 1;
        return (
          <span key={c.href}>
            {isLeaf ? (
              <span style={{ color: "var(--term-fg)" }}>{c.label}</span>
            ) : (
              <Link
                href={c.href}
                style={{ color: "var(--term-fg-dim)" }}
                className="hover:opacity-80 transition-opacity"
              >
                {c.label}
              </Link>
            )}
            {!isLeaf && <span style={{ color: "var(--term-fg-faint)" }}>/</span>}
          </span>
        );
      })}
      <span
        className="term-blink"
        aria-hidden="true"
        style={{ display: "inline-block", width: "0.5ch", marginLeft: "1px", color: "var(--neon)" }}
      >
        _
      </span>
    </span>
  );
}
