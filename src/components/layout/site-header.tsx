import Image from "next/image";
import Link from "next/link";
import { auth, type SessionWithCodex } from "@/lib/auth";
import { UserMenu } from "@/components/auth/user-menu";
import { IconSearch } from "@/components/graphics/codex-icons";
import { SearchTrigger } from "@/components/search/search-trigger";

/*
 * Codex top bar — mythic identity, minimal surface.
 *
 * Primary nav is the user's entry gate + the three core content surfaces:
 *   SIGNALS       → /topics      (themes, concepts, threads)
 *   TRANSMISSIONS → /episodes    (the full catalog)
 *   COLLECTIONS   → /collections (curated groupings)
 *
 * Route paths stay the same (/topics, /episodes, /collections) to preserve
 * SEO, inbound links, and server code. Only the visible labels change.
 *
 * The older discovery/reference links (People, Quotes, Lore, Series, Lexicon,
 * Timeline, Stats, Members, Transcripts) are now reached via /start-here,
 * which is the canonical map of the archive.
 */
const PRIMARY_NAV = [
  { label: "Archive", href: "/episodes" },
  { label: "Signals", href: "/topics" },
  { label: "Collections", href: "/collections" },
  { label: "Psychenomicon", href: "/psychenomicon", accent: "violet" },
  { label: "Initiation", href: "/premium", accent: "gold" },
] as const;

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-void/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm font-bold tracking-widest text-accent-gold"
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

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Start Here — the doorway */}
          <Link
            href="/start-here"
            className="font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded text-accent-gold border border-accent-gold/30 hover:bg-accent-gold-dim hover:border-accent-gold/60 transition-colors"
          >
            Start Here
          </Link>
          <span className="text-border mx-2">·</span>
          {/* The three core surfaces */}
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                "accent" in item && item.accent === "violet"
                  ? "font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded text-accent-violet border border-accent-violet/30 hover:bg-accent-violet/10 hover:border-accent-violet/60 transition-colors"
                  : "accent" in item && item.accent === "gold"
                  ? "font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded text-accent-gold border border-accent-gold/30 hover:bg-accent-gold/10 hover:border-accent-gold/60 transition-colors"
                  : "font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded text-text-primary hover:text-accent-gold hover:bg-accent-gold-dim transition-colors"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side: search, premium, profile */}
        <div className="flex items-center gap-2">
          <SearchTrigger />
          <UserMenu user={(session as SessionWithCodex)?.codexUser ?? null} />
        </div>
      </div>
    </header>
  );
}
