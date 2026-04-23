import Link from "next/link";

export type SectionAccent = "gold" | "cyan" | "violet" | "crimson" | "muted";

const ACCENT: Record<
  SectionAccent,
  {
    bar: string;        // left-bar / dot color
    heading: string;    // heading text
    badge: string;      // count badge
    viewAll: string;    // "view all" link
  }
> = {
  gold: {
    bar: "bg-accent-gold",
    heading: "text-accent-gold",
    badge: "border-accent-gold/30 bg-accent-gold/10 text-accent-gold",
    viewAll: "text-accent-gold hover:text-accent-gold/80",
  },
  cyan: {
    bar: "bg-accent-cyan",
    heading: "text-accent-cyan",
    badge: "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan",
    viewAll: "text-accent-cyan hover:text-accent-cyan/80",
  },
  violet: {
    bar: "bg-accent-violet",
    heading: "text-accent-violet",
    badge: "border-accent-violet/30 bg-accent-violet/10 text-accent-violet",
    viewAll: "text-accent-violet hover:text-accent-violet/80",
  },
  crimson: {
    bar: "bg-accent-crimson",
    heading: "text-accent-crimson",
    badge: "border-accent-crimson/30 bg-accent-crimson/10 text-accent-crimson",
    viewAll: "text-accent-crimson hover:text-accent-crimson/80",
  },
  muted: {
    bar: "bg-text-muted/40",
    heading: "text-text-muted",
    badge: "border-border bg-elevated text-text-muted",
    viewAll: "text-text-muted hover:text-text-primary",
  },
};

interface SectionGroupProps {
  title: string;
  accent: SectionAccent;
  count: number;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
}

export function SectionGroup({
  title,
  accent,
  count,
  description,
  viewAllHref,
  viewAllLabel,
  children,
}: SectionGroupProps) {
  const a = ACCENT[accent];

  return (
    <section className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Colored bar */}
          <div className={`h-5 w-1 rounded-full ${a.bar}`} aria-hidden="true" />
          <h2 className={`font-display text-base font-bold tracking-tight ${a.heading}`}>
            {title}
          </h2>
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${a.badge}`}
          >
            {count.toLocaleString()}
          </span>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className={`font-mono text-[11px] font-medium transition-colors ${a.viewAll}`}
          >
            {viewAllLabel ?? "View all →"}
          </Link>
        )}
      </div>
      {description && (
        <p className="pl-4 font-mono text-[11px] text-text-muted leading-relaxed">
          {description}
        </p>
      )}
      {children}
    </section>
  );
}
