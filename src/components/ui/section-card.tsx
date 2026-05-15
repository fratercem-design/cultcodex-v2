import { cn } from "@/lib/utils";
import { TitleOrnament } from "@/components/graphics/mystical-divider";

interface SectionCardProps {
  title?: string;
  className?: string;
  ornament?: boolean;
  children: React.ReactNode;
}

export function SectionCard({ title, className, ornament = false, children }: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-4",
        className
      )}
    >
      {title && (
        <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
          {ornament && <TitleOrnament />}
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
