import Link from "next/link";

/**
 * Global content footer. Lives at the bottom of `terminal-main`, above the
 * 24px telemetry status bar. Gives every page a real, crawlable link cluster:
 * archive sections (so /series and /lore are never orphaned), account/support,
 * the legal pages (Stripe requires these be easily accessible), and the
 * channels. Server component — no interactivity.
 */

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Archive",
    links: [
      { label: "Episodes", href: "/episodes" },
      { label: "People", href: "/people" },
      { label: "Topics", href: "/topics" },
      { label: "Lore", href: "/lore" },
      { label: "Series", href: "/series" },
      { label: "Psychenomicon", href: "/psychenomicon" },
    ],
  },
  {
    heading: "Explore",
    links: [
      { label: "Ask the Oracle", href: "/oracle" },
      { label: "Search", href: "/search" },
      { label: "This Week", href: "/this-week" },
      { label: "Start Here", href: "/start-here" },
      { label: "Premium", href: "/premium" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Cult Master's Guide", href: "/guide" },
      { label: "Contact", href: "/contact" },
      { label: "Corrections", href: "/corrections" },
      { label: "Account Settings", href: "/settings" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund" },
    ],
  },
];

const CHANNELS: { label: string; href: string }[] = [
  { label: "@CultofPsyche", href: "https://www.youtube.com/@cultofpsyche" },
  { label: "@PsychesNightmares", href: "https://www.youtube.com/@psychesnightmares" },
  { label: "@NightmareFrequenciesTV", href: "https://www.youtube.com/@nightmarefrequenciestv" },
];

export function SiteFooter() {
  const year = new Date().getUTCFullYear();

  return (
    <footer
      aria-label="Site footer"
      className="mt-16 border-t border-accent-gold/15 bg-void/40"
      style={{ borderTopColor: "var(--term-line)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand cell */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <span className="font-display text-lg font-black uppercase tracking-tight text-accent-gold">
              CULT CODEX
            </span>
            <p className="mt-2 max-w-xs font-mono text-[11px] leading-relaxed text-text-muted">
              The searchable archive of the Cult of Psyche — episodes, transcripts, lore,
              and the Oracle.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {col.heading}
              </h2>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-mono text-xs text-text-primary transition-colors hover:text-accent-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-accent-gold/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            © {year} Cult of Psyche · CultCodex
          </p>
          <nav aria-label="Channels" className="flex flex-wrap gap-x-4 gap-y-2">
            {CHANNELS.map((ch) => (
              <a
                key={ch.href}
                href={ch.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] uppercase tracking-wider text-text-muted transition-colors hover:text-accent-gold"
              >
                {ch.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
