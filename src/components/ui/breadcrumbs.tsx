import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 py-2">
      <ol className="flex flex-wrap items-center gap-1 font-mono text-[12px] text-text-muted">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-border">/</span>}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-accent-gold-text"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-text-primary" : ""}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
