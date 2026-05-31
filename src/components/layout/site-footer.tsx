import Link from "next/link";

const POLICY_LINKS = [
  { href: "/methodology", label: "Methodology" },
  { href: "/content-policy", label: "Content Policy" },
  { href: "/corrections", label: "Corrections" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-border/40 mt-auto py-5 px-4"
      style={{ backgroundColor: "var(--term-bg-1)" }}
    >
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[9px] text-text-muted/40 uppercase tracking-widest">
          © {year} CultCodex &nbsp;·&nbsp; Fan archive, not affiliated with Cult of Psyche
        </p>
        <nav aria-label="Site policies" className="flex flex-wrap gap-x-4 gap-y-1">
          {POLICY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-[9px] text-text-muted/40 uppercase tracking-widest hover:text-text-muted transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://www.youtube.com/@cultofpsyche"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] text-text-muted/40 uppercase tracking-widest hover:text-text-muted transition-colors"
          >
            YouTube ↗
          </a>
        </nav>
      </div>
    </footer>
  );
}
