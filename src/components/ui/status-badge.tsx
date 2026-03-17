import { cn } from "@/lib/utils";

export type BadgeVariant = "green" | "purple" | "gold" | "muted";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: "border-accent-green/30 text-accent-green bg-accent-green-dim",
  purple: "border-accent-purple/30 text-accent-purple bg-accent-purple-dim",
  gold: "border-accent-gold/30 text-accent-gold bg-accent-gold/10",
  muted: "border-border text-text-muted bg-surface",
};

export function StatusBadge({ label, variant = "muted" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        variantStyles[variant]
      )}
    >
      {label}
    </span>
  );
}
