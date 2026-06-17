import { cn } from "@/lib/utils";
import { TitleOrnament } from "@/components/graphics/mystical-divider";

export type SectionAccent = "gold" | "cyan" | "violet" | "red" | "muted";

interface SectionCardProps {
  title?: string;
  className?: string;
  ornament?: boolean;
  accent?: SectionAccent;
  children: React.ReactNode;
}

const ACCENT_TITLE: Record<SectionAccent, string> = {
  gold:   "text-accent-gold",
  cyan:   "text-accent-cyan",
  violet: "text-accent-violet",
  red:    "text-red-400",
  muted:  "text-text-muted",
};

const ACCENT_BORDER: Record<SectionAccent, string> = {
  gold:   "border-l-accent-gold/50",
  cyan:   "border-l-accent-cyan/50",
  violet: "border-l-accent-violet/50",
  red:    "border-l-red-400/50",
  muted:  "",
};

const ACCENT_DOT: Record<SectionAccent, string> = {
  gold:   "bg-accent-gold",
  cyan:   "bg-accent-cyan",
  violet: "bg-accent-violet",
  red:    "bg-red-400",
  muted:  "bg-text-muted/60",
};

export function SectionCard({ title, className, ornament = false, accent, children }: SectionCardProps) {
  const titleColor = accent ? ACCENT_TITLE[accent] : "text-text-muted";
  const borderClass = accent && accent !== "muted" ? `border-l-2 ${ACCENT_BORDER[accent]}` : "";
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-4",
        borderClass,
        className
      )}
    >
      {title && (
        <h3 className={cn("mb-3 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider", titleColor)}>
          {ornament && <TitleOrnament />}
          {accent && accent !== "muted" && (
            <span aria-hidden className={cn("inline-block w-1.5 h-1.5 rounded-full", ACCENT_DOT[accent])} />
          )}
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
