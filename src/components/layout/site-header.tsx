import Image from "next/image";
import Link from "next/link";
import { auth, type SessionWithCodex } from "@/lib/auth";
import { UserMenu } from "@/components/auth/user-menu";

const navItems = [
  { label: "Live", href: "/live" },
  { label: "Episodes", href: "/episodes" },
  { label: "People", href: "/people" },
  { label: "Lore", href: "/lore" },
  { label: "Series", href: "/series" },
  { label: "Quotes", href: "/quotes" },
  { label: "Transcripts", href: "/transcripts" },
  { label: "Stats", href: "/stats" },
  { label: "Topics", href: "/topics" },
];

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

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-xs uppercase tracking-wider text-text-muted hover:text-accent-green transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="font-mono text-xs text-text-muted hover:text-accent-green border border-border rounded px-3 py-1 transition-colors"
            aria-label="Search the archive"
          >
            ⌘K Search
          </Link>
          <UserMenu user={(session as SessionWithCodex)?.codexUser ?? null} />
        </div>
      </div>
    </header>
  );
}
