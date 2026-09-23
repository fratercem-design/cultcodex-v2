import type { Era, EraColor } from "@/lib/eras";

const COLOR_CLASSES: Record<EraColor, string> = {
  gold:    "border-accent-gold/30    text-accent-gold-text    bg-accent-gold/10",
  violet:  "border-accent-violet/30  text-accent-violet-text  bg-accent-violet/10",
  cyan:    "border-accent-cyan/30    text-accent-cyan    bg-accent-cyan/10",
  crimson: "border-accent-crimson/30 text-accent-crimson-text bg-accent-crimson/10",
  muted:   "border-border            text-text-muted     bg-surface",
};

interface EraTagProps {
  era: Era;
  size?: "xs" | "sm";
}

export function EraTag({ era, size = "xs" }: EraTagProps) {
  const colors = COLOR_CLASSES[era.color];
  const sizeClasses = size === "sm"
    ? "px-2 py-0.5 text-[12px]"
    : "px-1.5 py-0.5 text-[12px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-mono uppercase tracking-widest ${sizeClasses} ${colors}`}
    >
      <span aria-hidden="true">{era.sigil}</span>
      {era.label}
    </span>
  );
}
