import Link from "next/link";

interface GlanceItem {
  icon?: React.ReactNode;
  label: string;
  href?: string;
  variant?: "default" | "purple";
}

interface EntityGlanceBarProps {
  items: GlanceItem[];
}

export function EntityGlanceBar({ items }: EntityGlanceBarProps) {
  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => {
          const className =
            item.variant === "purple"
              ? "inline-flex items-center gap-1.5 rounded-full border border-accent-purple/30 bg-accent-purple-dim px-2.5 py-1 font-mono text-[12px] text-accent-violet-text transition-colors hover:border-accent-purple/50"
              : "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[12px] text-text-muted";

          const content = (
            <>
              {item.icon && <span className="flex items-center text-xs">{item.icon}</span>}
              {item.label}
            </>
          );

          if (item.href) {
            return (
              <Link key={i} href={item.href} className={className}>
                {content}
              </Link>
            );
          }

          return (
            <span key={i} className={className}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
