import Image from "next/image";
import Link from "next/link";
import { auth, type SessionWithCodex } from "@/lib/auth";
import { UserMenu } from "@/components/auth/user-menu";
import { IconSearch } from "@/components/graphics/codex-icons";

/*
 * Color-coded navigation groups:
 *   Gold    — Archive (core content: episodes, people, quotes)
 *   Cyan    — Explore (discovery: lore, series, collections, topics)
 *   Violet  — Reference (meta: lexicon, timeline, stats, mythic map)
 */
const navItems = [
  // Archive — core content (gold)
  { label: "Episodes", href: "/episodes", group: "archive" as const },
  { label: "People", href: "/people", group: "archive" as const },
  { label: "Quotes", href: "/quotes", group: "archive" as const },
  // Explore — discovery (cyan)
  { label: "Lore", href: "/lore", group: "explore" as const },
  { label: "Series", href: "/series", group: "explore" as const },
  { label: "Collections", href: "/collections", group: "explore" as const },
  { label: "Topics", href: "/topics", group: "explore" as const },
  // Reference — meta pages (violet)
  { label: "Lexicon", href: "/lexicon", group: "reference" as const },
  { label: "Timeline", href: "/timeline", group: "reference" as const },
  { label: "Stats", href: "/stats", group: "reference" as const },
];

const groupColors = {
  archive: "text-accent-gold hover:text-accent-gold",
  explore: "text-accent-cyan hover:text-accent-cyan",
  reference: "text-accent-violet hover:text-accent-violet",
} as const;

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-void/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm font-bold tracking-widest text-accent-green"
        >
          <Image
            src="/logo.jpg"
            alt="CultCodex"
            width={28}
            height={28}
            className="rounded-full border border-accent-gold/50"
          />
          CULTCODEX
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {/* Start Here — standalone accent */}
          <Link
            href="/start-here"
            className="font-mono text-xs uppercase tracking-wider px-2 py-1 rounded text-accent-gold hover:bg-accent-gold-dim transition-colors"
          >
            Start Here
          </Link>
          <span className="text-border mx-1">|</span>
          {/* Grouped nav items with color coding */}
          {navItems.map((item, i) => {
            const prevGroup = i > 0 ? navItems[i - 1].group : null;
            const showDivider = prevGroup && prevGroup !== item.group;
            return (
              <span key={item.href} className="flex items-center">
                {showDivider && <span className="text-border mx-1">|</span>}
                <Link
                  href={item.href}
                  className={`font-mono text-xs uppercase tracking-wider px-2 py-1 rounded transition-colors opacity-80 hover:opacity-100 ${groupColors[item.group]}`}
                >
                  {item.label}
                </Link>
              </span>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-accent-green border border-border rounded px-3 py-1 transition-colors"
            aria-label="Search the archive"
          >
            <IconSearch size={14} className="text-text-muted" />
            Search
          </Link>
          <UserMenu user={(session as SessionWithCodex)?.codexUser ?? null} />
        </div>
      </div>
    </header>
  );
}
