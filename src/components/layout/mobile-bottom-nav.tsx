"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface CompassItem {
  href: string;
  label: string;
  glyph: string;
}

// The dossier's primary-4 nav hierarchy (Ch. IV) + search — the touch-zone
// replacement for the sidebar, which simply vanishes below 900px with no
// substitute (Ch. V: "put navigation there as a sigil compass").
const COMPASS_ITEMS: CompassItem[] = [
  { href: "/", label: "Overview", glyph: "▢" },
  { href: "/episodes", label: "Archive", glyph: "▦" },
  { href: "/oracle", label: "Oracle", glyph: "◉" },
  { href: "/cards", label: "Cards", glyph: "⧬" },
];

function isActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary (mobile)">
      {COMPASS_ITEMS.map((item) => {
        const active = isActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="mobile-bottom-nav__item"
            style={{ color: active ? "var(--neon)" : "var(--term-fg-dim)" }}
            aria-current={active ? "page" : undefined}
          >
            <span aria-hidden="true" className="mobile-bottom-nav__glyph">
              {item.glyph}
            </span>
            <span className="mobile-bottom-nav__label">{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("cultcodex:openCommandPalette"))}
        className="mobile-bottom-nav__item"
        style={{ color: "var(--term-fg-dim)" }}
        aria-label="Search the archive"
      >
        <span aria-hidden="true" className="mobile-bottom-nav__glyph">⌕</span>
        <span className="mobile-bottom-nav__label">Search</span>
      </button>
    </nav>
  );
}
