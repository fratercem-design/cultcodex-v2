import { cn } from "@/lib/utils";

interface HumanReviewBadgeProps {
  reviewedAt?: Date | null;
  /** "full" shows label + date, "short" shows label only, "dot" shows icon only */
  variant?: "full" | "short" | "dot";
  className?: string;
}

/**
 * Shown when an admin has manually read and verified the AI summary.
 * Not a guarantee of accuracy — signals that a human has reviewed the content.
 */
export function HumanReviewBadge({
  reviewedAt,
  variant = "short",
  className,
}: HumanReviewBadgeProps) {
  const dateStr = reviewedAt
    ? new Date(reviewedAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  const title = reviewedAt
    ? `Reviewed by a creator/admin in ${dateStr}`
    : "Reviewed by a creator or admin";

  if (variant === "dot") {
    return (
      <span
        title={title}
        aria-label="Human reviewed"
        className={cn(
          "inline-flex h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-emerald-400/30",
          className
        )}
      />
    );
  }

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400",
        className
      )}
    >
      {/* checkmark */}
      <svg
        className="h-2.5 w-2.5 shrink-0"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 6l3 3 5-5" />
      </svg>
      <span>
        {variant === "full" && dateStr
          ? `Reviewed · ${dateStr}`
          : "Reviewed"}
      </span>
    </span>
  );
}
