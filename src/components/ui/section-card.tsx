import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export function SectionCard({ title, className, children }: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-4",
        className
      )}
    >
      {title && (
        <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
